import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateNotificationCommand } from './create-notification.command';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import { NotificationMapper } from '../mappers/notification.mapper';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler
  implements ICommandHandler<CreateNotificationCommand, NotificationResponseDto>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<NotificationResponseDto> {
    // Create the notification aggregate (domain logic)
    const notification = Notification.create({
      userId: command.userId,
      type: NotificationType.create(command.type),
      title: command.title,
      message: command.message,
      data: command.data,
    });

    // Persist the notification
    await this.notificationRepository.save(notification);

    // Publish domain events
    const events = notification.getUncommittedEvents();
    this.eventBus.publishAll(events);
    notification.clearDomainEvents();

    // Return DTO
    return NotificationMapper.toDto(notification);
  }
}
