import json
import os
import socket
import threading
import time
import urllib.error
import urllib.request

from fastapi import FastAPI
from kafka import KafkaConsumer
from pydantic import BaseModel

app = FastAPI()

KAFKA_ENABLED = os.getenv("KAFKA_ENABLED", "true").lower() == "true"
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "complaint-classification")
KAFKA_GROUP = os.getenv("KAFKA_GROUP_ID", "railway-ml-service")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8081")
INTERNAL_KEY = os.getenv("BACKEND_INTERNAL_KEY", "railway-internal-key")
CLASSIFIER_URL = os.getenv("CLASSIFIER_URL", "https://midhun-2542-railwaymodel.hf.space/classify")
KAFKA_RETRY_INITIAL_SECONDS = int(os.getenv("KAFKA_RETRY_INITIAL_SECONDS", "5"))
KAFKA_RETRY_MAX_SECONDS = int(os.getenv("KAFKA_RETRY_MAX_SECONDS", "60"))

consumer_state = {
    "connected": False,
    "lastError": None,
    "lastAttemptAt": None,
}

DEPARTMENT_KEYWORDS = (
    ("Security", (
        "security", "theft", "steal", "stole", "stolen", "thief", "snatch", "snatched",
        "rob", "robbed", "fight", "harass", "harassed", "harassment", "unsafe", "police",
        "rpf", "sos", "pickpocket", "pick-pocket", "firecracker", "firecrackers", "weapon",
        "knife", "gun", "bomb", "explosive", "threat", "threaten", "threatened", "attack",
        "attacked", "suspicious", "assault", "molest", "molestation"
    )),
    ("Medical", (
        "medical", "doctor", "ambulance", "heart attack", "injury", "blood", "faint",
        "poison", "poisoning", "first aid", "fever", "collapsed"
    )),
    ("Water", (
        "water", "no water", "drinking", "tap", "toilet water", "flush"
    )),
    ("Cleanliness", (
        "clean", "dirty", "toilet", "restroom", "sanitation", "garbage", "smell",
        "filthy", "unclean", "washroom", "hygiene"
    )),
    ("Catering", (
        "food", "catering", "meal", "vendor", "pantry", "breakfast", "lunch", "dinner"
    )),
    ("Electrical", (
        "light", "fan", "charging", "socket", "electric", "power", "switchboard", "spark"
    )),
    ("Coach", (
        "coach", "berth", "seat", "window", "door", "ac", "ladder"
    )),
    ("Ticketing", (
        "ticket", "refund", "pnr", "reservation", "booking"
    )),
    ("Maintenance", (
        "repair", "maintenance", "broken", "damage", "damaged", "leak", "leaking", "cracked"
    )),
)


class ComplaintData(BaseModel):
    text: str


def map_priority_to_urgency(priority: str | None) -> int:
    if priority == "high":
        return 95
    if priority == "medium":
        return 70
    return 35


def json_request(url: str, method: str = "GET", payload: dict | None = None, headers: dict | None = None) -> tuple[int, str]:
    body = None
    request_headers = headers.copy() if headers else {}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=body, headers=request_headers, method=method)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.read().decode("utf-8")


def backend_request(url: str, method: str = "GET", payload: dict | None = None) -> tuple[int, str]:
    headers = {
        "X-Internal-Key": INTERNAL_KEY,
    }
    return json_request(url, method=method, payload=payload, headers=headers)


def fetch_complaint(complaint_id: int) -> dict:
    _, body = backend_request(f"{BACKEND_URL}/internal/ml/complaints/{complaint_id}")
    return json.loads(body)


def infer_priority_for_department(department: str | None) -> str:
    if department in {"Medical", "Security"}:
        return "high"
    if department in {"Electrical", "Coach", "Maintenance", "Water"}:
        return "medium"
    return "low"


def infer_department_override(text: str) -> str | None:
    normalized = text.lower()
    for department, keywords in DEPARTMENT_KEYWORDS:
        if any(keyword in normalized for keyword in keywords):
            return department
    return None


def classify_text(text: str) -> dict:
    _, body = json_request(CLASSIFIER_URL, method="POST", payload={"text": text})
    payload = json.loads(body)

    department = payload.get("department") or payload.get("category") or "General"
    priority = payload.get("priority")
    if priority is None:
        priority = "low"

    override_department = infer_department_override(text)
    if override_department is not None and override_department != department:
        department = override_department
        priority = infer_priority_for_department(department)
        payload["overrideReason"] = "keyword-department-override"
        payload["overrideDepartment"] = department

    return {
        "department": department,
        "priority": priority,
        "confidence": payload.get("confidence"),
        "raw": payload,
    }


def update_classification(complaint_id: int, result: dict) -> None:
    payload = {
        "department": result["department"],
        "priority": result["priority"],
        "urgencyScore": map_priority_to_urgency(result["priority"]),
        "aiMetadata": json.dumps(
            {
                "status": "COMPLETED",
                "source": "huggingface-space",
                "classifierUrl": CLASSIFIER_URL,
                "result": result,
            }
        ),
    }
    backend_request(
        f"{BACKEND_URL}/internal/ml/complaints/{complaint_id}/classification",
        method="PATCH",
        payload=payload,
    )


def decode_message(message_value: bytes) -> dict:
    payload_text = message_value.decode("utf-8").strip()
    if payload_text.startswith("{"):
        payload = json.loads(payload_text)
        return {
            "id": int(payload["id"]),
            "complaintText": payload.get("complaintText", ""),
        }
    return {
        "id": int(payload_text),
        "complaintText": "",
    }


def set_consumer_state(connected: bool, last_error: str | None = None) -> None:
    consumer_state["connected"] = connected
    consumer_state["lastError"] = last_error
    consumer_state["lastAttemptAt"] = int(time.time())


def broker_is_reachable() -> bool:
    host, port_text = KAFKA_BROKER.rsplit(":", 1)
    with socket.create_connection((host, int(port_text)), timeout=5):
        return True


def consume_loop() -> None:
    retry_delay = max(1, KAFKA_RETRY_INITIAL_SECONDS)
    while True:
        consumer = None
        try:
            set_consumer_state(False)
            print(
                f"Starting Kafka consumer for topic={KAFKA_TOPIC} broker={KAFKA_BROKER} "
                f"group={KAFKA_GROUP}"
            )
            broker_is_reachable()
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BROKER,
                group_id=KAFKA_GROUP,
                auto_offset_reset="earliest",
                enable_auto_commit=False,
            )
            retry_delay = max(1, KAFKA_RETRY_INITIAL_SECONDS)
            set_consumer_state(True)
            print(f"Kafka consumer connected to broker={KAFKA_BROKER}")
            for message in consumer:
                try:
                    payload = decode_message(message.value)
                    complaint_id = payload["id"]
                    complaint_text = payload["complaintText"]
                    if not complaint_text:
                        complaint = fetch_complaint(complaint_id)
                        complaint_text = complaint["complaintText"]
                    result = classify_text(complaint_text)
                    update_classification(complaint_id, result)
                    consumer.commit()
                except urllib.error.HTTPError as exc:
                    print(f"HTTP request failed for message at offset {message.offset}: {exc.code} {exc.reason}")
                    time.sleep(5)
                except urllib.error.URLError as exc:
                    print(f"Network request failed for message at offset {message.offset}: {exc}")
                    time.sleep(5)
                except Exception as exc:
                    print(f"Message processing failed at offset {message.offset}: {exc}")
                    time.sleep(5)
        except urllib.error.HTTPError as exc:
            set_consumer_state(False, f"HTTPError: {exc.code} {exc.reason}")
            print(f"HTTP request failed: {exc.code} {exc.reason}")
            time.sleep(5)
        except urllib.error.URLError as exc:
            set_consumer_state(False, f"URLError: {exc}")
            print(f"Network request failed: {exc}")
            time.sleep(5)
        except OSError as exc:
            set_consumer_state(False, f"OSError: {exc}")
            print(
                f"Kafka broker {KAFKA_BROKER} is not reachable yet: {exc}. "
                f"Retrying in {retry_delay}s."
            )
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, max(retry_delay, KAFKA_RETRY_MAX_SECONDS))
        except Exception as exc:
            set_consumer_state(False, str(exc))
            print(f"Kafka consumer loop failed: {exc}")
            print(f"Retrying Kafka consumer in {retry_delay}s.")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, max(retry_delay, KAFKA_RETRY_MAX_SECONDS))
        finally:
            if consumer is not None:
                consumer.close()


@app.on_event("startup")
def startup_consumer() -> None:
    if not KAFKA_ENABLED:
        return
    thread = threading.Thread(target=consume_loop, daemon=True)
    thread.start()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "kafkaEnabled": KAFKA_ENABLED,
        "kafkaConnected": consumer_state["connected"],
        "kafkaBroker": KAFKA_BROKER,
        "kafkaGroup": KAFKA_GROUP,
        "kafkaLastError": consumer_state["lastError"],
        "kafkaLastAttemptAt": consumer_state["lastAttemptAt"],
        "topic": KAFKA_TOPIC,
        "classifierUrl": CLASSIFIER_URL,
    }


@app.post("/classify")
def classify(data: ComplaintData):
    return classify_text(data.text)
