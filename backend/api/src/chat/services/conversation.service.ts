import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConversationMemoryService } from './conversation-memory.service';
import { countTokens, countMessageTokens } from '../utils/token-counter';

/**
 * Conversation service for managing conversation sessions and messages
 * Implements Pip Context Layer spec sections 1 (Data Model) and 4 (Recency Window)
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  // Recency window limits (from spec Section 4)
  private readonly RECENCY_TARGET_TOKENS = 1500;
  private readonly RECENCY_HARD_CAP_TOKENS = 2000;

  constructor(
    private prisma: PrismaService,
    private memoryService: ConversationMemoryService,
  ) {}

  /**
   * Create or get active conversation for a user
   */
  async getOrCreateConversation(userId: string, employeeId?: string): Promise<string> {
    try {
      // Look for an active conversation
      const existingConversation = await this.prisma.pip_conversations.findFirst({
        where: {
          userId,
          status: 'active',
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const conversation = await this.prisma.pip_conversations.create({
        data: {
          userId,
          employeeId,
          status: 'active',
        },
      });

      // Initialize conversation memory
      await this.memoryService.initializeMemory(conversation.id, employeeId);

      this.logger.log(`Created new conversation ${conversation.id} for user ${userId}`);
      return conversation.id;
    } catch (error) {
      this.logger.error(`Failed to get or create conversation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    try {
      const tokenCount = countTokens(content);

      // Create message
      await this.prisma.pip_messages.create({
        data: {
          conversationId,
          role,
          content,
          tokenCount,
        },
      });

      // Update conversation stats
      const updateData: any = {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      };

      if (role === 'user') {
        updateData.totalInputTokens = { increment: tokenCount };
      } else {
        updateData.totalOutputTokens = { increment: tokenCount };
      }

      await this.prisma.pip_conversations.update({
        where: { id: conversationId },
        data: updateData,
      });

      this.logger.debug(
        `Added ${role} message to conversation ${conversationId} (${tokenCount} tokens)`,
      );
    } catch (error) {
      this.logger.error(`Failed to add message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recency window (token-bounded recent messages)
   * Implements spec Section 4 - Recency Window
   */
  async getRecencyWindow(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      // Get all messages ordered by most recent first
      const messages = await this.prisma.pip_messages.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        select: {
          role: true,
          content: true,
          tokenCount: true,
        },
      });

      // Select messages within token budget (most recent first, then reverse)
      const selectedMessages: Array<{ role: string; content: string }> = [];
      let totalTokens = 0;

      for (const message of messages) {
        // Check if adding this message would exceed hard cap
        if (totalTokens + message.tokenCount > this.RECENCY_HARD_CAP_TOKENS) {
          break;
        }

        selectedMessages.unshift({ role: message.role, content: message.content });
        totalTokens += message.tokenCount;

        // Stop if we've reached target and have a reasonable number of messages
        if (totalTokens >= this.RECENCY_TARGET_TOKENS && selectedMessages.length >= 4) {
          break;
        }
      }

      this.logger.debug(
        `Recency window for ${conversationId}: ${selectedMessages.length} messages, ${totalTokens} tokens`,
      );

      return selectedMessages;
    } catch (error) {
      this.logger.error(`Failed to get recency window: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get conversation with memory
   */
  async getConversationWithMemory(conversationId: string) {
    return this.prisma.pip_conversations.findUnique({
      where: { id: conversationId },
      include: {
        memory: true,
        employee: {
          include: {
            facility: true,
          },
        },
      },
    });
  }

  /**
   * Get conversation messages (for history display)
   */
  async getMessages(conversationId: string, limit: number = 100) {
    return this.prisma.pip_messages.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get all messages for a user across all conversations
   * Used for legacy compatibility with existing mobile app
   */
  async getUserMessages(userId: string, limit: number = 100) {
    const conversations = await this.prisma.pip_conversations.findMany({
      where: { userId },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    return this.prisma.pip_messages.findMany({
      where: {
        conversationId: { in: conversationIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
  }

  /**
   * End a conversation (mark as completed)
   */
  async endConversation(conversationId: string): Promise<void> {
    await this.prisma.pip_conversations.update({
      where: { id: conversationId },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });

    this.logger.log(`Ended conversation ${conversationId}`);
  }
}
