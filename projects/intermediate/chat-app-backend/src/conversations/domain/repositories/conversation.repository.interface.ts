import { ConversationEntity } from '../entities/conversation.entity';
import { ConversationParticipantEntity } from '../entities/conversation-participant.entity';

export interface ConversationWithParticipants extends ConversationEntity {
  participants: { id: string; name: string; avatar?: string | null }[];
  lastMessage?: {
    content: string;
    createdAt: Date;
    sender: { id: string; name: string };
  } | null;
}

export interface IConversationRepository {
  findById(id: string): Promise<ConversationEntity | null>;
  findByIdWithParticipants(
    id: string,
  ): Promise<ConversationWithParticipants | null>;
  findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ conversations: ConversationWithParticipants[]; total: number }>;
  findExistingConversation(
    participantIds: string[],
  ): Promise<ConversationEntity | null>;
  create(
    conversation: Partial<ConversationEntity>,
  ): Promise<ConversationEntity>;
  addParticipant(
    participant: Partial<ConversationParticipantEntity>,
  ): Promise<ConversationParticipantEntity>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  getParticipantIds(conversationId: string): Promise<string[]>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
