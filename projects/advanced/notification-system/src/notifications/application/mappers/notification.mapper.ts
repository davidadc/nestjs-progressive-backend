import { Notification } from '../../domain/aggregates/notification.aggregate';
import { NotificationId } from '../../domain/value-objects/notification-id.vo';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationRow } from '../../../drizzle/schema';

export class NotificationMapper {
  /**
   * Map domain entity to response DTO
   */
  public static toDto(entity: Notification): NotificationResponseDto {
    return {
      id: entity.id.value,
      userId: entity.userId,
      type: entity.type.value,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      read: entity.read,
      readAt: entity.readAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  /**
   * Map database row to domain entity
   */
  public static toDomain(row: NotificationRow): Notification {
    return Notification.reconstitute({
      id: NotificationId.create(row.id),
      userId: row.userId,
      type: NotificationType.create(row.type),
      title: row.title,
      message: row.message,
      data: (row.data as Record<string, unknown>) || {},
      read: row.read,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }

  /**
   * Map domain entity to database insert object
   */
  public static toPersistence(entity: Notification): {
    id: string;
    userId: string;
    type: 'order_completed' | 'new_comment' | 'new_follower' | 'liked_post' | 'mention';
    title: string;
    message: string;
    data: Record<string, unknown>;
    read: boolean;
    readAt: Date | null;
    createdAt: Date;
  } {
    return {
      id: entity.id.value,
      userId: entity.userId,
      type: entity.type.value,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      read: entity.read,
      readAt: entity.readAt,
      createdAt: entity.createdAt,
    };
  }
}
