import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import { InternalAnalyticsService } from './internal-analytics.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsTrackingService, InternalAnalyticsService],
  exports: [AnalyticsService, AnalyticsTrackingService, InternalAnalyticsService],
})
export class AnalyticsModule {} 