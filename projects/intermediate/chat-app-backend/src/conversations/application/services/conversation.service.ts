import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type {
  IConversationRepository,
  ConversationWithParticipants,
} from '../../domain/repositories/conversation.repository.interface';
import { CONVERSATION_REPOSITORY } from '../../domain/repositories/conversation.repository.interface';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { CreateConversationDto, ConversationResponseDto } from '../dto';
import { PaginationMetaDto } from '../../../common/dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async create(
    dto: CreateConversationDto,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    // Add current user to participants
    const allParticipantIds = [
      ...new Set([currentUserId, ...dto.participantIds]),
    ];

    // Validate all participants exist
    const users = await this.userRepository.findByIds(allParticipantIds);
    if (users.length !== allParticipantIds.length) {
      throw new BadRequestException('One or more participants not found');
    }

    // Check for existing 1:1 conversation
    if (allParticipantIds.length === 2 && !dto.name) {
      const existing =
        await this.conversationRepository.findExistingConversation(
          allParticipantIds,
        );
      if (existing) {
        const withParticipants =
          await this.conversationRepository.findByIdWithParticipants(
            existing.id,
          );
        return this.toConversationResponse(withParticipants!);
      }
    }

    // Create conversation
    const isGroup = allParticipantIds.length > 2 || !!dto.name;
    const conversation = await this.conversationRepository.create({
      name: dto.name,
      isGroup,
    });

    // Add participants
    for (const userId of allParticipantIds) {
      await this.conversationRepository.addParticipant({
        conversationId: conversation.id,
        userId,
      });
    }

    const withParticipants =
      await this.conversationRepository.findByIdWithParticipants(
        conversation.id,
      );
    return this.toConversationResponse(withParticipants!);
  }

  async findById(
    id: string,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    const conversation =
      await this.conversationRepository.findByIdWithParticipants(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = await this.conversationRepository.isParticipant(
      id,
      currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    return this.toConversationResponse(conversation);
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    conversations: ConversationResponseDto[];
    pagination: PaginationMetaDto;
  }> {
    const { conversations, total } =
      await this.conversationRepository.findByUserId(userId, page, limit);

    return {
      conversations: conversations.map((c) => this.toConversationResponse(c)),
      pagination: new PaginationMetaDto(page, limit, total),
    };
  }

  async addParticipant(
    conversationId: string,
    userId: string,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    const conversation =
      await this.conversationRepository.findByIdWithParticipants(
        conversationId,
      );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    const isAlreadyParticipant =
      await this.conversationRepository.isParticipant(conversationId, userId);
    if (isAlreadyParticipant) {
      throw new BadRequestException('User is already a participant');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.conversationRepository.addParticipant({
      conversationId,
      userId,
    });

    const updated =
      await this.conversationRepository.findByIdWithParticipants(
        conversationId,
      );
    return this.toConversationResponse(updated!);
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    return this.conversationRepository.isParticipant(conversationId, userId);
  }

  async getParticipantIds(conversationId: string): Promise<string[]> {
    return this.conversationRepository.getParticipantIds(conversationId);
  }

  private toConversationResponse(
    conversation: ConversationWithParticipants,
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage,
      createdAt: conversation.createdAt,
    };
  }
}
