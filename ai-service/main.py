# ai-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# =============================
# Environment Variables
# =============================
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable not set")

MODEL_NAME = "midhun-2542/AI_Railway_Model"

# ✅ NEW WORKING ENDPOINT
API_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_NAME}"

HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}


class ComplaintData(BaseModel):
    text: str


def query_hf(text: str):
    payload = {"inputs": text}

    response = requests.post(API_URL, headers=HEADERS, json=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify")
def classify(data: ComplaintData):
    result = query_hf(data.text)

    # Hugging Face returns list of label scores
    try:
        best = max(result[0], key=lambda x: x["score"])
        return {
            "category": best["label"],
            "confidence": float(best["score"])
        }
    except Exception:
        return {"raw_response": result}