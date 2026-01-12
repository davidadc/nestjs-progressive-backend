import { Notification } from '../aggregates/notification.aggregate';

export interface NotificationFilter {
  read?: boolean;
  type?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
  /**
   * Save a notification (insert or update)
   */
  save(notification: Notification): Promise<void>;

  /**
   * Find a notification by ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications for a user with pagination and filtering
   */
  findByUserId(
    userId: string,
    pagination: PaginationOptions,
    filter?: NotificationFilter,
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Count unread notifications for a user
   */
  countUnread(userId: string): Promise<number>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Delete a notification
   */
  delete(id: string): Promise<void>;
}
