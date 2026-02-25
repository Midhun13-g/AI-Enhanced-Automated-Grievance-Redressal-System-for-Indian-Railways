# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from kafka import KafkaConsumer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import threading
import requests
import json
import os

# =============================
# Environment Variables
# =============================

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "complaint-classification")

# 🔥 FIXED API URL (Production Ready)
BACKEND_URL = os.getenv("BACKEND_URL")  
# Example for Render:
# https://your-backend.onrender.com/complaints/

MODEL_NAME = "midhun-2542/AI_Railway_Model"
HF_TOKEN = os.getenv("HF_TOKEN")  # Required if model repo is private

app = FastAPI()

# =============================
# Load Model from Hugging Face
# =============================

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    token=HF_TOKEN
)

print("Loading model...")
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    token=HF_TOKEN
)

model.eval()
print("Model loaded successfully.")