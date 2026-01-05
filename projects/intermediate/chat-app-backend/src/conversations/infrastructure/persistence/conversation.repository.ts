import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.module';
import type { DrizzleDB } from '../../../database/drizzle.module';
import {
  conversations,
  conversationParticipants,
  users,
  messages,
} from '../../../database/schema';
import {
  IConversationRepository,
  ConversationWithParticipants,
} from '../../domain/repositories/conversation.repository.interface';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { ConversationParticipantEntity } from '../../domain/entities/conversation-participant.entity';

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<ConversationEntity | null> {
    const result = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    return result[0] ? new ConversationEntity(result[0]) : null;
  }

  async findByIdWithParticipants(
    id: string,
  ): Promise<ConversationWithParticipants | null> {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    const participantsData = await this.db
      .select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(
        and(
          eq(conversationParticipants.conversationId, id),
          sql`${conversationParticipants.leftAt} IS NULL`,
        ),
      );

    const lastMessage = await this.getLastMessage(id);

    return {
      ...conversation,
      participants: participantsData,
      lastMessage,
    };
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ conversations: ConversationWithParticipants[]; total: number }> {
    // Get conversation IDs where user is a participant
    const userConversations = await this.db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          sql`${conversationParticipants.leftAt} IS NULL`,
        ),
      );

    const conversationIds = userConversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return { conversations: [], total: 0 };
    }

    const total = conversationIds.length;
    const offset = (page - 1) * limit;

    const conversationsData = await this.db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    const result: ConversationWithParticipants[] = [];

    for (const conv of conversationsData) {
      const withParticipants = await this.findByIdWithParticipants(conv.id);
      if (withParticipants) {
        result.push(withParticipants);
      }
    }

    return { conversations: result, total };
  }

  async findExistingConversation(
    participantIds: string[],
  ): Promise<ConversationEntity | null> {
    if (participantIds.length !== 2) return null;

    interface RawConversationRow {
      id: string;
      name: string | null;
      is_group: boolean;
      created_at: Date;
      updated_at: Date;
    }

    // Find conversations where both users are participants and it's not a group
    const result = await this.db.execute(sql`
      SELECT c.* FROM conversations c
      INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp1.user_id = ${participantIds[0]}
        AND cp2.user_id = ${participantIds[1]}
        AND cp1.left_at IS NULL
        AND cp2.left_at IS NULL
        AND c.is_group = false
      LIMIT 1
    `);

    const rows = result as unknown as RawConversationRow[];
    if (rows.length === 0) return null;

    return new ConversationEntity({
      id: rows[0].id,
      name: rows[0].name,
      isGroup: rows[0].is_group,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    });
  }

  async create(
    conversation: Partial<ConversationEntity>,
  ): Promise<ConversationEntity> {
    const result = await this.db
      .insert(conversations)
      .values({
        name: conversation.name,
        isGroup: conversation.isGroup ?? false,
      })
      .returning();

    return new ConversationEntity(result[0]);
  }

  async addParticipant(
    participant: Partial<ConversationParticipantEntity>,
  ): Promise<ConversationParticipantEntity> {
    const result = await this.db
      .insert(conversationParticipants)
      .values({
        conversationId: participant.conversationId!,
        userId: participant.userId!,
      })
      .returning();

    return new ConversationParticipantEntity(result[0]);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.db
      .update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
          sql`${conversationParticipants.leftAt} IS NULL`,
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async getParticipantIds(conversationId: string): Promise<string[]> {
    const result = await this.db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          sql`${conversationParticipants.leftAt} IS NULL`,
        ),
      );

    return result.map((r) => r.userId);
  }

  private async getLastMessage(conversationId: string) {
    const result = await this.db
      .select({
        content: messages.content,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (result.length === 0) return null;

    return {
      content: result[0].content,
      createdAt: result[0].createdAt,
      sender: {
        id: result[0].senderId,
        name: result[0].senderName,
      },
    };
  }
}
