import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'crypto';

/** Tier 3 topics that trigger high-urgency safety escalation */
const TIER3_TOPICS = ['safety', 'harassment', 'discrimination', 'violence', 'self_harm', 'self-harm'] as const;

export type SafetyTier = 1 | 2 | 3;

export interface ChatClassification {
  topic: string;
  urgency: string;
  routing: string;
  summary: string;
  sentiment?: string;
}

export interface Tier3Context {
  conversationId: string;
  userId: string;
  facilityId?: string;
  ack: string;
  transcriptExcerpt?: string;
}

@Injectable()
export class SafetyEscalationService {
  private readonly logger = new Logger(SafetyEscalationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Map topic + urgency to tier per formal spec:
   * Tier 1: burnout/friction → aggregate only
   * Tier 2: operational safety → aggregate + unit alert
   * Tier 3: serious risk / imminent threat → restricted transcript, Action Center, admin notify
   */
  getTier(classification: ChatClassification): SafetyTier | null {
    const topic = (classification.topic ?? '').toLowerCase();
    const urgency = (classification.urgency ?? 'low').toLowerCase();

    // Tier 3: IF urgency=high AND topic in [safety, harassment, discrimination, violence, self_harm]
    if (urgency === 'high' && TIER3_TOPICS.includes(topic as (typeof TIER3_TOPICS)[number])) {
      return 3;
    }

    // Tier 2: operational safety (medium urgency or safety-adjacent)
    if (
      ['safety', 'harassment', 'discrimination', 'supervisor_behavior'].includes(topic) &&
      (urgency === 'medium' || urgency === 'high')
    ) {
      return 2;
    }

    // Tier 1: burnout, friction, general
    if (
      ['burnout', 'workflow', 'patient_load', 'staffing', 'coworker_conflict', 'communication', 'other'].includes(
        topic,
      ) ||
      urgency === 'low'
    ) {
      return 1;
    }

    return 1; // default to Tier 1 for unknown
  }

  /**
   * Check if classification qualifies as Tier 3 and perform escalation:
   * - Log in separate secure table
   * - Notify authorized admin (configurable)
   * - Store transcript copy under restricted access
   * - Do NOT surface in general dashboard tiles (handled by Action Center filtering)
   */
  async processTier3IfNeeded(
    classification: ChatClassification,
    context: Tier3Context,
  ): Promise<boolean> {
    const tier = this.getTier(classification);
    if (tier !== 3) {
      return false;
    }

    this.logger.warn({
      event: 'tier3_safety_escalation',
      conversationId: context.conversationId,
      userId: context.userId,
      topic: classification.topic,
      facilityId: context.facilityId,
    });

    // 1. Log in separate secure table
    await this.prisma.pip_safety_tier3.create({
      data: {
        id: randomUUID(),
        conversationId: context.conversationId,
        userId: context.userId,
        facilityId: context.facilityId ?? null,
        topic: classification.topic,
        urgency: classification.urgency ?? 'high',
        routing: classification.routing ?? 'Safety',
        summary: classification.summary ?? '',
        transcriptCopy: context.transcriptExcerpt ?? null,
        status: 'pending',
        metadata: {
          ackPreview: context.ack?.slice(0, 200) ?? null,
        },
      },
    });

    // 2. Notify authorized admin (configurable)
    await this.notifyTier3Admin(context.facilityId, classification, context);

    return true;
  }

  private async notifyTier3Admin(
    facilityId: string | undefined,
    classification: ChatClassification,
    context: Tier3Context,
  ): Promise<void> {
    const fallbackEmail = this.config.get<string>('SAFETY_TIER3_ADMIN_EMAIL');
    let emails: string[] = [];

    if (facilityId) {
      const config = await this.prisma.facility_safety_config.findUnique({
        where: { facilityId },
      });
      if (config?.tier3EmailEnabled && Array.isArray(config.tier3AdminEmails)) {
        emails = config.tier3AdminEmails as string[];
      }
    }

    if (emails.length === 0 && fallbackEmail) {
      emails = [fallbackEmail];
    }

    if (emails.length === 0) {
      this.logger.log({
        event: 'tier3_admin_notification_skipped',
        reason: 'no_configured_emails',
        facilityId,
      });
      return;
    }

    // TODO: Integrate with EmailModule to send actual email
    // For now, log the notification intent
    this.logger.warn({
      event: 'tier3_admin_notification_required',
      emails,
      facilityId,
      topic: classification.topic,
      conversationId: context.conversationId,
    });
  }

  /**
   * Get Tier 3 items for Action Center (restricted access - admin only)
   */
  async getTier3ItemsForActionCenter(facilityId?: string, limit = 50) {
    const where = facilityId ? { facilityId } : {};
    return this.prisma.pip_safety_tier3.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
