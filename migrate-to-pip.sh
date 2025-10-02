#!/bin/bash
set -e

echo "🔄 Migrating from Jan to Pip Chatbot..."

# Stop and remove Jan container
echo "🛑 Stopping Jan container..."
docker stop pipeline-jan-backend || true
docker rm pipeline-jan-backend || true

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build new Pip chatbot
echo "🏗️  Building Pip chatbot..."
docker-compose build pip-chatbot

# Start the new stack
echo "🚀 Starting Pip chatbot stack..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo "✅ Migration complete!"
echo ""
echo "📱 Services available:"
echo "  - Pip Chatbot: http://localhost:5005"
echo "  - Mobile App: http://localhost:3000"
echo "  - Web Dashboard: http://localhost:3001"
echo ""
echo "🧪 Test the chatbot:"
echo "  curl -X POST http://localhost:5005/webhooks/rest/webhook \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"sender\": \"test\", \"message\": \"Hello Pip!\"}'"
