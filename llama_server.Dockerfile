FROM python:3.10-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install llama-cpp-python with CPU optimizations
RUN pip install llama-cpp-python[server]

# Create model directory
RUN mkdir -p /app/models

EXPOSE 1337

# Command will be specified in docker-compose to point to the model
CMD ["python3", "-m", "llama_cpp.server", \
     "--host", "0.0.0.0", \
     "--port", "1337", \
     "--model", "/app/models/llama-3.1-8b-instruct-q5_k_m.gguf", \
     "--n_ctx", "2048", \
     "--n_gpu_layers", "0"]

