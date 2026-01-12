import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../drizzle/drizzle.module';
import { notifications } from '../../../drizzle/schema';
import {
  INotificationRepository,
  NotificationFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { NotificationMapper } from '../../application/mappers/notification.mapper';

type DrizzleDb = ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>;

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async save(notification: Notification): Promise<void> {
    const data = NotificationMapper.toPersistence(notification);

    await this.db
      .insert(notifications)
      .values(data)
      .onConflictDoUpdate({
        target: notifications.id,
        set: {
          read: data.read,
          readAt: data.readAt,
        },
      });
  }

  async findById(id: string): Promise<Notification | null> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return NotificationMapper.toDomain(results[0]);
  }

  async findByUserId(
    userId: string,
    pagination: PaginationOptions,
    filter?: NotificationFilter,
  ): Promise<PaginatedResult<Notification>> {
    const offset = (pagination.page - 1) * pagination.limit;

    // Build conditions
    const conditions = [eq(notifications.userId, userId)];

    if (filter?.read !== undefined) {
      conditions.push(eq(notifications.read, filter.read));
    }

    if (filter?.type) {
      conditions.push(
        eq(
          notifications.type,
          filter.type as
            | 'order_completed'
            | 'new_comment'
            | 'new_follower'
            | 'liked_post'
            | 'mention',
        ),
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    return {
      data: results.map(NotificationMapper.toDomain),
      total,
    };
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false)),
      );

    return result[0]?.count || 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false)),
      );

    // Return the count of affected rows
    return (result as any).rowCount || 0;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }
}
