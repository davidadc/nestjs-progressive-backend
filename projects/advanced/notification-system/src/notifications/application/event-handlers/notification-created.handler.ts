import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { NotificationCreatedEvent } from '../../domain/events/notification-created.event';
import type { IPreferenceRepository } from '../../../preferences/domain/repositories/preference.repository.interface';
import { PREFERENCE_REPOSITORY } from '../../../preferences/domain/repositories/preference.repository.interface';
import { NotificationPreference } from '../../../preferences/domain/entities/notification-preference.entity';
import type { IChannelFactory } from '../../../channels/domain/channel.factory';
import { CHANNEL_FACTORY } from '../../../channels/domain/channel.factory';

@EventsHandler(NotificationCreatedEvent)
export class NotificationCreatedHandler
  implements IEventHandler<NotificationCreatedEvent>
{
  private readonly logger = new Logger(NotificationCreatedHandler.name);

  constructor(
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: IPreferenceRepository,
    @Inject(CHANNEL_FACTORY)
    private readonly channelFactory: IChannelFactory,
  ) {}

  async handle(event: NotificationCreatedEvent): Promise<void> {
    this.logger.log(
      `Processing notification created event: ${event.notificationId}`,
    );

    try {
      // Get user preferences
      let preferences = await this.preferenceRepository.findByUserId(
        event.userId,
      );

      if (!preferences) {
        // Use default preferences
        preferences = NotificationPreference.createDefault(event.userId);
      }

      // Get enabled channels for this notification type
      const channels = this.channelFactory.getChannelsForType(
        event.type,
        preferences,
      );

      if (channels.length === 0) {
        this.logger.debug(
          `No channels enabled for notification type ${event.type}`,
        );
        return;
      }

      // Send via each channel (Strategy Pattern)
      const results = await Promise.allSettled(
        channels.map(async (channel) => {
          try {
            await channel.send(event);
            this.logger.log(
              `Notification ${event.notificationId} sent via ${channel.name}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send notification ${event.notificationId} via ${channel.name}`,
              error,
            );
            throw error;
          }
        }),
      );

      // Log summary
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      this.logger.log(
        `Notification ${event.notificationId} delivery: ${successful} successful, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing notification created event: ${event.notificationId}`,
        error,
      );
    }
  }
}
