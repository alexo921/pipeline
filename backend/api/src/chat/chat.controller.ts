import { Body, Controller, Get, Query, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatCompletionDto } from './dto/create-chat.dto';
import { ConversationService } from './services/conversation.service';
import { ConversationMemoryService, PinnedFacts } from './services/conversation-memory.service';
import { SummaryUpdateService } from './services/summary-update.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService,
    private readonly memoryService: ConversationMemoryService,
    private readonly summaryUpdateService: SummaryUpdateService,
  ) {}

  @Post()
  createCompletion(@Body() payload: CreateChatCompletionDto) {
    return this.chatService.createCompletion(payload);
  }

  @Get('history')
  getHistory(@Query('userId') userId?: string, @Query('limit') limit?: string) {
    return this.chatService.getHistory(userId, limit ? Number(limit) : undefined);
  }

  /**
   * TEST ENDPOINT: Seed pinned facts for a user's conversation
   * Use this to set up test scenarios for the context layer
   */
  @Post('test/seed-pinned-facts')
  async seedPinnedFacts(
    @Body() payload: { userId: string; pinnedFacts: PinnedFacts },
  ) {
    // Get or create conversation for user
    const conversationId = await this.conversationService.getOrCreateConversation(
      payload.userId,
    );

    // Update pinned facts
    await this.memoryService.updatePinnedFacts(conversationId, payload.pinnedFacts);

    // Return conversation info
    const conversation = await this.conversationService.getConversationWithMemory(
      conversationId,
    );

    return {
      success: true,
      conversationId,
      pinnedFacts: conversation?.memory?.pinnedFacts,
      summaryVersion: conversation?.memory?.summaryVersion,
    };
  }

  /**
   * TEST ENDPOINT: Get conversation memory state
   * Use this to inspect the current state of pinned facts and summary
   */
  @Get('test/memory')
  async getMemoryState(@Query('userId') userId: string) {
    const conversationId = await this.conversationService.getOrCreateConversation(userId);
    const conversation = await this.conversationService.getConversationWithMemory(conversationId);

    return {
      conversationId,
      pinnedFacts: conversation?.memory?.pinnedFacts,
      runningSummary: conversation?.memory?.runningSummary,
      summaryVersion: conversation?.memory?.summaryVersion,
      summaryUpdatedAt: conversation?.memory?.summaryUpdatedAt,
      messageCount: conversation?.messageCount,
      totalInputTokens: conversation?.totalInputTokens,
      totalOutputTokens: conversation?.totalOutputTokens,
    };
  }

  /**
   * TEST ENDPOINT: Manually trigger summary update
   */
  @Post('test/trigger-summary')
  async triggerSummaryUpdate(@Body() payload: { userId: string }) {
    const conversationId = await this.conversationService.getOrCreateConversation(
      payload.userId,
    );

    await this.summaryUpdateService.manualUpdate(conversationId);

    const conversation = await this.conversationService.getConversationWithMemory(conversationId);

    return {
      success: true,
      message: 'Summary update triggered',
      conversationId,
      runningSummary: conversation?.memory?.runningSummary,
      summaryVersion: conversation?.memory?.summaryVersion,
    };
  }

  /**
   * TEST ENDPOINT: Reset conversation for a user (for fresh testing)
   */
  @Post('test/reset')
  async resetConversation(@Body() payload: { userId: string }) {
    // End existing conversation
    const existingConvId = await this.conversationService.getOrCreateConversation(payload.userId);
    await this.conversationService.endConversation(existingConvId);

    // Create new conversation
    const newConvId = await this.conversationService.getOrCreateConversation(payload.userId);

    return {
      success: true,
      message: 'Conversation reset',
      oldConversationId: existingConvId,
      newConversationId: newConvId,
    };
  }
}
