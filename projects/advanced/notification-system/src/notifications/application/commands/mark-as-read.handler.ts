import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarkAsReadCommand } from './mark-as-read.command';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import {
  NotificationNotFoundException,
  NotificationAccessDeniedException,
} from '../../domain/exceptions/notification.exceptions';
import { NotificationMapper } from '../mappers/notification.mapper';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler
  implements ICommandHandler<MarkAsReadCommand, NotificationResponseDto>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkAsReadCommand): Promise<NotificationResponseDto> {
    // Find the notification
    const notification = await this.notificationRepository.findById(
      command.notificationId,
    );

    if (!notification) {
      throw new NotificationNotFoundException(command.notificationId);
    }

    // Verify ownership
    if (!notification.belongsTo(command.userId)) {
      throw new NotificationAccessDeniedException(
        command.notificationId,
        command.userId,
      );
    }

    // Mark as read (domain logic)
    notification.markAsRead();

    // Persist changes
    await this.notificationRepository.save(notification);

    // Publish domain events
    const events = notification.getUncommittedEvents();
    this.eventBus.publishAll(events);
    notification.clearDomainEvents();

    // Return DTO
    return NotificationMapper.toDto(notification);
  }
}
