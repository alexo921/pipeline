# Pip Chatbot Dockerfile
# Multi-stage build for Rasa + Llama integration

# Stage 1: Python environment with Rasa and dependencies
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Rasa project files
COPY rasa/ ./rasa/

# Create necessary directories
RUN mkdir -p /app/rasa/models /app/rasa/logs /app/rasa/data/chromadb

# Set working directory to rasa
WORKDIR /app/rasa

# Download Llama model (if not present)
RUN if [ ! -f "/app/models/llama-3.1-8b-instruct-q4_0.gguf" ]; then \
    mkdir -p /app/models && \
    echo "Llama model not found. Please mount it as a volume or download it separately."; \
    fi

# Create startup script
COPY rasa/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 5005 5055 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5005/status || exit 1

# Use startup script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
