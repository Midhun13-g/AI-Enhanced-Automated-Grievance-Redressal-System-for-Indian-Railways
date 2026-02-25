FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for torch)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HuggingFace Spaces require port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]