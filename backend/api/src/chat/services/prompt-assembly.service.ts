import { Injectable, Logger } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationMemoryService, PinnedFacts } from './conversation-memory.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Prompt Assembly Service
 * Implements Pip Context Layer spec Section 5 (Prompt Assembly)
 *
 * Strict order:
 * 1. System / Developer Instructions
 * 2. PINNED_FACTS (structured defaults)
 * 3. RUNNING_SUMMARY (background)
 * 4. RECENT_TURNS (token-bounded)
 * 5. CURRENT_USER_MESSAGE
 */
@Injectable()
export class PromptAssemblyService {
  private readonly logger = new Logger(PromptAssemblyService.name);

  constructor(
    private conversationService: ConversationService,
    private memoryService: ConversationMemoryService,
  ) {}

  /**
   * Assemble the complete prompt with context for a chat completion
   */
  async assemblePrompt(
    conversationId: string,
    currentUserMessage: string,
    systemPrompt: string,
  ): Promise<ChatCompletionMessageParam[]> {
    try {
      // 1. Get conversation with memory
      const conversation = await this.conversationService.getConversationWithMemory(conversationId);
      if (!conversation || !conversation.memory) {
        throw new Error(`Conversation or memory not found for ${conversationId}`);
      }

      const memory = conversation.memory;

      // 2. Build context sections
      const pinnedFactsSection = this.formatPinnedFacts(memory.pinnedFacts as PinnedFacts);
      const summarySection = this.formatRunningSummary(memory.runningSummary);

      // 3. Get recency window
      const recentTurns = await this.conversationService.getRecencyWindow(conversationId);

      // 4. Assemble in strict order (Section 5)
      const enhancedSystemPrompt = this.buildEnhancedSystemPrompt(
        systemPrompt,
        pinnedFactsSection,
        summarySection,
      );

      // Build messages array
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: enhancedSystemPrompt },
      ];

      // Add recent turns (conversation history)
      for (const turn of recentTurns) {
        messages.push({ role: turn.role as 'user' | 'assistant', content: turn.content });
      }

      // Add current user message
      messages.push({ role: 'user', content: currentUserMessage });

      this.logger.debug(
        `Assembled prompt: ${messages.length} messages (${recentTurns.length} recent turns)`,
      );

      return messages;
    } catch (error) {
      this.logger.error(`Failed to assemble prompt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build enhanced system prompt with context
   */
  private buildEnhancedSystemPrompt(
    basePrompt: string,
    pinnedFacts: string,
    summary: string,
  ): string {
    const sections: string[] = [basePrompt];

    if (pinnedFacts) {
      sections.push('\n## PINNED FACTS (Authoritative Defaults)\n' + pinnedFacts);
    }

    if (summary) {
      sections.push('\n## CONVERSATION CONTEXT (Background)\n' + summary);
    }

    sections.push(
      '\n## IMPORTANT CONTEXT RULES\n' +
        '- Pinned Facts = default identity (what is USUALLY true)\n' +
        '- Recent messages = current/temporary reality (what is happening RIGHT NOW)\n' +
        '- If user describes temporary changes (floating, coverage, different shift): treat as current context, NOT a correction to pinned facts\n' +
        '- Only update pinned facts on explicit statements of permanence\n' +
        '- Always prioritize recent conversation context over pinned facts for current situation',
    );

    return sections.join('\n');
  }

  /**
   * Format pinned facts as readable text
   */
  private formatPinnedFacts(facts: PinnedFacts): string {
    if (!facts || Object.keys(facts).length === 0) {
      return '';
    }

    const sections: string[] = [];

    // Work Identity
    if (facts.work_identity) {
      const identity = facts.work_identity;
      const parts: string[] = [];
      if (identity.role?.value)
        parts.push(`Role: ${identity.role.value} (${identity.role.source})`);
      if (identity.facility_type?.value)
        parts.push(
          `Facility Type: ${identity.facility_type.value} (${identity.facility_type.source})`,
        );
      if (identity.unit?.value) parts.push(`Unit: ${identity.unit.value} (${identity.unit.source})`);
      if (identity.shift?.value)
        parts.push(`Usual Shift: ${identity.shift.value} (${identity.shift.source})`);

      if (parts.length > 0) {
        sections.push('**Work Identity (Usual Assignment):**\n' + parts.join('\n'));
      }
    }

    // Safety Constraints
    if (facts.safety_constraints) {
      const safety = facts.safety_constraints;
      const parts: string[] = [];
      if (safety.allergies?.value && safety.allergies.value.length > 0)
        parts.push(`Allergies: ${safety.allergies.value.join(', ')}`);
      if (safety.physical_constraints?.value && safety.physical_constraints.value.length > 0)
        parts.push(`Physical Constraints: ${safety.physical_constraints.value.join(', ')}`);

      if (parts.length > 0) {
        sections.push('**Safety Constraints:**\n' + parts.join('\n'));
      }
    }

    // Organizational Context
    if (facts.organizational_context) {
      const org = facts.organizational_context;
      const parts: string[] = [];
      if (org.manager_name?.value) parts.push(`Manager: ${org.manager_name.value}`);
      if (org.management_level?.value) parts.push(`Level: ${org.management_level.value}`);

      if (parts.length > 0) {
        sections.push('**Organizational Context:**\n' + parts.join('\n'));
      }
    }

    // Goals
    if (facts.goals) {
      const goals = facts.goals;
      const parts: string[] = [];
      if (goals.active_goals?.value && goals.active_goals.value.length > 0)
        parts.push(`Active Goals: ${goals.active_goals.value.join(', ')}`);
      if (goals.target_timeline?.value && Object.keys(goals.target_timeline.value).length > 0)
        parts.push(
          `Timeline: ${Object.entries(goals.target_timeline.value)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}`,
        );

      if (parts.length > 0) {
        sections.push('**Goals:**\n' + parts.join('\n'));
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Format running summary
   */
  private formatRunningSummary(summary: string | null): string {
    if (!summary) {
      return '';
    }

    return summary;
  }
}
