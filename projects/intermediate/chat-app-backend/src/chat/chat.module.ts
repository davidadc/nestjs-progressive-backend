import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './infrastructure/gateways/chat.gateway';
import { PresenceService } from './application/services/presence.service';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => ConversationsModule),
  ],
  providers: [ChatGateway, PresenceService],
  exports: [PresenceService],
})
export class ChatModule {}
