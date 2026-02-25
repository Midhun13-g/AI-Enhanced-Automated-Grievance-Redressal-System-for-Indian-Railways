from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

MODEL_NAME = "midhun-2542/AI_Railway_Model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

class ComplaintData(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/classify")
def classify(data: ComplaintData):
    inputs = tokenizer(data.text, return_tensors="pt", truncation=True)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)

    predicted_class = torch.argmax(probs).item()
    confidence = torch.max(probs).item()

    return {
        "category": str(predicted_class),
        "confidence": round(confidence, 4)
    }