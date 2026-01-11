import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler
  implements ICommandHandler<MarkNotificationReadCommand, void>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const { notificationId, userId } = command;

    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw ProblemDetailsFactory.notFound(
        'Notification',
        notificationId,
        `GET /api/v1/notifications/${notificationId}`,
      );
    }

    if (notification.userId !== userId) {
      throw ProblemDetailsFactory.forbidden(
        'mark this notification as read',
        'PATCH /api/v1/notifications/:id/read',
      );
    }

    await this.notificationRepository.markAsRead(notificationId);
  }
}
