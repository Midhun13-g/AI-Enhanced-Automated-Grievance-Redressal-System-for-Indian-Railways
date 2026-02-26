from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

MODEL_NAME = "midhun-2542/AI_Railway_Model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# 🔹 Department Mapping (index must match training labels)
DEPARTMENTS = {
    0: "Catering",
    1: "Cleanliness",
    2: "Coach",
    3: "Electrical",
    4: "General",
    5: "Maintenance",
    6: "Medical",
    7: "Security",
    8: "Ticketing",
    9: "Water"
}

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

    # 🔹 Get Department
    department = DEPARTMENTS.get(predicted_class, "General")

    # 🔹 Priority Logic Based on Department + Confidence
    if department in ["Medical", "Security"]:
        priority = "high"
    elif confidence > 0.85:
        priority = "medium"
    else:
        priority = "low"

    return {
        "department": department,
        "priority": priority,
        "confidence": round(confidence, 4)
    }