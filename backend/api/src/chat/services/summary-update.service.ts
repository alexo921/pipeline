import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConversationMemoryService } from './conversation-memory.service';
import { countMessageTokens } from '../utils/token-counter';
import OpenAI from 'openai';

/**
 * Summary Update Prompt (from Pip Context Layer spec Section 3.6)
 */
const SUMMARY_UPDATE_SYSTEM_PROMPT = `You are maintaining a long-term factual summary used as memory.

Rules:
- Include only explicit facts and stable context.
- Do NOT include advice, opinions, emotions, or interpretations.
- Do NOT infer personality, intent, or motivation.
- Do NOT restate profile-backed identity unless needed for coherence.
- If information is contradicted, update or remove it.
- If unclear, mark as unknown.
- Prefer newer, stable facts.
- Keep under 120 words.
- Use neutral, declarative sentences.`;

/**
 * Service for updating running summaries based on conversation messages
 * Implements the summary update logic from Pip Context Layer spec (Section 3)
 */
@Injectable()
export class SummaryUpdateService {
  private readonly logger = new Logger(SummaryUpdateService.name);
  private openai: OpenAI | null = null;

  // Update triggers (from spec Section 3.4)
  private readonly MESSAGE_COUNT_TRIGGER = 10;
  private readonly TOKEN_LIMIT_TRIGGER = 3500;

  constructor(
    private prisma: PrismaService,
    private memoryService: ConversationMemoryService,
    private configService: ConfigService,
  ) {}

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      });
    }
    return this.openai;
  }

  /**
   * Check if summary update is needed and trigger if necessary
   */
  async checkAndUpdateIfNeeded(conversationId: string): Promise<boolean> {
    try {
      const conversation = await this.prisma.pip_conversations.findUnique({
        where: { id: conversationId },
        include: {
          memory: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20, // Look at recent messages
          },
        },
      });

      if (!conversation || !conversation.memory) {
        this.logger.warn(`No conversation or memory found for ${conversationId}`);
        return false;
      }

      const memory = conversation.memory;
      const messages = conversation.messages.reverse(); // Oldest to newest

      // Get messages since last summary update
      const lastUpdateDate = memory.summaryUpdatedAt;
      const newMessages = messages.filter((m) => m.createdAt > lastUpdateDate);
      const userMessagesCount = newMessages.filter((m) => m.role === 'user').length;

      // Check trigger conditions
      const totalTokens = conversation.totalInputTokens + conversation.totalOutputTokens;
      let triggerReason: string | null = null;

      if (userMessagesCount >= this.MESSAGE_COUNT_TRIGGER) {
        triggerReason = 'message_count';
      } else if (totalTokens >= this.TOKEN_LIMIT_TRIGGER) {
        triggerReason = 'token_limit';
      }

      if (triggerReason) {
        this.logger.log(
          `Triggering summary update for conversation ${conversationId}: ${triggerReason}`,
        );
        await this.updateSummary(conversationId, messages, triggerReason);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking summary update: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Manually trigger a summary update
   */
  async manualUpdate(conversationId: string): Promise<void> {
    const messages = await this.prisma.pip_messages.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    await this.updateSummary(conversationId, messages, 'manual');
  }

  /**
   * Update summary using the last 10-15 messages
   */
  private async updateSummary(
    conversationId: string,
    allMessages: any[],
    triggerReason: string,
  ): Promise<void> {
    try {
      const memory = await this.memoryService.getMemory(conversationId);
      if (!memory) {
        throw new Error(`Memory not found for conversation ${conversationId}`);
      }

      // Select last 10-15 messages for summary update
      const recentMessages = allMessages.slice(-15);
      const previousSummary = memory.runningSummary || '';

      // Format messages for the prompt
      const messagesText = recentMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      // Create the update prompt
      const userPrompt = `Previous summary:
${previousSummary || 'None'}

New conversation messages:
${messagesText}

Update the summary accordingly.`;

      // Call OpenAI to generate updated summary
      const completion = await this.getOpenAI().chat.completions.create({
        model: this.configService.get<string>('PIP_CHAT_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SUMMARY_UPDATE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const newSummary = completion.choices[0]?.message?.content?.trim();

      if (newSummary) {
        await this.memoryService.updateSummary(
          conversationId,
          newSummary,
          recentMessages.length,
          triggerReason,
        );

        this.logger.log(`Summary updated successfully for conversation ${conversationId}`);
      } else {
        this.logger.warn(`No summary generated for conversation ${conversationId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update summary: ${error.message}`, error.stack);
      throw error;
    }
  }
}
