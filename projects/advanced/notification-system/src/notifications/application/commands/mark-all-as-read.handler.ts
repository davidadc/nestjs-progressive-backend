import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarkAllAsReadCommand } from './mark-all-as-read.command';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';

export interface MarkAllAsReadResult {
  markedCount: number;
}

@CommandHandler(MarkAllAsReadCommand)
export class MarkAllAsReadHandler
  implements ICommandHandler<MarkAllAsReadCommand, MarkAllAsReadResult>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: MarkAllAsReadCommand): Promise<MarkAllAsReadResult> {
    const markedCount = await this.notificationRepository.markAllAsRead(
      command.userId,
    );
    return { markedCount };
  }
}
