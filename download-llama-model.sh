#!/bin/bash
set -e

echo "🦙 Downloading Llama 3.1 8B Instruct model..."

# Create models directory
mkdir -p models

# Download the model if it doesn't exist
MODEL_PATH="models/llama-3.1-8b-instruct-q4_0.gguf"
if [ ! -f "$MODEL_PATH" ]; then
    echo "📥 Downloading model from Hugging Face..."
    wget -O "$MODEL_PATH" \
        "https://huggingface.co/bartowski/Llama-3.1-8B-Instruct-GGUF/resolve/main/Llama-3.1-8B-Instruct-Q4_0.gguf"
    
    echo "✅ Model downloaded successfully!"
    echo "📁 Model saved to: $(pwd)/$MODEL_PATH"
    echo "💾 Size: $(du -h "$MODEL_PATH" | cut -f1)"
else
    echo "✅ Model already exists at: $(pwd)/$MODEL_PATH"
    echo "💾 Size: $(du -h "$MODEL_PATH" | cut -f1)"
fi

echo ""
echo "🚀 You can now run: ./migrate-to-pip.sh"
