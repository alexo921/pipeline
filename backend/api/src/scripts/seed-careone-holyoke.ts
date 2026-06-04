import { PrismaClient, HealthcareRole, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FACILITY_ID = 'careone-holyoke-facility';
const DEMO_EMAIL = 'admin@careone-holyoke.demo';
const DEMO_PASSWORD = 'CareOneDemo2025!';

async function seedCareOneHolyoke() {
  console.log('Seeding CareOne At Holyoke demo data...');

  try {
    // ──────────────────────────────────────────────────
    // Facility
    // ──────────────────────────────────────────────────
    const facility = await prisma.facilities.upsert({
      where: { id: FACILITY_ID },
      update: {},
      create: {
        id: FACILITY_ID,
        name: 'CareOne At Holyoke',
        type: 'ltc',
        location: 'Holyoke, MA',
        contactEmail: DEMO_EMAIL,
        contactPhone: '(413) 555-0180',
      },
    });

    console.log('Facility:', facility.name);

    // ──────────────────────────────────────────────────
    // Demo employer login
    // ──────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const demoUser = await prisma.users.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: {
        email: DEMO_EMAIL,
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Reynolds',
        role: Role.EMPLOYER,
        emailVerified: true,
      },
    });

    console.log('Demo user:', demoUser.email);
    console.log('Password:', DEMO_PASSWORD);

    // ──────────────────────────────────────────────────
    // Employees — realistic SNF staff at CareOne Holyoke
    // ──────────────────────────────────────────────────
    const employeeData: Array<{
      firstName: string;
      lastName: string;
      email: string;
      role: HealthcareRole;
      department: string;
      unit: string;
      hireDate: Date;
      retentionRisk: number;
    }> = [
      // Memory Care — high risk
      { firstName: 'Maria',    lastName: 'Santos',   email: 'msantos@careone-holyoke.demo',   role: HealthcareRole.CNA, department: 'Memory Care',    unit: 'Memory Care',     hireDate: new Date('2023-08-14'), retentionRisk: 0.82 },
      { firstName: 'DeShawn',  lastName: 'Pryor',    email: 'dpryor@careone-holyoke.demo',    role: HealthcareRole.CNA, department: 'Memory Care',    unit: 'Memory Care',     hireDate: new Date('2024-01-06'), retentionRisk: 0.78 },
      { firstName: 'Anya',     lastName: 'Kowalski', email: 'akowalski@careone-holyoke.demo', role: HealthcareRole.LPN, department: 'Memory Care',    unit: 'Memory Care',     hireDate: new Date('2023-11-20'), retentionRisk: 0.71 },

      // Short-Term Rehab — medium risk
      { firstName: 'James',    lastName: 'Okafor',   email: 'jokafor@careone-holyoke.demo',   role: HealthcareRole.RN,  department: 'Rehabilitation', unit: 'Short-Term Rehab', hireDate: new Date('2023-05-01'), retentionRisk: 0.48 },
      { firstName: 'Patricia', lastName: 'Dumont',   email: 'pdumont@careone-holyoke.demo',   role: HealthcareRole.LPN, department: 'Rehabilitation', unit: 'Short-Term Rehab', hireDate: new Date('2023-09-18'), retentionRisk: 0.55 },
      { firstName: 'Tyrone',   lastName: 'Williams', email: 'twilliams@careone-holyoke.demo', role: HealthcareRole.CNA, department: 'Rehabilitation', unit: 'Short-Term Rehab', hireDate: new Date('2024-02-12'), retentionRisk: 0.42 },

      // Long-Term Care — low risk
      { firstName: 'Linda',    lastName: 'Nguyen',   email: 'lnguyen@careone-holyoke.demo',   role: HealthcareRole.RN,  department: 'Long-Term Care', unit: 'LTC',             hireDate: new Date('2022-03-07'), retentionRisk: 0.18 },
      { firstName: 'Carlos',   lastName: 'Medina',   email: 'cmedina@careone-holyoke.demo',   role: HealthcareRole.CNA, department: 'Long-Term Care', unit: 'LTC',             hireDate: new Date('2021-11-30'), retentionRisk: 0.12 },
      { firstName: 'Helen',    lastName: 'Bouchard',  email: 'hbouchard@careone-holyoke.demo', role: HealthcareRole.LPN, department: 'Long-Term Care', unit: 'LTC',             hireDate: new Date('2022-06-22'), retentionRisk: 0.22 },

      // Skilled Nursing — medium/high risk
      { firstName: 'Marcus',   lastName: 'Brown',    email: 'mbrown@careone-holyoke.demo',    role: HealthcareRole.RN,  department: 'Skilled Nursing', unit: 'Skilled Nursing', hireDate: new Date('2023-07-03'), retentionRisk: 0.65 },
      { firstName: 'Rosa',     lastName: 'Espinoza', email: 'respinoza@careone-holyoke.demo', role: HealthcareRole.CNA, department: 'Skilled Nursing', unit: 'Skilled Nursing', hireDate: new Date('2024-03-15'), retentionRisk: 0.58 },
    ];

    const employees = await Promise.all(
      employeeData.map((emp) =>
        prisma.employees.create({
          data: { facilityId: FACILITY_ID, ...emp, status: 'active' },
        })
      )
    );

    console.log('Employees created:', employees.length);

    // ──────────────────────────────────────────────────
    // Pulse survey
    // ──────────────────────────────────────────────────
    const survey = await prisma.pulse_surveys.create({
      data: {
        facilityId: FACILITY_ID,
        title: 'Monthly Wellbeing Check-In -- June 2025',
        questions: [
          { type: 'rating', question: 'How satisfied are you with your work environment this month?', scale: { min: 1, max: 5 } },
          { type: 'rating', question: 'How supported do you feel by your supervisor?',                scale: { min: 1, max: 5 } },
          { type: 'rating', question: 'How manageable is your current workload?',                     scale: { min: 1, max: 5 } },
          { type: 'text',   question: 'What is one thing we could do to make your job better?' },
        ],
        targetRoles: [HealthcareRole.CNA, HealthcareRole.LPN, HealthcareRole.RN],
        targetUnits: ['Memory Care', 'Short-Term Rehab', 'LTC', 'Skilled Nursing'],
        status: 'completed',
        scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
    });

    const surveyResponses = [
      // Memory Care -- low sentiment
      { idx: 0, responses: { satisfaction: 2, support: 2, workload: 1, improvement: "We need more staff on nights. We're running short constantly." }, score: 0.28 },
      { idx: 1, responses: { satisfaction: 2, support: 3, workload: 2, improvement: "It's really hard when we're short-staffed on Memory Care."    }, score: 0.35 },
      { idx: 2, responses: { satisfaction: 3, support: 2, workload: 2, improvement: 'Better communication about shift changes would help.'          }, score: 0.42 },
      // Short-Term Rehab -- medium sentiment
      { idx: 3, responses: { satisfaction: 3, support: 4, workload: 3, improvement: 'More training resources.'    }, score: 0.62 },
      { idx: 4, responses: { satisfaction: 3, support: 3, workload: 3, improvement: 'Schedule predictability.'    }, score: 0.58 },
      // LTC -- high sentiment
      { idx: 6, responses: { satisfaction: 5, support: 5, workload: 4, improvement: 'Nothing major -- great team!'                      }, score: 0.91 },
      { idx: 7, responses: { satisfaction: 5, support: 4, workload: 5, improvement: 'More recognition programs would be nice.'          }, score: 0.87 },
    ];

    await Promise.all(
      surveyResponses.map(({ idx, responses, score }) =>
        prisma.pulse_responses.create({
          data: {
            surveyId: survey.id,
            employeeId: employees[idx].id,
            responses,
            sentimentScore: score,
            submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          },
        })
      )
    );

    console.log('Pulse survey + responses created');

    // ──────────────────────────────────────────────────
    // Retention forecasts
    // ──────────────────────────────────────────────────
    await Promise.all([
      prisma.retention_forecasts.create({ data: { facilityId: FACILITY_ID, cohort: '2025-Q2', forecastType: '30d', predictedRetention: 0.74, confidence: 0.86, factors: { sentiment: 0.52, workload: 0.65, management: 0.58, staffing: 0.45 }, calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } }),
      prisma.retention_forecasts.create({ data: { facilityId: FACILITY_ID, cohort: '2025-Q2', forecastType: '60d', predictedRetention: 0.69, confidence: 0.83, factors: { sentiment: 0.52, workload: 0.65, management: 0.58, staffing: 0.45 }, calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } }),
      prisma.retention_forecasts.create({ data: { facilityId: FACILITY_ID, cohort: '2025-Q2', forecastType: '90d', predictedRetention: 0.63, confidence: 0.79, factors: { sentiment: 0.52, workload: 0.65, management: 0.58, staffing: 0.45 }, calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } }),
      prisma.retention_forecasts.create({ data: { facilityId: FACILITY_ID, cohort: '2025-Q1', forecastType: '30d', predictedRetention: 0.86, confidence: 0.90, factors: { sentiment: 0.78, workload: 0.72, management: 0.80, staffing: 0.75 }, calculatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }),
    ]);

    console.log('Retention forecasts created');

    // ──────────────────────────────────────────────────
    // Action items
    // ──────────────────────────────────────────────────
    await Promise.all([
      prisma.action_items.create({ data: { facilityId: FACILITY_ID, employeeId: employees[0].id, actionType: 'escalate', category: 'retention',           title: 'Escalate Retention Risk -- Memory Care Night Shift',           description: 'Three Memory Care CNAs flagged as high-risk (retentionRisk > 0.70). Immediate supervisor review recommended.',                                                priority: 'critical', status: 'pending',     assignedTo: DEMO_EMAIL, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),                                              metadata: { unit: 'Memory Care',   affectedStaff: 3,  avgRiskScore: 0.77 } } }),
      prisma.action_items.create({ data: { facilityId: FACILITY_ID,                              actionType: 'pulse',    category: 'sentiment',            title: 'Send Targeted Pulse -- Memory Care',                           description: 'Sentiment scores in Memory Care are 34% below facility average. A targeted pulse will help understand root causes before staff attrition occurs.',        priority: 'high',     status: 'in_progress', assignedTo: DEMO_EMAIL, dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),                                              metadata: { unit: 'Memory Care',   currentSentiment: 0.35, facilityAverage: 0.69 } } }),
      prisma.action_items.create({ data: { facilityId: FACILITY_ID,                              actionType: 'nudge',    category: 'candidate_engagement', title: 'Reminder: 4 CNA candidates -- orientation next Monday',        description: 'Automated reminder sent to 4 CNA candidates scheduled for orientation on June 9. 1 flagged as high no-show risk.',                                    priority: 'medium',   status: 'completed',   assignedTo: DEMO_EMAIL, completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),                                         metadata: { candidateCount: 4, highRiskCount: 1, orientationDate: '2025-06-09' } } }),
    ]);

    console.log('Action items created');

    // ──────────────────────────────────────────────────
    // Analytics insights
    // ──────────────────────────────────────────────────
    await Promise.all([
      prisma.analytics_insights.create({ data: { facilityId: FACILITY_ID, insightType: 'retention_drop',    title: 'Retention Forecast Drop -- Memory Care',                  description: 'Memory Care 30-day retention forecast dropped 12 points vs Q1 baseline. Staffing shortages and night-shift burnout are the leading risk factors.',  severity: 'critical', data: { unit: 'Memory Care', drop: 0.12, previousForecast: 0.86, currentForecast: 0.74, affectedEmployees: 3 },                    actions: [{ type: 'escalate', title: 'Escalate to Supervisor', automationLevel: 'confirm' }, { type: 'pulse', title: 'Send Targeted Pulse', automationLevel: 'confirm' }] } }),
      prisma.analytics_insights.create({ data: { facilityId: FACILITY_ID, insightType: 'sentiment_decline', title: 'Burnout Risk Rising -- Memory Care Nights (+18%)',         description: 'Night shift CNAs and LPNs in Memory Care showing consistently low satisfaction and workload scores across two consecutive pulse cycles.',           severity: 'warning',  data: { unit: 'Memory Care', shift: 'Night', sentimentDrop: 0.18, affectedRoles: ['CNA', 'LPN'] },                            actions: [{ type: 'pulse', title: 'Send Targeted Pulse to Night Shift', automationLevel: 'safe' }] } }),
      prisma.analytics_insights.create({ data: { facilityId: FACILITY_ID, insightType: 'no_show_risk',      title: 'No-Show Risk Flagged -- 1 of 4 Incoming CNAs',            description: '1 CNA candidate scheduled for Monday orientation is showing high no-show risk signals (3+ day response lag, incomplete intake).',                    severity: 'warning',  data: { flaggedCount: 1, totalCandidates: 4, riskScore: 0.72, orientationDate: '2025-06-09' },                               actions: [{ type: 'nudge', title: 'Send Reminder to At-Risk Candidate', automationLevel: 'safe' }] } }),
    ]);

    console.log('Analytics insights created');

    // ──────────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────────
    console.log('\n CareOne At Holyoke demo data seeded successfully!');
    console.log('--------------------------------------------');
    console.log('  Facility:        CareOne At Holyoke (Holyoke, MA)');
    console.log(`  Facility ID:     ${FACILITY_ID}`);
    console.log(`  Demo login:      ${DEMO_EMAIL}`);
    console.log(`  Demo password:   ${DEMO_PASSWORD}`);
    console.log(`  Employees:       ${employees.length} staff across 4 units`);
    console.log('  Units:           Memory Care, Short-Term Rehab, LTC, Skilled Nursing');
    console.log('--------------------------------------------');
    console.log('\n  Access the demo:');
    console.log('  http://localhost:3000/?company=careone-holyoke');
    console.log('  http://localhost:3000/analytics?company=careone-holyoke');
    console.log('--------------------------------------------');

  } catch (error) {
    console.error('Error seeding CareOne At Holyoke:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCareOneHolyoke()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedCareOneHolyoke };
