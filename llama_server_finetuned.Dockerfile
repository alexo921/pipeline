FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch \
    transformers>=4.36.0 \
    peft>=0.7.0 \
    accelerate \
    bitsandbytes \
    flask \
    requests

# Copy adapter and model files
COPY healthcare_lora_adapter/ ./adapters/healthcare_lora_adapter/
COPY models/llama-3.1-8b-instruct-q4_0.gguf ./models/

# Copy server script
COPY llama_server_with_adapter.py .

# Set environment variables
ENV ADAPTER_PATH=/app/adapters/healthcare_lora_adapter
ENV MODEL_PATH=/app/models/llama-3.1-8b-instruct-q4_0.gguf

EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:1337/health || exit 1

CMD ["python", "llama_server_with_adapter.py"]
