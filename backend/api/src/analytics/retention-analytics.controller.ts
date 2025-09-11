import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { RetentionAnalyticsService } from './retention-analytics.service';
import { ActionAutomationService, EscalationData, PulseData, NudgeData, ActionItemData } from './action-automation.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class RetentionAnalyticsController {
  constructor(
    private retentionAnalyticsService: RetentionAnalyticsService,
    private actionAutomationService: ActionAutomationService
  ) {}

  // KPI Endpoints
  @Get('kpis/:facilityId')
  async getKPIs(@Param('facilityId') facilityId: string) {
    const [retentionForecast, noShowRisk, turnoverCost] = await Promise.all([
      this.retentionAnalyticsService.calculateRetentionForecast(facilityId, '30d'),
      this.retentionAnalyticsService.calculateNoShowRisk(facilityId),
      this.retentionAnalyticsService.calculateTurnoverCostAvoided(facilityId)
    ]);

    return {
      retentionForecast,
      noShowRisk,
      turnoverCost
    };
  }

  @Get('insights/:facilityId')
  async getInsights(@Param('facilityId') facilityId: string) {
    return await this.retentionAnalyticsService.generateInsights(facilityId);
  }

  @Get('cohorts/:facilityId')
  async getCohorts(
    @Param('facilityId') facilityId: string,
    @Query('cohortType') cohortType: string = 'new-hires-30d'
  ) {
    return await this.retentionAnalyticsService.getCohortAnalysis(facilityId, cohortType);
  }

  @Get('hotspots/:facilityId')
  async getHotspots(
    @Param('facilityId') facilityId: string,
    @Query('type') type: 'unit' | 'role' = 'unit'
  ) {
    if (type === 'unit') {
      return await this.retentionAnalyticsService.getUnitHotspots(facilityId);
    } else {
      return await this.retentionAnalyticsService.getRoleHotspots(facilityId);
    }
  }

  @Get('funnel/:facilityId')
  async getFunnelMetrics(@Param('facilityId') facilityId: string) {
    return await this.retentionAnalyticsService.getFunnelMetrics(facilityId);
  }

  @Get('retention-risk/:facilityId')
  async getRetentionRisk(@Param('facilityId') facilityId: string) {
    return await this.retentionAnalyticsService.detectRetentionRisk(facilityId);
  }

  @Get('sentiment/:facilityId')
  async getSentimentTrends(@Param('facilityId') facilityId: string) {
    return await this.retentionAnalyticsService.analyzeSentimentTrends(facilityId);
  }

  // Action Endpoints
  @Get('actions/:facilityId')
  async getActions(@Param('facilityId') facilityId: string) {
    return await this.actionAutomationService.getPendingActions(facilityId);
  }

  @Post('actions/escalate')
  async escalate(@Body() escalationData: EscalationData) {
    return await this.actionAutomationService.escalateToSupervisor(escalationData);
  }

  @Post('actions/pulse')
  async sendPulse(@Body() pulseData: PulseData) {
    return await this.actionAutomationService.sendTargetedPulse(pulseData);
  }

  @Post('actions/nudge')
  async sendNudge(@Body() nudgeData: NudgeData) {
    return await this.actionAutomationService.sendCandidateNudge(nudgeData);
  }

  @Post('actions/item')
  async createActionItem(@Body() actionItemData: ActionItemData) {
    return await this.actionAutomationService.createActionItem(actionItemData);
  }

  @Put('actions/:actionId/status')
  async updateActionStatus(
    @Param('actionId') actionId: string,
    @Body() body: { status: string; completedAt?: Date }
  ) {
    return await this.actionAutomationService.updateActionStatus(
      actionId,
      body.status,
      body.completedAt
    );
  }

  // Automation Endpoints
  @Post('automation/process/:facilityId')
  async processAutomationRules(@Param('facilityId') facilityId: string) {
    await this.actionAutomationService.processAutomationRules(facilityId);
    return { message: 'Automation rules processed successfully' };
  }

  @Post('automation/execute-safe')
  async executeSafeActions() {
    await this.actionAutomationService.executeSafeActions();
    return { message: 'Safe actions executed successfully' };
  }

  @Post('automation/queue-confirmations')
  async queueConfirmationActions() {
    await this.actionAutomationService.queueConfirmationActions();
    return { message: 'Confirmation actions queued successfully' };
  }

  // Pulse Survey Endpoints
  @Post('pulse/surveys')
  async createPulseSurvey(@Body() pulseData: PulseData) {
    return await this.actionAutomationService.sendTargetedPulse(pulseData);
  }

  @Get('pulse/surveys/:facilityId')
  async getPulseSurveys(@Param('facilityId') facilityId: string) {
    // This would be implemented to return pulse surveys for a facility
    return { message: 'Pulse surveys endpoint - to be implemented' };
  }

  @Post('pulse/surveys/:surveyId/responses')
  async submitPulseResponse(
    @Param('surveyId') surveyId: string,
    @Body() responseData: { employeeId: string; responses: any }
  ) {
    // This would be implemented to submit pulse survey responses
    return { message: 'Pulse response submission - to be implemented' };
  }

  @Get('pulse/surveys/:surveyId/results')
  async getPulseResults(@Param('surveyId') surveyId: string) {
    // This would be implemented to return pulse survey results
    return { message: 'Pulse results endpoint - to be implemented' };
  }
}
