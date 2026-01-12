import { Logger } from '@nestjs/common';
import { INotificationChannel } from '../domain/channel.strategy.interface';
import { NotificationCreatedEvent } from '../../notifications/domain/events/notification-created.event';
import { NotificationPreference } from '../../preferences/domain/entities/notification-preference.entity';

/**
 * Base channel implementing Template Method pattern
 * Provides common logic for all notification channels
 */
export abstract class BaseChannel implements INotificationChannel {
  protected readonly logger: Logger;
  abstract readonly name: string;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Check if this channel can send based on user preferences
   */
  canSend(preferences: NotificationPreference, type: string): boolean {
    // Check global preference for this channel
    const channelName = this.name as 'email' | 'push' | 'sms';
    return preferences.isChannelEnabled(channelName, type);
  }

  /**
   * Template method for sending notifications
   */
  async send(notification: NotificationCreatedEvent): Promise<void> {
    this.logger.debug(`Sending notification via ${this.name}`);

    try {
      // Format the payload (to be implemented by subclasses)
      const payload = this.formatPayload(notification);

      // Deliver the notification (to be implemented by subclasses)
      await this.deliver(payload);

      // Log successful delivery
      this.logger.log(
        `Successfully delivered notification ${notification.notificationId} via ${this.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to deliver notification ${notification.notificationId} via ${this.name}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Format the notification payload for this channel
   * To be implemented by subclasses
   */
  protected abstract formatPayload(notification: NotificationCreatedEvent): any;

  /**
   * Deliver the notification via the external service
   * To be implemented by subclasses
   */
  protected abstract deliver(payload: any): Promise<void>;
}
