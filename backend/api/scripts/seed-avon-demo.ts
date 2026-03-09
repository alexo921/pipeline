/**
 * Seed Avon Health Center demo account for YourPipeline testing.
 * Creates facility, admin user, and sample data.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-avon-demo.ts
 *
 * Demo login:
 *   Email: demo@avonhealthcenter.com
 *   Password: AvonDemo2025!
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@avonhealthcenter.com';
const DEMO_PASSWORD = 'AvonDemo2025!';

async function seedAvonDemo() {
  console.log('🌱 Seeding Avon Health Center demo account...');

  try {
    // 1. Create or get facility
    let facility = await prisma.facilities.findFirst({
      where: { name: 'Avon Health Center' },
    });
    if (!facility) {
      facility = await prisma.facilities.create({
        data: {
          name: 'Avon Health Center',
          type: 'ltc',
          location: 'Avon, CT',
          contactEmail: DEMO_EMAIL,
          contactPhone: '(860) 555-0199',
        },
      });
    }

    console.log('✅ Facility:', facility.name);

    // 2. Create admin user (or update if exists)
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    const existingUser = await prisma.users.findFirst({
      where: { email: DEMO_EMAIL, role: 'ADMIN' },
    });

    let adminUser;
    if (existingUser) {
      adminUser = await prisma.users.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, firstName: 'Avon', lastName: 'Demo' },
      });
      console.log('✅ Updated existing admin user:', adminUser.email);
    } else {
      adminUser = await prisma.users.create({
        data: {
          email: DEMO_EMAIL,
          password: hashedPassword,
          firstName: 'Avon',
          lastName: 'Demo',
          role: 'ADMIN',
        },
      });
      console.log('✅ Created admin user:', adminUser.email);
    }

    // 3. Create sample employees for Avon Health Center
    const employeeCount = await prisma.employees.count({
      where: { facilityId: facility.id },
    });

    if (employeeCount === 0) {
      const employees = await Promise.all([
        prisma.employees.create({
          data: {
            facilityId: facility.id,
            firstName: 'Maria',
            lastName: 'Santos',
            email: 'maria.santos@avonhealthcenter.com',
            role: 'RN',
            department: 'Skilled Nursing',
            unit: 'West Wing',
            hireDate: new Date('2023-02-15'),
            status: 'active',
            retentionRisk: 0.2,
          },
        }),
        prisma.employees.create({
          data: {
            facilityId: facility.id,
            firstName: 'James',
            lastName: 'Wilson',
            email: 'james.wilson@avonhealthcenter.com',
            role: 'CNA',
            department: 'Skilled Nursing',
            unit: 'West Wing',
            hireDate: new Date('2023-05-20'),
            status: 'active',
            retentionRisk: 0.35,
          },
        }),
        prisma.employees.create({
          data: {
            facilityId: facility.id,
            firstName: 'Patricia',
            lastName: 'Nguyen',
            email: 'patricia.nguyen@avonhealthcenter.com',
            role: 'LPN',
            department: 'Rehabilitation',
            unit: 'Rehab',
            hireDate: new Date('2023-08-10'),
            status: 'active',
            retentionRisk: 0.7,
          },
        }),
      ]);
      console.log('✅ Created', employees.length, 'sample employees');
    } else {
      console.log('ℹ️  Employees already exist for facility');
    }

    // 4. Create sample action items
    const actionCount = await prisma.action_items.count({
      where: { facilityId: facility.id },
    });

    if (actionCount === 0) {
      await prisma.action_items.create({
        data: {
          facilityId: facility.id,
          actionType: 'escalate',
          category: 'retention',
          title: 'Rehab Unit Retention Alert',
          description: 'Retention risk elevated in Rehab unit. Review with unit manager.',
          priority: 'high',
          status: 'pending',
          assignedTo: 'supervisor@avonhealthcenter.com',
        },
      });
      console.log('✅ Created sample action item');
    }

    console.log('');
    console.log('🎉 Avon Health Center demo account ready!');
    console.log('');
    console.log('📋 Login credentials for YourPipeline:');
    console.log('   URL:      https://pipelineworkforce.com/your-pipeline (or your deployed URL)');
    console.log('   Email:    ' + DEMO_EMAIL);
    console.log('   Password: ' + DEMO_PASSWORD);
    console.log('');
    console.log('Share these credentials with the Avon Health Center team for testing.');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAvonDemo()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
