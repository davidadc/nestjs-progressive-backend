import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChannel } from '../base.channel';
import { NotificationCreatedEvent } from '../../../notifications/domain/events/notification-created.event';

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
  userId: string;
}

/**
 * Push notification channel using Firebase Cloud Messaging adapter
 */
@Injectable()
export class PushChannel extends BaseChannel {
  readonly name = 'push';

  private readonly projectId: string;
  private firebase: any;

  constructor(private readonly configService: ConfigService) {
    super();
    this.projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || '';

    if (this.projectId) {
      this.initializeFirebase();
    }
  }

  private async initializeFirebase(): Promise<void> {
    try {
      // Dynamic import to avoid errors if Firebase is not configured
      // In production, initialize Firebase Admin SDK here
      this.logger.debug('Firebase push channel initialized');
    } catch (error) {
      this.logger.warn('Firebase not configured, push channel disabled');
    }
  }

  protected formatPayload(notification: NotificationCreatedEvent): PushPayload {
    return {
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.notificationId,
        type: notification.type,
        ...notification.data,
      },
      userId: notification.userId,
    };
  }

  protected async deliver(payload: PushPayload): Promise<void> {
    if (!this.projectId) {
      this.logger.debug('Firebase not configured, skipping push delivery');
      return;
    }

    // In production, you would:
    // 1. Look up user's FCM tokens
    // 2. Send push notification via Firebase Admin SDK
    this.logger.log(
      `Would send push notification to user ${payload.userId}: ${payload.title}`,
    );
  }
}
