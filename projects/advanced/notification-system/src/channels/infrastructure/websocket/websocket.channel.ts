import { Injectable } from '@nestjs/common';
import { BaseChannel } from '../base.channel';
import { NotificationCreatedEvent } from '../../../notifications/domain/events/notification-created.event';
import { NotificationPreference } from '../../../preferences/domain/entities/notification-preference.entity';

export interface WebSocketPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

/**
 * WebSocket channel for real-time notifications
 * Always enabled for real-time delivery
 */
@Injectable()
export class WebSocketChannel extends BaseChannel {
  readonly name = 'websocket';

  private wsServer: any; // Will be injected by NotificationsGateway

  /**
   * Set the WebSocket server reference
   */
  setServer(server: any): void {
    this.wsServer = server;
  }

  /**
   * WebSocket is always enabled (doesn't depend on user preferences for global channel)
   */
  canSend(_preferences: NotificationPreference, _type: string): boolean {
    return true; // WebSocket always sends real-time updates
  }

  protected formatPayload(notification: NotificationCreatedEvent): WebSocketPayload {
    return {
      id: notification.notificationId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.occurredOn.toISOString(),
    };
  }

  protected async deliver(payload: WebSocketPayload): Promise<void> {
    if (!this.wsServer) {
      this.logger.warn('WebSocket server not initialized, skipping delivery');
      return;
    }

    // Emit to user-specific room
    this.wsServer.to(`user:${payload.userId}`).emit('notification', payload);
  }
}
