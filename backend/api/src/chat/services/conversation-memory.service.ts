import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { countTokens } from '../utils/token-counter';

/**
 * Pinned Facts Structure
 * Represents authoritative defaults that persist across conversations
 */
export interface PinnedFacts {
  work_identity?: {
    role?: { value: string; source: string };
    facility_type?: { value: string; source: string };
    unit?: { value: string; source: string };
    shift?: { value: string; source: string };
  };
  safety_constraints?: {
    allergies?: { value: string[]; source: string };
    physical_constraints?: { value: string[]; source: string };
  };
  organizational_context?: {
    manager_name?: { value: string; source: string };
    management_level?: { value: string; source: string };
  };
  goals?: {
    active_goals?: { value: string[]; source: string };
    target_timeline?: { value: Record<string, string>; source: string };
  };
}

/**
 * Service for managing conversation memory (pinned facts and running summaries)
 */
@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize conversation memory with default pinned facts from employee profile
   */
  async initializeMemory(conversationId: string, employeeId?: string): Promise<void> {
    try {
      // Load employee profile data if available
      let pinnedFacts: PinnedFacts = {};

      if (employeeId) {
        const employee = await this.prisma.employees.findUnique({
          where: { id: employeeId },
          include: { facility: true },
        });

        if (employee) {
          // Initialize pinned facts from profile data
          pinnedFacts = {
            work_identity: {
              role: { value: employee.role, source: 'profile' },
              facility_type: { value: employee.facility?.type || '', source: 'profile' },
              unit: { value: employee.unit || '', source: 'profile' },
            },
          };
        }
      }

      // Create conversation memory record
      await this.prisma.pip_conversation_memory.create({
        data: {
          conversationId,
          pinnedFacts: pinnedFacts as any,
          runningSummary: null,
          summaryVersion: 0,
        },
      });

      this.logger.log(`Initialized memory for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to initialize memory: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get conversation memory (pinned facts + running summary)
   */
  async getMemory(conversationId: string) {
    return this.prisma.pip_conversation_memory.findUnique({
      where: { conversationId },
    });
  }

  /**
   * Update pinned facts (only on explicit user statements)
   */
  async updatePinnedFacts(conversationId: string, updates: Partial<PinnedFacts>): Promise<void> {
    try {
      const memory = await this.getMemory(conversationId);
      if (!memory) {
        throw new Error(`Memory not found for conversation ${conversationId}`);
      }

      // Merge updates with existing pinned facts
      const currentFacts = (memory.pinnedFacts as PinnedFacts) || {};
      const updatedFacts = this.mergePinnedFacts(currentFacts, updates);

      await this.prisma.pip_conversation_memory.update({
        where: { conversationId },
        data: { pinnedFacts: updatedFacts as any },
      });

      this.logger.log(`Updated pinned facts for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to update pinned facts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update running summary
   */
  async updateSummary(
    conversationId: string,
    newSummary: string,
    messagesProcessed: number,
    triggerReason: string,
  ): Promise<void> {
    try {
      const memory = await this.getMemory(conversationId);
      if (!memory) {
        throw new Error(`Memory not found for conversation ${conversationId}`);
      }

      const oldSummary = memory.runningSummary;
      const newVersion = memory.summaryVersion + 1;
      const tokenCount = countTokens(newSummary);

      // Update the memory
      await this.prisma.pip_conversation_memory.update({
        where: { conversationId },
        data: {
          runningSummary: newSummary,
          summaryVersion: newVersion,
          summaryUpdatedAt: new Date(),
        },
      });

      // Log the summary update for observability
      await this.prisma.pip_summary_updates.create({
        data: {
          conversationId,
          oldSummary,
          newSummary,
          summaryVersion: newVersion,
          messagesProcessed,
          tokenCount,
          triggerReason,
        },
      });

      this.logger.log(
        `Updated summary for conversation ${conversationId} (v${newVersion}, ${tokenCount} tokens, reason: ${triggerReason})`,
      );
    } catch (error) {
      this.logger.error(`Failed to update summary: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Merge pinned facts following the source-of-truth hierarchy
   * Priority: Profile > Explicit Correction > Explicit Statement > Model-Assisted > Summary
   */
  private mergePinnedFacts(current: PinnedFacts, updates: Partial<PinnedFacts>): PinnedFacts {
    const result = { ...current };

    // Deep merge each category
    for (const category of Object.keys(updates) as Array<keyof PinnedFacts>) {
      if (!result[category]) {
        result[category] = {} as any;
      }

      const currentCategory = result[category] as Record<string, any>;
      const updateCategory = updates[category] as Record<string, any>;

      if (updateCategory) {
        for (const key of Object.keys(updateCategory)) {
          const currentValue = currentCategory[key];
          const updateValue = updateCategory[key];

          // Apply source-of-truth hierarchy
          if (!currentValue || this.canOverride(currentValue.source, updateValue.source)) {
            currentCategory[key] = updateValue;
          }
        }
      }
    }

    return result;
  }

  /**
   * Determine if a new source can override an existing source
   */
  private canOverride(currentSource: string, newSource: string): boolean {
    const hierarchy = ['summary', 'model', 'conversation', 'correction', 'profile'];
    const currentPriority = hierarchy.indexOf(currentSource);
    const newPriority = hierarchy.indexOf(newSource);

    // Higher priority (larger index) can override lower priority
    return newPriority > currentPriority;
  }
}
