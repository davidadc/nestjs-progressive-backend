import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type {
  IMessageRepository,
  MessageWithSender,
} from '../../domain/repositories/message.repository.interface';
import { MESSAGE_REPOSITORY } from '../../domain/repositories/message.repository.interface';
import type { IConversationRepository } from '../../../conversations/domain/repositories/conversation.repository.interface';
import { CONVERSATION_REPOSITORY } from '../../../conversations/domain/repositories/conversation.repository.interface';
import { SendMessageDto, MessageResponseDto } from '../dto';
import { PaginationMetaDto } from '../../../common/dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    senderId: string,
  ): Promise<MessageResponseDto> {
    // Validate conversation exists
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Validate user is participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Create message
    const message = await this.messageRepository.create({
      conversationId,
      senderId,
      content: dto.content,
    });

    // Fetch with sender info
    const messagesResult = await this.messageRepository.findByConversationId(
      conversationId,
      1,
      1,
    );
    const messageWithSender = messagesResult.messages.find(
      (m) => m.id === message.id,
    );

    if (!messageWithSender) {
      // Fallback if not found immediately
      return {
        id: message.id,
        conversationId: message.conversationId,
        sender: { id: senderId, name: 'Unknown', avatar: null },
        content: message.content,
        createdAt: message.createdAt,
      };
    }

    return this.toMessageResponse(messageWithSender);
  }

  async getMessageHistory(
    conversationId: string,
    userId: string,
    page: number,
    limit: number,
    before?: Date,
  ): Promise<{
    messages: MessageResponseDto[];
    pagination: PaginationMetaDto;
  }> {
    // Validate conversation exists
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Validate user is participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    const { messages, total } =
      await this.messageRepository.findByConversationId(
        conversationId,
        page,
        limit,
        before,
      );

    return {
      messages: messages.map((m) => this.toMessageResponse(m)),
      pagination: new PaginationMetaDto(page, limit, total),
    };
  }

  private toMessageResponse(message: MessageWithSender): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        avatar: message.sender.avatar ?? undefined,
      },
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
