import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import { InternalAnalyticsService } from './internal-analytics.service';
import { RetentionAnalyticsService } from './retention-analytics.service';
import { ActionAutomationService } from './action-automation.service';
import { RetentionAnalyticsController } from './retention-analytics.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [AnalyticsController, RetentionAnalyticsController],
  providers: [
    AnalyticsService, 
    AnalyticsTrackingService, 
    InternalAnalyticsService,
    RetentionAnalyticsService,
    ActionAutomationService
  ],
  exports: [
    AnalyticsService, 
    AnalyticsTrackingService, 
    InternalAnalyticsService,
    RetentionAnalyticsService,
    ActionAutomationService
  ],
})
export class AnalyticsModule {} 