#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { join } from 'path';

async function runDemo() {
  console.log('🚀 Starting YourPipeline Analytics Demo Setup...\n');

  try {
    // Step 1: Generate Prisma client
    console.log('📦 Step 1: Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Prisma client generated\n');

    // Step 2: Push database schema
    console.log('🗄️  Step 2: Updating database schema...');
    execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Database schema updated\n');

    // Step 3: Seed demo data
    console.log('🌱 Step 3: Seeding demo data...');
    execSync('npx ts-node src/scripts/seed-demo-data.ts', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Demo data seeded\n');

    // Step 4: Start the backend server
    console.log('🔧 Step 4: Starting backend server...');
    console.log('   Backend will be available at: http://localhost:3001');
    console.log('   Analytics API endpoints:');
    console.log('   - GET /api/analytics/kpis/:facilityId');
    console.log('   - GET /api/analytics/insights/:facilityId');
    console.log('   - GET /api/analytics/cohorts/:facilityId');
    console.log('   - GET /api/analytics/hotspots/:facilityId');
    console.log('   - GET /api/analytics/actions/:facilityId\n');

    console.log('🎉 Demo setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the frontend: cd ../frontend/web-dashboard && npm run dev');
    console.log('2. Visit: http://localhost:3000/analytics');
    console.log('3. Login with any user account to access the analytics dashboard');
    console.log('\n🎯 Demo Features:');
    console.log('• Real-time KPI cards showing retention forecasts and risk metrics');
    console.log('• Insight feed with automated alerts and suggested actions');
    console.log('• Cohort analysis showing hiring funnel and retention trends');
    console.log('• Hotspot matrix highlighting problem areas by unit/role');
    console.log('• Action center for managing interventions and escalations');
    console.log('• Interactive filtering by date range, role, and unit');

  } catch (error) {
    console.error('❌ Demo setup failed:', error);
    process.exit(1);
  }
}

runDemo();
