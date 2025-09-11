import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface EscalationData {
  facilityId: string;
  employeeId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  category: string;
  metadata?: any;
}

export interface PulseData {
  facilityId: string;
  title: string;
  questions: any[];
  targetRoles: ('CNA' | 'LPN' | 'RN' | 'PCA' | 'HHA' | 'OTHER')[];
  targetUnits: string[];
  scheduledAt?: Date;
}

export interface NudgeData {
  facilityId: string;
  employeeId: string;
  type: 'intake_completion' | 'preference_reconfirmation' | 'early_checkin';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'in_app';
}

export interface ActionItemData {
  facilityId: string;
  employeeId?: string;
  actionType: string;
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dueDate?: Date;
  metadata?: any;
}

@Injectable()
export class ActionAutomationService {
  constructor(private prisma: PrismaService) {}

  // Action Triggers
  async checkRetentionForecastDrops(): Promise<void> {
    const facilities = await this.prisma.facilities.findMany();
    
    for (const facility of facilities) {
      const recentForecasts = await this.prisma.retention_forecasts.findMany({
        where: {
          facilityId: facility.id,
          calculatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { calculatedAt: 'desc' },
        take: 2
      });

      if (recentForecasts.length >= 2) {
        const latest = recentForecasts[0];
        const previous = recentForecasts[1];
        const drop = previous.predictedRetention - latest.predictedRetention;

        if (drop > 0.1) { // 10 point drop threshold
          await this.escalateToSupervisor({
            facilityId: facility.id,
            title: 'Retention Forecast Drop Alert',
            description: `Retention forecast dropped ${(drop * 100).toFixed(1)} points vs baseline`,
            priority: 'high',
            assignedTo: 'supervisor',
            category: 'retention',
            metadata: { drop, latest, previous }
          });
        }
      }
    }
  }

  async checkSentimentDeclines(): Promise<void> {
    const facilities = await this.prisma.facilities.findMany();
    
    for (const facility of facilities) {
      const recentResponses = await this.prisma.pulse_responses.findMany({
        where: {
          employee: {
            facilityId: facility.id
          },
          submittedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { submittedAt: 'desc' }
      });

      if (recentResponses.length >= 2) {
        const latest = recentResponses[0];
        const previous = recentResponses[1];
        const decline = (previous.sentimentScore || 0) - (latest.sentimentScore || 0);

        if (decline > 0.2) { // Significant sentiment decline
          await this.sendTargetedPulse({
            facilityId: facility.id,
            title: 'Sentiment Check-in',
            questions: [
              {
                type: 'rating',
                question: 'How are you feeling about your work environment?',
                scale: { min: 1, max: 5 }
              },
              {
                type: 'text',
                question: 'What could we improve?'
              }
            ],
            targetRoles: ['CNA', 'LPN', 'RN'],
            targetUnits: []
          });
        }
      }
    }
  }

  async checkComplaintSpikes(): Promise<void> {
    const facilities = await this.prisma.facilities.findMany();
    
    for (const facility of facilities) {
      const recentComplaints = await this.prisma.complaints.findMany({
        where: {
          facilityId: facility.id,
          reportedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const previousWeekComplaints = await this.prisma.complaints.findMany({
        where: {
          facilityId: facility.id,
          reportedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (recentComplaints.length > previousWeekComplaints.length * 2) {
        // Complaint spike detected
        const categories = recentComplaints.map(c => c.category);
        const mostCommonCategory = categories.sort((a,b) =>
          categories.filter(v => v === a).length - categories.filter(v => v === b).length
        ).pop();

        await this.escalateToSupervisor({
          facilityId: facility.id,
          title: 'Complaint Spike Alert',
          description: `Complaint frequency doubled this week. Most common: ${mostCommonCategory}`,
          priority: 'high',
          assignedTo: 'supervisor',
          category: 'complaints',
          metadata: { 
            recentCount: recentComplaints.length,
            previousCount: previousWeekComplaints.length,
            categories: mostCommonCategory
          }
        });
      }
    }
  }

  async checkPulseParticipation(): Promise<void> {
    const facilities = await this.prisma.facilities.findMany();
    
    for (const facility of facilities) {
      const recentSurveys = await this.prisma.pulse_surveys.findMany({
        where: {
          facilityId: facility.id,
          status: 'completed',
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          responses: true
        },
        orderBy: { completedAt: 'desc' },
        take: 2
      });

      if (recentSurveys.length >= 2) {
        const latest = recentSurveys[0];
        const previous = recentSurveys[1];
        
        const latestParticipation = latest.responses.length;
        const previousParticipation = previous.responses.length;
        
        if (latestParticipation < previousParticipation * 0.5) {
          // Participation drop detected
          await this.triggerPulseReminder(facility.id);
        }
      }
    }
  }

  // Action Execution
  async escalateToSupervisor(actionData: EscalationData): Promise<void> {
    await this.prisma.action_items.create({
      data: {
        facilityId: actionData.facilityId,
        employeeId: actionData.employeeId,
        actionType: 'escalate',
        category: actionData.category,
        title: actionData.title,
        description: actionData.description,
        priority: actionData.priority,
        assignedTo: actionData.assignedTo,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        metadata: actionData.metadata
      }
    });

    // TODO: Send email notification to supervisor
    console.log(`Escalation created for facility ${actionData.facilityId}: ${actionData.title}`);
  }

  async sendTargetedPulse(actionData: PulseData): Promise<void> {
    const survey = await this.prisma.pulse_surveys.create({
      data: {
        facilityId: actionData.facilityId,
        title: actionData.title,
        questions: actionData.questions,
        targetRoles: actionData.targetRoles,
        targetUnits: actionData.targetUnits,
        status: 'active',
        scheduledAt: actionData.scheduledAt || new Date()
      }
    });

    await this.prisma.action_items.create({
      data: {
        facilityId: actionData.facilityId,
        actionType: 'pulse',
        category: 'sentiment',
        title: `Send Pulse: ${actionData.title}`,
        description: `Targeted pulse survey sent to ${actionData.targetRoles.join(', ')}`,
        priority: 'medium',
        metadata: { surveyId: survey.id }
      }
    });

    console.log(`Targeted pulse created for facility ${actionData.facilityId}: ${actionData.title}`);
  }

  async sendCandidateNudge(actionData: NudgeData): Promise<void> {
    await this.prisma.action_items.create({
      data: {
        facilityId: actionData.facilityId,
        employeeId: actionData.employeeId,
        actionType: 'nudge',
        category: 'candidate_engagement',
        title: actionData.title,
        description: actionData.message,
        priority: 'low',
        metadata: {
          nudgeType: actionData.type,
          channel: actionData.channel
        }
      }
    });

    // TODO: Send actual notification via specified channel
    console.log(`Candidate nudge sent to employee ${actionData.employeeId}: ${actionData.title}`);
  }

  async createActionItem(actionData: ActionItemData): Promise<void> {
    await this.prisma.action_items.create({
      data: {
        facilityId: actionData.facilityId,
        employeeId: actionData.employeeId,
        actionType: actionData.actionType,
        category: actionData.category,
        title: actionData.title,
        description: actionData.description,
        priority: actionData.priority,
        assignedTo: actionData.assignedTo,
        dueDate: actionData.dueDate,
        metadata: actionData.metadata
      }
    });

    console.log(`Action item created for facility ${actionData.facilityId}: ${actionData.title}`);
  }

  // Automation Rules
  async processAutomationRules(facilityId: string): Promise<void> {
    // Process all automation rules for a specific facility
    await this.checkRetentionForecastDrops();
    await this.checkSentimentDeclines();
    await this.checkComplaintSpikes();
    await this.checkPulseParticipation();
  }

  async executeSafeActions(): Promise<void> {
    // Execute actions that are safe to run automatically
    const safeActions = await this.prisma.action_items.findMany({
      where: {
        status: 'pending',
        metadata: {
          path: ['automationLevel'],
          equals: 'safe'
        }
      }
    });

    for (const action of safeActions) {
      if (action.actionType === 'nudge') {
        // Execute candidate nudges automatically
        await this.executeNudgeAction(action);
      }
      
      // Mark as completed
      await this.prisma.action_items.update({
        where: { id: action.id },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      });
    }
  }

  async queueConfirmationActions(): Promise<void> {
    // Queue actions that require confirmation
    const confirmationActions = await this.prisma.action_items.findMany({
      where: {
        status: 'pending',
        metadata: {
          path: ['automationLevel'],
          equals: 'confirm'
        }
      }
    });

    // TODO: Send confirmation requests to appropriate users
    console.log(`Queued ${confirmationActions.length} actions requiring confirmation`);
  }

  // Helper methods
  private async triggerPulseReminder(facilityId: string): Promise<void> {
    await this.prisma.action_items.create({
      data: {
        facilityId,
        actionType: 'pulse',
        category: 'participation',
        title: 'Pulse Participation Reminder',
        description: 'Send reminder to increase pulse survey participation',
        priority: 'medium',
        metadata: { type: 'participation_reminder' }
      }
    });
  }

  private async executeNudgeAction(action: any): Promise<void> {
    // Execute nudge action based on metadata
    const nudgeType = action.metadata?.nudgeType;
    const channel = action.metadata?.channel || 'email';
    
    // TODO: Implement actual nudge sending logic
    console.log(`Executing nudge: ${nudgeType} via ${channel}`);
  }

  // Get pending actions for a facility
  async getPendingActions(facilityId: string): Promise<any[]> {
    return await this.prisma.action_items.findMany({
      where: {
        facilityId,
        status: 'pending'
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            department: true,
            unit: true
          }
        },
        facility: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });
  }

  // Update action status
  async updateActionStatus(actionId: string, status: string, completedAt?: Date): Promise<void> {
    await this.prisma.action_items.update({
      where: { id: actionId },
      data: {
        status,
        completedAt: completedAt || (status === 'completed' ? new Date() : undefined)
      }
    });
  }
}
