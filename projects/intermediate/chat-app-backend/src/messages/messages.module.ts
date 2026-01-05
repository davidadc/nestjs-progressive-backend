import { Module, forwardRef } from '@nestjs/common';
import { MessageService } from './application/services/message.service';
import { MessageRepository } from './infrastructure/persistence/message.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository.interface';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [forwardRef(() => ConversationsModule)],
  providers: [
    MessageService,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: MessageRepository,
    },
  ],
  exports: [MessageService, MESSAGE_REPOSITORY],
})
export class MessagesModule {}
