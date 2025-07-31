#!/bin/bash

echo "🔍 Testing Analytics Dashboard Deployment..."
echo "=========================================="

# Test API endpoints
echo "1. Testing Analytics API Endpoints:"
echo "   - Summary endpoint (should return 401 - requires auth):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/analytics/summary
echo " (Expected: 401)"

echo "   - Track view endpoint (should return 401 - requires auth):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/analytics/track/view
echo " (Expected: 401)"

# Test frontend accessibility
echo ""
echo "2. Testing Frontend Analytics Page:"
echo "   - Analytics page should be accessible at: http://localhost:3000/analytics"
echo "   - Requires admin login: admin@pipeline.com / admin123"

# Check container status
echo ""
echo "3. Container Status:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Check API logs for analytics routes
echo ""
echo "4. Analytics Routes in API Logs:"
docker logs pipeline-api 2>&1 | grep -i analytics | tail -5

echo ""
echo "✅ Analytics Dashboard Deployment Test Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Visit http://localhost:3000/analytics"
echo "   2. Login with admin@pipeline.com / admin123"
echo "   3. Test job tracking by viewing and applying to jobs"
echo "   4. Check analytics data in the dashboard" 