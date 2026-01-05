import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, lt, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.module';
import type { DrizzleDB } from '../../../database/drizzle.module';
import { messages, users } from '../../../database/schema';
import {
  IMessageRepository,
  MessageWithSender,
} from '../../domain/repositories/message.repository.interface';
import { MessageEntity } from '../../domain/entities/message.entity';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<MessageEntity | null> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    return result[0] ? new MessageEntity(result[0]) : null;
  }

  async findByConversationId(
    conversationId: string,
    page: number,
    limit: number,
    before?: Date,
  ): Promise<{
    messages: MessageWithSender[];
    total: number;
    hasMore: boolean;
  }> {
    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const total = Number(countResult[0]?.count || 0);

    // Build query
    let query = this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderName: users.name,
        senderAvatar: users.avatar,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .$dynamic();

    if (before) {
      query = query.where(lt(messages.createdAt, before));
    }

    const offset = (page - 1) * limit;
    const result = await query
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesWithSender: MessageWithSender[] = result.map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: {
        id: row.senderId,
        name: row.senderName,
        avatar: row.senderAvatar,
      },
    }));

    const hasMore = offset + result.length < total;

    return { messages: messagesWithSender, total, hasMore };
  }

  async create(message: Partial<MessageEntity>): Promise<MessageEntity> {
    const result = await this.db
      .insert(messages)
      .values({
        conversationId: message.conversationId!,
        senderId: message.senderId!,
        content: message.content!,
      })
      .returning();

    return new MessageEntity(result[0]);
  }

  async getLastMessage(
    conversationId: string,
  ): Promise<MessageWithSender | null> {
    const result = await this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderName: users.name,
        senderAvatar: users.avatar,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (result.length === 0) return null;

    return {
      id: result[0].id,
      conversationId: result[0].conversationId,
      senderId: result[0].senderId,
      content: result[0].content,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
      sender: {
        id: result[0].senderId,
        name: result[0].senderName,
        avatar: result[0].senderAvatar,
      },
    };
  }
}
