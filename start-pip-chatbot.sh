#!/bin/bash

# Pip Chatbot Startup Script
# This script starts the Rasa-based Pip chatbot with Llama integration

echo "🚀 Starting Pip Chatbot..."

# Activate virtual environment
echo "📦 Activating Python virtual environment..."
source .venv/bin/activate

# Install/update requirements if needed
echo "📦 Checking requirements..."
pip install -r requirements.txt

# Initialize RAG system with sample data if .env exists
if [ -f .env ]; then
    echo "🧠 Initializing ChromaDB knowledge base..."
    cd rasa/scripts
    python add_knowledge.py --init-sample
    cd ../..
fi

# Navigate to rasa directory
cd rasa

echo "🤖 Starting Pip Chatbot with Rasa and Llama integration..."
echo ""
echo "Pip is a healthcare workforce assistant that helps with:"
echo "  • Shift documentation and reflection"
echo "  • Schedule and availability questions" 
echo "  • Workplace support and guidance"
echo "  • Policy explanations"
echo "  • Training and development"
echo ""
echo "Starting Rasa server on port 5005..."
echo "Starting action server on port 5055..."
echo ""
echo "📱 Mobile app should connect to: http://localhost:5005/webhooks/rest/webhook"
echo ""

# Start Rasa server in background
rasa run --enable-api --cors "*" --port 5005 &

# Start action server in background  
rasa run actions --port 5055 &

# Wait a moment for servers to start
sleep 3

echo "✅ Pip Chatbot is now running!"
echo ""
echo "To test the chatbot:"
echo "1. Use the mobile app to chat with Pip"
echo "2. Or test via curl:"
echo "   curl -X POST http://localhost:5005/webhooks/rest/webhook \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"sender\": \"test\", \"message\": \"Hello Pip!\"}'"
echo ""
echo "Press Ctrl+C to stop the chatbot"

# Wait for user interrupt
wait
