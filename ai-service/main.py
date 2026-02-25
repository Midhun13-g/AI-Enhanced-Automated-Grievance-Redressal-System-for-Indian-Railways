from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

app = FastAPI()

# ==============================
# Environment Variable
# ==============================
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable not set")

MODEL_NAME = "midhun-2542/AI_Railway_Model"

# ==============================
# Load Model at Startup
# ==============================
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    token=HF_TOKEN
)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    token=HF_TOKEN
)

model.eval()

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
    try:
        inputs = tokenizer(
            data.text,
            return_tensors="pt",
            truncation=True,
            padding=True
        )

        with torch.no_grad():
            outputs = model(**inputs)

        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=1)
        confidence, predicted_class = torch.max(probabilities, dim=1)

        label = model.config.id2label[int(predicted_class)]

        return {
            "category": label,
            "confidence": round(float(confidence), 4)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))