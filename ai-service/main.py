import json
import os
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


def classify_text(text: str) -> dict:
    _, body = json_request(CLASSIFIER_URL, method="POST", payload={"text": text})
    payload = json.loads(body)

    department = payload.get("department") or payload.get("category") or "General"
    priority = payload.get("priority")
    if priority is None:
        priority = "low"

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


def consume_loop() -> None:
    while True:
        consumer = None
        try:
            print(f"Starting Kafka consumer for topic={KAFKA_TOPIC} broker={KAFKA_BROKER} group={KAFKA_GROUP}")
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BROKER,
                group_id=KAFKA_GROUP,
                auto_offset_reset="earliest",
                enable_auto_commit=False,
            )
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
            print(f"HTTP request failed: {exc.code} {exc.reason}")
            time.sleep(5)
        except urllib.error.URLError as exc:
            print(f"Network request failed: {exc}")
            time.sleep(5)
        except Exception as exc:
            print(f"Kafka consumer loop failed: {exc}")
            time.sleep(5)
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
        "topic": KAFKA_TOPIC,
        "classifierUrl": CLASSIFIER_URL,
    }


@app.post("/classify")
def classify(data: ComplaintData):
    return classify_text(data.text)
