#!/bin/bash
set -e

echo "🤖 Starting Pip Chatbot Container..."

# Initialize ChromaDB if needed
echo "📦 Initializing ChromaDB..."
python scripts/add_knowledge.py --init-sample

# Using external Llama server
echo "🦙 Using external Llama server at http://host.docker.internal:1337"

# Start Rasa action server
echo "⚡ Starting Rasa Action Server..."
rasa run actions --port 5055 &
ACTION_PID=$!

# Wait for action server to start
sleep 5

# Start Rasa server
echo "🚀 Starting Rasa Server..."
rasa run --port 5005 --enable-api --cors "*" &
RASA_PID=$!

# Wait for Rasa server to start
sleep 10

echo "✅ Pip Chatbot is running!"
echo "📱 Mobile app should connect to: http://localhost:5005/webhooks/rest/webhook"
echo "🦙 Llama API available at: http://localhost:8080/v1/chat/completions"

# Keep container running and handle shutdown
trap "echo '🛑 Shutting down...'; kill $ACTION_PID $RASA_PID; exit 0" SIGTERM SIGINT

# Wait for processes and keep container alive
echo "🔄 Container is running. Waiting for processes..."
wait $ACTION_PID $RASA_PID
