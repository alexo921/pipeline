import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RetentionForecastData {
  percentage30d: number;
  percentage60d: number;
  percentage90d: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface NoShowRiskData {
  flaggedCount: number;
  totalCandidates: number;
  riskPercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TurnoverCostData {
  estimatedSavings: number;
  hiresRetained: number;
  timeSaved: number;
  roi: number;
}

export interface Insight {
  id: string;
  type: 'retention_drop' | 'sentiment_decline' | 'complaint_spike' | 'participation_drop';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actions: Action[];
  data: any;
  generatedAt: Date;
}

export interface Action {
  id: string;
  type: 'escalate' | 'pulse' | 'nudge' | 'manual';
  title: string;
  description: string;
  actor: 'employer' | 'candidate';
  channel: 'email' | 'sms' | 'in_app' | 'notification';
  automationLevel: 'safe' | 'confirm' | 'manual';
}

export interface CohortData {
  cohort: string;
  totalHires: number;
  retention30d: number;
  retention60d: number;
  retention90d: number;
  predictedRetention: number;
  actualRetention?: number;
}

export interface HotspotData {
  unit: string;
  role: string;
  sentimentScore: number;
  retentionForecast: number;
  participationRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class RetentionAnalyticsService {
  constructor(private prisma: PrismaService) {}

  // KPI Calculation Methods
  async calculateRetentionForecast(facilityId: string, timeframe: string): Promise<RetentionForecastData> {
    // Return mock data since analytics tables don't exist yet
    const mockRetention = 87.5; // Mock retention percentage

    return {
      percentage30d: timeframe === '30d' ? mockRetention : 0,
      percentage60d: timeframe === '60d' ? mockRetention : 0,
      percentage90d: timeframe === '90d' ? mockRetention : 0,
      trend: 'stable',
      riskLevel: 'low'
    };
  }

  async calculateNoShowRisk(facilityId: string): Promise<NoShowRiskData> {
    // Return mock data since analytics tables don't exist yet
    return {
      flaggedCount: 3,
      totalCandidates: 25,
      riskPercentage: 12.0,
      trend: 'stable'
    };
  }

  async calculateTurnoverCostAvoided(facilityId: string): Promise<TurnoverCostData> {
    // Return mock data since analytics tables don't exist yet
    return {
      estimatedSavings: 120000,
      hiresRetained: 3,
      timeSaved: 60,
      roi: 12.0
    };
  }

  // Insight Generation
  async generateInsights(facilityId: string): Promise<Insight[]> {
    // Return mock insights since analytics tables don't exist yet
    return [
      {
        id: 'insight-1',
        type: 'retention_drop',
        title: 'Retention Rate Declining',
        description: '30-day retention rate has dropped by 5% in the last month',
        severity: 'warning',
        actions: [],
        data: { currentRate: 82, previousRate: 87 },
        generatedAt: new Date()
      }
    ];
  }

  async detectRetentionRisk(facilityId: string): Promise<any[]> {
    // Return mock data since analytics tables don't exist yet
    return [
      {
        id: 'emp-1',
        name: 'John Smith',
        role: 'Nurse',
        department: 'ICU',
        unit: 'ICU-1',
        riskScore: 0.75,
        hireDate: new Date('2024-01-15')
      }
    ];
  }

  async analyzeSentimentTrends(facilityId: string): Promise<any> {
    // Return mock data since analytics tables don't exist yet
    return {
      averageSentiment: 0.72,
      totalResponses: 45,
      trend: 'stable'
    };
  }

  // Cohort Analysis
  async getCohortAnalysis(facilityId: string, cohortType: string): Promise<CohortData[]> {
    const cohorts = await this.prisma.retention_forecasts.findMany({
      where: {
        facilityId,
        cohort: cohortType
      },
      orderBy: { calculatedAt: 'desc' }
    });

    // Group by cohort and calculate metrics
    const cohortMap = new Map<string, CohortData>();
    
    for (const forecast of cohorts) {
      if (!cohortMap.has(forecast.cohort)) {
        cohortMap.set(forecast.cohort, {
          cohort: forecast.cohort,
          totalHires: 0,
          retention30d: 0,
          retention60d: 0,
          retention90d: 0,
          predictedRetention: forecast.predictedRetention * 100
        });
      }
      
      const cohort = cohortMap.get(forecast.cohort)!;
      cohort.totalHires++;
      
      if (forecast.forecastType === '30d') cohort.retention30d = forecast.predictedRetention * 100;
      if (forecast.forecastType === '60d') cohort.retention60d = forecast.predictedRetention * 100;
      if (forecast.forecastType === '90d') cohort.retention90d = forecast.predictedRetention * 100;
    }

    return Array.from(cohortMap.values());
  }

  async getFunnelMetrics(facilityId: string): Promise<any> {
    // This would integrate with ATS data to show applicants -> hires -> retention funnel
    // For now, return placeholder data
    return {
      applicants: 100,
      interviews: 50,
      offers: 25,
      hires: 20,
      retention30d: 18,
      retention60d: 16,
      retention90d: 15
    };
  }

  // Hotspot Analysis
  async getUnitHotspots(facilityId: string): Promise<HotspotData[]> {
    const employees = await this.prisma.employees.findMany({
      where: { facilityId, status: 'active' },
      include: {
        pulse_responses: {
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    });

    const unitMap = new Map<string, HotspotData>();
    
    for (const employee of employees) {
      const unit = employee.unit || 'Unknown';
      if (!unitMap.has(unit)) {
        unitMap.set(unit, {
          unit,
          role: employee.role,
          sentimentScore: 0,
          retentionForecast: (employee.retentionRisk || 0) * 100,
          participationRate: 0,
          riskLevel: 'medium'
        });
      }
      
      const hotspot = unitMap.get(unit)!;
      if (employee.pulse_responses.length > 0) {
        hotspot.sentimentScore = employee.pulse_responses[0].sentimentScore || 0;
        hotspot.participationRate = 100; // Assume 100% if they responded
      }
    }

    return Array.from(unitMap.values());
  }

  async getRoleHotspots(facilityId: string): Promise<HotspotData[]> {
    const employees = await this.prisma.employees.findMany({
      where: { facilityId, status: 'active' },
      include: {
        pulse_responses: {
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    });

    const roleMap = new Map<string, HotspotData>();
    
    for (const employee of employees) {
      const role = employee.role;
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          unit: 'All Units',
          role,
          sentimentScore: 0,
          retentionForecast: (employee.retentionRisk || 0) * 100,
          participationRate: 0,
          riskLevel: 'medium'
        });
      }
      
      const hotspot = roleMap.get(role)!;
      if (employee.pulse_responses.length > 0) {
        hotspot.sentimentScore = employee.pulse_responses[0].sentimentScore || 0;
        hotspot.participationRate = 100;
      }
    }

    return Array.from(roleMap.values());
  }

  // Private helper methods
  private calculateTrend(forecasts: any[]): 'up' | 'down' | 'stable' {
    if (forecasts.length < 2) return 'stable';
    
    const latest = forecasts[0].predictedRetention;
    const previous = forecasts[1].predictedRetention;
    
    const diff = latest - previous;
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  }

  private determineRiskLevel(retentionPercentage: number): 'low' | 'medium' | 'high' {
    if (retentionPercentage >= 70) return 'low';
    if (retentionPercentage >= 50) return 'medium';
    return 'high';
  }

  private async checkRetentionForecastDrop(facilityId: string): Promise<Insight | null> {
    const recentForecasts = await this.prisma.retention_forecasts.findMany({
      where: {
        facilityId,
        calculatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { calculatedAt: 'desc' },
      take: 2
    });

    if (recentForecasts.length < 2) return null;

    const latest = recentForecasts[0];
    const previous = recentForecasts[1];
    const drop = previous.predictedRetention - latest.predictedRetention;

    if (drop > 0.1) { // 10 point drop
      return {
        id: `retention-drop-${latest.id}`,
        type: 'retention_drop',
        title: 'Retention Forecast Drop Detected',
        description: `Retention forecast dropped ${(drop * 100).toFixed(1)} points vs baseline`,
        severity: 'warning',
        actions: [{
          id: 'escalate-supervisor',
          type: 'escalate',
          title: 'Escalate to Supervisor',
          description: 'Notify supervisor of retention risk',
          actor: 'employer',
          channel: 'email',
          automationLevel: 'confirm'
        }],
        data: { drop, latest, previous },
        generatedAt: new Date()
      };
    }

    return null;
  }

  private async checkSentimentDecline(facilityId: string): Promise<Insight | null> {
    // TODO: Implement sentiment decline detection
    return null;
  }

  private async checkComplaintSpike(facilityId: string): Promise<Insight | null> {
    // TODO: Implement complaint spike detection
    return null;
  }

  private async checkParticipationDrop(facilityId: string): Promise<Insight | null> {
    // TODO: Implement participation drop detection
    return null;
  }
}
