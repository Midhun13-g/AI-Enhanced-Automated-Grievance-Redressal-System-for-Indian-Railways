from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# ==============================
# Environment Variable
# ==============================
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable not set")

MODEL_NAME = "midhun-2542/AI_Railway_Model"
API_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_NAME}"

HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}


# ==============================
# Request Schema
# ==============================
class ComplaintData(BaseModel):
    text: str


# ==============================
# Health Check
# ==============================
@app.get("/health")
def health():
    return {"status": "ok"}


# ==============================
# Classification Endpoint
# ==============================
@app.post("/classify")
def classify(data: ComplaintData):
    payload = {
        "inputs": data.text
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    result = response.json()

    # Handle HF error format
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])

    try:
        # HF returns list of list
        predictions = result[0]
        best = max(predictions, key=lambda x: x["score"])

        return {
            "category": best["label"],
            "confidence": round(float(best["score"]), 4)
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected response format: {result}"
        )