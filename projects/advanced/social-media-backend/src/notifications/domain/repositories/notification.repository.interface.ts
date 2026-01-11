import type { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNotificationData {
  userId: string;
  type: 'follow' | 'like' | 'comment';
  actorId: string;
  targetId: string;
}

export interface INotificationRepository {
  findById(id: string): Promise<NotificationEntity | null>;
  findByUser(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<NotificationEntity>>;
  findUnreadByUser(userId: string): Promise<NotificationEntity[]>;
  getUnreadCount(userId: string): Promise<number>;
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
