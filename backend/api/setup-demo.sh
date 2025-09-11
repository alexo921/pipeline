#!/bin/bash

echo "🚀 YourPipeline Analytics V1 Demo Launcher"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend/api directory"
    exit 1
fi

echo "📁 Working directory: $(pwd)"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Updating database schema..."
npx prisma db push

echo ""
echo "🌱 Seeding demo data..."
npx ts-node src/scripts/seed-demo-data.ts

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend server: npm run start:dev"
echo "2. In another terminal, start the frontend:"
echo "   cd ../frontend/web-dashboard && npm run dev"
echo "3. Visit: http://localhost:3000/analytics"
echo ""
echo "🎯 Demo Features Available:"
echo "• Real-time KPI cards with retention forecasts"
echo "• Automated insight generation with actions"
echo "• Cohort analysis and hiring funnel metrics"
echo "• Hotspot matrix showing risk by unit/role"
echo "• Action center for managing interventions"
echo "• Interactive filtering and export capabilities"
echo ""
echo "📊 Demo Data Includes:"
echo "• St. Mary's Health Center (8 employees)"
echo "• ICU Unit: High performance (low risk)"
echo "• Rehab Unit: At risk (high risk, low sentiment)"
echo "• Med-Surg Unit: Moderate performance"
echo "• 3 Active insights with suggested actions"
echo "• 3 Pending action items for intervention"
echo ""
