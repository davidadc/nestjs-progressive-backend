import { Module, forwardRef } from '@nestjs/common';
import { ConversationService } from './application/services/conversation.service';
import { ConversationsController } from './infrastructure/controllers/conversations.controller';
import { ConversationRepository } from './infrastructure/persistence/conversation.repository';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation.repository.interface';
import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [UsersModule, forwardRef(() => MessagesModule)],
  controllers: [ConversationsController],
  providers: [
    ConversationService,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: ConversationRepository,
    },
  ],
  exports: [ConversationService, CONVERSATION_REPOSITORY],
})
export class ConversationsModule {}
