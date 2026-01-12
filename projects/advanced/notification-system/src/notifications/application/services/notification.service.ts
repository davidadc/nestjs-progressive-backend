import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateNotificationCommand } from '../commands/create-notification.command';
import { SendNotificationCommand } from '../commands/send-notification.command';
import { MarkAsReadCommand } from '../commands/mark-as-read.command';
import { MarkAllAsReadCommand } from '../commands/mark-all-as-read.command';
import { GetNotificationsQuery } from '../queries/get-notifications.query';
import { GetUnreadCountQuery } from '../queries/get-unread-count.query';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { PaginationDto } from '../dto/pagination.dto';
import type { SendNotificationResult } from '../commands/send-notification.handler';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: NotificationTypeValue;
}

export interface GetNotificationsResult {
  data: NotificationResponseDto[];
  pagination: PaginationDto;
}

/**
 * Application service that orchestrates notification operations.
 * Acts as a facade over the CQRS commands and queries.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.commandBus.execute(
      new CreateNotificationCommand(
        dto.userId,
        dto.type,
        dto.title,
        dto.message,
        dto.data,
      ),
    );
  }

  /**
   * Send/resend a notification through specified channels
   */
  async sendNotification(
    notificationId: string,
    userId: string,
    channels?: string[],
  ): Promise<SendNotificationResult> {
    return this.commandBus.execute(
      new SendNotificationCommand(notificationId, userId, channels),
    );
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    return this.commandBus.execute(
      new MarkAsReadCommand(notificationId, userId),
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    return this.commandBus.execute(new MarkAllAsReadCommand(userId));
  }

  /**
   * Get notifications for a user with pagination and filtering
   */
  async getNotifications(
    userId: string,
    options: GetNotificationsOptions = {},
  ): Promise<GetNotificationsResult> {
    const { page = 1, limit = 20, read, type } = options;
    return this.queryBus.execute(
      new GetNotificationsQuery(userId, page, limit, read, type),
    );
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return this.queryBus.execute(new GetUnreadCountQuery(userId));
  }
}
