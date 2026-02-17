# ai-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from kafka import KafkaConsumer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import threading
import requests
import json
import os

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "complaint-classification")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080/complaints/")
MODEL_NAME = "bert-base-multilingual-cased"

LABELS = ["Emergency", "Security", "Maintenance", "Inquiry"]

app = FastAPI()
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=len(LABELS))

class KafkaThread(threading.Thread):
    def run(self):
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BROKER,
            auto_offset_reset='earliest',
            group_id='ai-service',
            value_deserializer=lambda m: int(m.decode('utf-8'))
        )
        for message in consumer:
            complaint_id = message.value
            self.process_complaint(complaint_id)

    def process_complaint(self, complaint_id):
        # Fetch complaint text from backend
        try:
            resp = requests.get(f"{BACKEND_URL}{complaint_id}")
            if resp.status_code != 200:
                return
            complaint = resp.json()
            text = complaint.get("complaintText", "")
            if not text:
                return
            # AI classification
            inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
            with torch.no_grad():
                outputs = model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=1)[0]
                score, label_idx = torch.max(probs, 0)
                label = LABELS[label_idx]
                urgency_score = int(score.item() * 100)
                # Fallback rule-based if confidence < 0.6
                if score.item() < 0.6:
                    if "urgent" in text.lower() or "emergency" in text.lower():
                        label = "Emergency"
                        urgency_score = 90
                    elif "security" in text.lower():
                        label = "Security"
                        urgency_score = 80
                    elif "clean" in text.lower() or "maintenance" in text.lower():
                        label = "Maintenance"
                        urgency_score = 50
                    else:
                        label = "Inquiry"
                        urgency_score = 30
                # Log prediction
                print(f"Complaint {complaint_id}: {label} ({urgency_score})")
                # Update backend
                ai_metadata = json.dumps({"label": label, "score": urgency_score})
                requests.patch(f"{BACKEND_URL}{complaint_id}/status", json={"newStatus": "OPEN"})
                requests.patch(f"{BACKEND_URL}{complaint_id}", json={"aiMetadata": ai_metadata, "urgencyScore": urgency_score})
        except Exception as e:
            print(f"AI Service error: {e}")

@app.on_event("startup")
def start_kafka():
    thread = KafkaThread()
    thread.daemon = True
    thread.start()

class HealthCheck(BaseModel):
    status: str

@app.get("/health", response_model=HealthCheck)
def health():
    return {"status": "ok"}
