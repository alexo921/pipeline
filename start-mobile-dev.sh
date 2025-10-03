#!/bin/bash

echo "🚀 Starting Pipeline Mobile App Development Environment"
echo "📱 This will give you a QR code for Expo Go app"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start the development mobile app
echo "🔨 Building and starting mobile app development container..."
docker-compose --profile dev up -d mobile-app-dev

# Wait for the container to start
echo "⏳ Waiting for Expo server to start..."
sleep 15

# Get the container logs to show the QR code
echo "📱 Getting QR code from Expo server..."
echo "=================================="
docker logs pipeline-mobile-app-dev 2>&1 | grep -A 10 -B 5 "QR" || echo "QR code not found in logs yet..."

echo "=================================="
echo "🌐 Expo DevTools should be available at:"
echo "   - http://localhost:8081 (Expo Dev Server)"
echo "   - http://localhost:19000 (Metro Bundler)"
echo "   - http://localhost:19001 (Expo DevTools)"
echo ""
echo "📱 To get the QR code:"
echo "   1. Open Expo Go app on your phone"
echo "   2. Scan the QR code from the logs above"
echo "   3. Or visit http://localhost:8081 in your browser"
echo ""
echo "🔍 To see live logs: docker logs -f pipeline-mobile-app-dev"
echo "🛑 To stop: docker-compose --profile dev down"
