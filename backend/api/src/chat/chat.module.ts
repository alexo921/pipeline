import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConversationService } from './services/conversation.service';
import { ConversationMemoryService } from './services/conversation-memory.service';
import { PromptAssemblyService } from './services/prompt-assembly.service';
import { SummaryUpdateService } from './services/summary-update.service';
import { SafetyEscalationService } from './services/safety-escalation.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationService,
    ConversationMemoryService,
    PromptAssemblyService,
    SummaryUpdateService,
    SafetyEscalationService,
  ],
  exports: [
    ChatService,
    ConversationService,
    ConversationMemoryService,
    SummaryUpdateService,
    SafetyEscalationService,
  ],
})
export class ChatModule {}
