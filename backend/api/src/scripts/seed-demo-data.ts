import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');

  try {
    // Create demo facility
    const facility = await prisma.facilities.create({
      data: {
        name: 'St. Mary\'s Health Center',
        type: 'hospital',
        location: 'New Haven, CT',
        contactEmail: 'admin@stmarys.com',
        contactPhone: '(203) 555-0123'
      }
    });

    console.log('✅ Created facility:', facility.name);

    // Create demo employees
    const employees = await Promise.all([
      // ICU Employees
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@stmarys.com',
          role: 'RN',
          department: 'Critical Care',
          unit: 'ICU',
          hireDate: new Date('2023-01-15'),
          status: 'active',
          retentionRisk: 0.2 // Low risk
        }
      }),
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@stmarys.com',
          role: 'RN',
          department: 'Critical Care',
          unit: 'ICU',
          hireDate: new Date('2023-03-20'),
          status: 'active',
          retentionRisk: 0.15 // Low risk
        }
      }),
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Emily',
          lastName: 'Rodriguez',
          email: 'emily.rodriguez@stmarys.com',
          role: 'CNA',
          department: 'Critical Care',
          unit: 'ICU',
          hireDate: new Date('2023-06-10'),
          status: 'active',
          retentionRisk: 0.25 // Low risk
        }
      }),

      // Rehab Employees (High Risk)
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'David',
          lastName: 'Thompson',
          email: 'david.thompson@stmarys.com',
          role: 'RN',
          department: 'Rehabilitation',
          unit: 'Rehab',
          hireDate: new Date('2023-02-28'),
          status: 'active',
          retentionRisk: 0.85 // High risk
        }
      }),
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Lisa',
          lastName: 'Martinez',
          email: 'lisa.martinez@stmarys.com',
          role: 'LPN',
          department: 'Rehabilitation',
          unit: 'Rehab',
          hireDate: new Date('2023-04-15'),
          status: 'active',
          retentionRisk: 0.75 // High risk
        }
      }),
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Robert',
          lastName: 'Wilson',
          email: 'robert.wilson@stmarys.com',
          role: 'CNA',
          department: 'Rehabilitation',
          unit: 'Rehab',
          hireDate: new Date('2023-05-20'),
          status: 'active',
          retentionRisk: 0.8 // High risk
        }
      }),

      // Med-Surg Employees
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Jennifer',
          lastName: 'Davis',
          email: 'jennifer.davis@stmarys.com',
          role: 'RN',
          department: 'Medical-Surgical',
          unit: 'Med-Surg',
          hireDate: new Date('2023-01-10'),
          status: 'active',
          retentionRisk: 0.3 // Low risk
        }
      }),
      prisma.employees.create({
        data: {
          facilityId: facility.id,
          firstName: 'Kevin',
          lastName: 'Lee',
          email: 'kevin.lee@stmarys.com',
          role: 'LPN',
          department: 'Medical-Surgical',
          unit: 'Med-Surg',
          hireDate: new Date('2023-03-05'),
          status: 'active',
          retentionRisk: 0.4 // Medium risk
        }
      })
    ]);

    console.log('✅ Created employees:', employees.length);

    // Create pulse surveys
    const pulseSurvey = await prisma.pulse_surveys.create({
      data: {
        facilityId: facility.id,
        title: 'Weekly Employee Check-in',
        questions: [
          {
            type: 'rating',
            question: 'How satisfied are you with your current work environment?',
            scale: { min: 1, max: 5 }
          },
          {
            type: 'rating',
            question: 'How well do you feel supported by your team?',
            scale: { min: 1, max: 5 }
          },
          {
            type: 'text',
            question: 'What could we improve?'
          }
        ],
        targetRoles: ['RN', 'LPN', 'CNA'],
        targetUnits: ['ICU', 'Rehab', 'Med-Surg'],
        status: 'completed',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }
    });

    console.log('✅ Created pulse survey:', pulseSurvey.title);

    // Create pulse responses with varying sentiment
    const pulseResponses = await Promise.all([
      // ICU - High sentiment
      prisma.pulse_responses.create({
        data: {
          surveyId: pulseSurvey.id,
          employeeId: employees[0].id, // Sarah Johnson
          responses: {
            satisfaction: 5,
            support: 5,
            improvement: 'Everything is great!'
          },
          sentimentScore: 0.9,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.pulse_responses.create({
        data: {
          surveyId: pulseSurvey.id,
          employeeId: employees[1].id, // Michael Chen
          responses: {
            satisfaction: 4,
            support: 4,
            improvement: 'Could use more training opportunities'
          },
          sentimentScore: 0.8,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      }),

      // Rehab - Low sentiment
      prisma.pulse_responses.create({
        data: {
          surveyId: pulseSurvey.id,
          employeeId: employees[3].id, // David Thompson
          responses: {
            satisfaction: 2,
            support: 2,
            improvement: 'Need better management support and clearer communication'
          },
          sentimentScore: 0.3,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.pulse_responses.create({
        data: {
          surveyId: pulseSurvey.id,
          employeeId: employees[4].id, // Lisa Martinez
          responses: {
            satisfaction: 2,
            support: 3,
            improvement: 'Workload is too heavy, need more staff'
          },
          sentimentScore: 0.4,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      }),

      // Med-Surg - Medium sentiment
      prisma.pulse_responses.create({
        data: {
          surveyId: pulseSurvey.id,
          employeeId: employees[6].id, // Jennifer Davis
          responses: {
            satisfaction: 3,
            support: 4,
            improvement: 'Schedule flexibility could be better'
          },
          sentimentScore: 0.6,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log('✅ Created pulse responses:', pulseResponses.length);

    // Create retention forecasts
    const retentionForecasts = await Promise.all([
      // Recent forecasts showing decline
      prisma.retention_forecasts.create({
        data: {
          facilityId: facility.id,
          cohort: '2024-Q1',
          forecastType: '30d',
          predictedRetention: 0.72,
          confidence: 0.85,
          factors: {
            sentiment: 0.6,
            workload: 0.7,
            management: 0.5,
            compensation: 0.8
          },
          calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.retention_forecasts.create({
        data: {
          facilityId: facility.id,
          cohort: '2024-Q1',
          forecastType: '60d',
          predictedRetention: 0.68,
          confidence: 0.82,
          factors: {
            sentiment: 0.6,
            workload: 0.7,
            management: 0.5,
            compensation: 0.8
          },
          calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.retention_forecasts.create({
        data: {
          facilityId: facility.id,
          cohort: '2024-Q1',
          forecastType: '90d',
          predictedRetention: 0.65,
          confidence: 0.78,
          factors: {
            sentiment: 0.6,
            workload: 0.7,
            management: 0.5,
            compensation: 0.8
          },
          calculatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      }),

      // Previous forecasts for comparison
      prisma.retention_forecasts.create({
        data: {
          facilityId: facility.id,
          cohort: '2024-Q1',
          forecastType: '30d',
          predictedRetention: 0.84,
          confidence: 0.88,
          factors: {
            sentiment: 0.8,
            workload: 0.6,
            management: 0.7,
            compensation: 0.8
          },
          calculatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    console.log('✅ Created retention forecasts:', retentionForecasts.length);

    // Create action items
    const actionItems = await Promise.all([
      prisma.action_items.create({
        data: {
          facilityId: facility.id,
          employeeId: employees[3].id, // David Thompson
          actionType: 'escalate',
          category: 'retention',
          title: 'Escalate Retention Risk - Rehab Unit',
          description: 'Retention forecast dropped 12 points vs baseline. David Thompson shows high risk indicators.',
          priority: 'high',
          status: 'pending',
          assignedTo: 'supervisor@stmarys.com',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          metadata: {
            riskScore: 0.85,
            unit: 'Rehab',
            previousForecast: 0.84,
            currentForecast: 0.72
          }
        }
      }),
      prisma.action_items.create({
        data: {
          facilityId: facility.id,
          actionType: 'pulse',
          category: 'sentiment',
          title: 'Send Targeted Pulse - Rehab Unit',
          description: 'Low sentiment scores detected in Rehab unit. Send targeted pulse survey.',
          priority: 'medium',
          status: 'pending',
          assignedTo: 'hr@stmarys.com',
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          metadata: {
            targetUnit: 'Rehab',
            sentimentThreshold: 0.5,
            currentSentiment: 0.35
          }
        }
      }),
      prisma.action_items.create({
        data: {
          facilityId: facility.id,
          employeeId: employees[7].id, // Kevin Lee
          actionType: 'nudge',
          category: 'candidate_engagement',
          title: 'Send Intake Completion Nudge',
          description: 'Kevin Lee has incomplete intake forms. Send reminder.',
          priority: 'low',
          status: 'completed',
          assignedTo: 'candidate@stmarys.com',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          metadata: {
            nudgeType: 'intake_completion',
            channel: 'email'
          }
        }
      })
    ]);

    console.log('✅ Created action items:', actionItems.length);

    // Create complaints
    const complaints = await Promise.all([
      prisma.complaints.create({
        data: {
          facilityId: facility.id,
          employeeId: employees[3].id, // David Thompson
          category: 'workload',
          description: 'Workload is too heavy, need more staff support',
          severity: 'medium',
          status: 'open',
          metadata: {
            unit: 'Rehab',
            reportedBy: 'employee'
          }
        }
      }),
      prisma.complaints.create({
        data: {
          facilityId: facility.id,
          employeeId: employees[4].id, // Lisa Martinez
          category: 'management',
          description: 'Poor communication from management about schedule changes',
          severity: 'high',
          status: 'investigating',
          metadata: {
            unit: 'Rehab',
            reportedBy: 'employee'
          }
        }
      }),
      prisma.complaints.create({
        data: {
          facilityId: facility.id,
          category: 'safety',
          description: 'Safety concern: Equipment not properly maintained',
          severity: 'critical',
          status: 'open',
          metadata: {
            unit: 'Rehab',
            reportedBy: 'anonymous'
          }
        }
      })
    ]);

    console.log('✅ Created complaints:', complaints.length);

    // Create analytics insights
    const insights = await Promise.all([
      prisma.analytics_insights.create({
        data: {
          facilityId: facility.id,
          insightType: 'retention_drop',
          title: 'Retention Forecast Drop Detected',
          description: 'Rehab unit forecast dropped 12 points vs baseline. Immediate attention required.',
          severity: 'warning',
          data: {
            unit: 'Rehab',
            drop: 0.12,
            previousForecast: 0.84,
            currentForecast: 0.72,
            affectedEmployees: 3
          },
          actions: [
            {
              type: 'escalate',
              title: 'Escalate to Supervisor',
              description: 'Notify supervisor of retention risk',
              automationLevel: 'confirm'
            },
            {
              type: 'pulse',
              title: 'Send Targeted Pulse',
              description: 'Survey Rehab unit employees',
              automationLevel: 'confirm'
            }
          ]
        }
      }),
      prisma.analytics_insights.create({
        data: {
          facilityId: facility.id,
          insightType: 'sentiment_decline',
          title: 'Sentiment Decline in Rehab Unit',
          description: 'Average sentiment score dropped to 35% in Rehab unit over past 2 weeks.',
          severity: 'critical',
          data: {
            unit: 'Rehab',
            currentSentiment: 0.35,
            previousSentiment: 0.65,
            decline: 0.3,
            affectedEmployees: 3
          },
          actions: [
            {
              type: 'pulse',
              title: 'Send Targeted Pulse',
              description: 'Survey Rehab unit employees',
              automationLevel: 'confirm'
            }
          ]
        }
      }),
      prisma.analytics_insights.create({
        data: {
          facilityId: facility.id,
          insightType: 'complaint_spike',
          title: 'Complaint Spike Alert',
          description: 'Complaint frequency doubled this week. Most common: workload and management issues.',
          severity: 'warning',
          data: {
            recentCount: 3,
            previousCount: 1,
            categories: ['workload', 'management', 'safety'],
            mostCommon: 'workload'
          },
          actions: [
            {
              type: 'escalate',
              title: 'Escalate to HR',
              description: 'Review complaint patterns',
              automationLevel: 'confirm'
            }
          ]
        }
      })
    ]);

    console.log('✅ Created analytics insights:', insights.length);

    console.log('🎉 Demo data seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 1 Facility: ${facility.name}`);
    console.log(`   - ${employees.length} Employees across ICU, Rehab, and Med-Surg`);
    console.log(`   - 1 Pulse Survey with ${pulseResponses.length} Responses`);
    console.log(`   - ${retentionForecasts.length} Retention Forecasts`);
    console.log(`   - ${actionItems.length} Action Items`);
    console.log(`   - ${complaints.length} Complaints`);
    console.log(`   - ${insights.length} Analytics Insights`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('✅ Demo data seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo data seeding failed:', error);
      process.exit(1);
    });
}

export { seedDemoData };
