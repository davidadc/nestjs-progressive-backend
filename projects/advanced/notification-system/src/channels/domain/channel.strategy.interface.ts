import { NotificationCreatedEvent } from '../../notifications/domain/events/notification-created.event';
import { NotificationPreference } from '../../preferences/domain/entities/notification-preference.entity';

/**
 * Strategy interface for notification channels
 */
export interface INotificationChannel {
  /**
   * Channel name identifier
   */
  readonly name: string;

  /**
   * Check if this channel can send to a user based on their preferences
   */
  canSend(preferences: NotificationPreference, type: string): boolean;

  /**
   * Send a notification via this channel
   */
  send(notification: NotificationCreatedEvent): Promise<void>;
}
