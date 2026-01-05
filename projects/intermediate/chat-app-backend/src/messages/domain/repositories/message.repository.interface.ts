import { MessageEntity } from '../entities/message.entity';

export interface MessageWithSender extends MessageEntity {
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface IMessageRepository {
  findById(id: string): Promise<MessageEntity | null>;
  findByConversationId(
    conversationId: string,
    page: number,
    limit: number,
    before?: Date,
  ): Promise<{
    messages: MessageWithSender[];
    total: number;
    hasMore: boolean;
  }>;
  create(message: Partial<MessageEntity>): Promise<MessageEntity>;
  getLastMessage(conversationId: string): Promise<MessageWithSender | null>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
