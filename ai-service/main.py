# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# =============================
# Environment Variables
# =============================
HF_TOKEN = os.getenv("HF_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL")

API_URL = "https://api-inference.huggingface.co/models/midhun-2542/AI_Railway_Model"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}


class ComplaintData(BaseModel):
    text: str


def query_hf(text):
    payload = {"inputs": text}
    response = requests.post(API_URL, headers=HEADERS, json=payload)
    return response.json()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify")
def classify(data: ComplaintData):
    result = query_hf(data.text)
    return {"prediction": result}