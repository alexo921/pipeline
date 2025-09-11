#!/bin/bash

echo "🎯 YourPipeline Analytics V1 - Demo Status Check"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend/api directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check if demo data exists
echo "🗄️  Checking database for demo data..."
DEMO_FACILITY_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM facilities WHERE name = 'St. Mary''s Health Center';" 2>/dev/null | grep -o '[0-9]*' | tail -1)

if [ "$DEMO_FACILITY_COUNT" = "1" ]; then
    echo "✅ Demo facility found in database"
else
    echo "❌ Demo facility not found. Run ./setup-demo.sh first"
    exit 1
fi

# Check if backend server is running
echo ""
echo "🔧 Checking backend server status..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 3001"
else
    echo "⚠️  Backend server not running. Start with: npm run start:dev"
fi

# Check if frontend is running
echo ""
echo "🌐 Checking frontend server status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server is running on port 3000"
else
    echo "⚠️  Frontend server not running. Start with: cd ../frontend/web-dashboard && npm run dev"
fi

echo ""
echo "🎉 Demo Status Summary:"
echo "======================"
echo "📊 Database: Demo data seeded"
echo "🔧 Backend: $(curl -s http://localhost:3001/api/health > /dev/null 2>&1 && echo "Running" || echo "Not running")"
echo "🌐 Frontend: $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Running" || echo "Not running")"
echo ""
echo "🎯 Demo URL: http://localhost:3000/analytics"
echo ""
echo "📋 Next Steps:"
echo "1. If backend not running: npm run start:dev"
echo "2. If frontend not running: cd ../frontend/web-dashboard && npm run dev"
echo "3. Visit: http://localhost:3000/analytics"
echo ""
echo "🎮 Demo Features Available:"
echo "• KPI Dashboard with retention forecasts"
echo "• Insight Feed with automated alerts"
echo "• Cohort Analysis and hiring funnel"
echo "• Hotspot Matrix by unit/role"
echo "• Action Center for interventions"
echo "• Interactive filtering and controls"
