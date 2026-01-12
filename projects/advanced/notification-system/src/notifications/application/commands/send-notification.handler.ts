import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendNotificationCommand } from './send-notification.command';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import type { IPreferenceRepository } from '../../../preferences/domain/repositories/preference.repository.interface';
import { PREFERENCE_REPOSITORY } from '../../../preferences/domain/repositories/preference.repository.interface';
import type { IChannelFactory } from '../../../channels/domain/channel.factory';
import { CHANNEL_FACTORY } from '../../../channels/domain/channel.factory';
import { NotificationPreference } from '../../../preferences/domain/entities/notification-preference.entity';
import { NotificationCreatedEvent } from '../../domain/events/notification-created.event';
import { NotificationSentEvent } from '../../domain/events/notification-sent.event';
import {
  NotificationNotFoundException,
  NotificationAccessDeniedException,
} from '../../domain/exceptions/notification.exceptions';

export interface SendNotificationResult {
  notificationId: string;
  channelsSent: string[];
  channelsFailed: string[];
}

@CommandHandler(SendNotificationCommand)
export class SendNotificationHandler
  implements ICommandHandler<SendNotificationCommand, SendNotificationResult>
{
  private readonly logger = new Logger(SendNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: IPreferenceRepository,
    @Inject(CHANNEL_FACTORY)
    private readonly channelFactory: IChannelFactory,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SendNotificationCommand): Promise<SendNotificationResult> {
    const { notificationId, userId, channels: requestedChannels } = command;

    // Load notification
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotificationNotFoundException(notificationId);
    }

    // Verify ownership
    if (notification.userId !== userId) {
      throw new NotificationAccessDeniedException(notificationId, userId);
    }

    // Get user preferences
    let preferences = await this.preferenceRepository.findByUserId(userId);
    if (!preferences) {
      preferences = NotificationPreference.createDefault(userId);
    }

    // Create event for channel sending
    const event = new NotificationCreatedEvent(
      notification.id.value,
      notification.userId,
      notification.type.value,
      notification.title,
      notification.message,
      notification.data,
    );

    // Determine which channels to use
    let channelsToUse = requestedChannels
      ? requestedChannels
          .map((name) => this.channelFactory.getChannel(name))
          .filter((ch): ch is NonNullable<typeof ch> => ch !== undefined)
      : this.channelFactory.getChannelsForType(notification.type.value, preferences);

    const channelsSent: string[] = [];
    const channelsFailed: string[] = [];

    // Send via each channel
    const results = await Promise.allSettled(
      channelsToUse.map(async (channel) => {
        try {
          await channel.send(event);
          this.logger.log(
            `Notification ${notificationId} sent via ${channel.name}`,
          );
          return { channel: channel.name, success: true };
        } catch (error) {
          this.logger.error(
            `Failed to send notification ${notificationId} via ${channel.name}`,
            error,
          );
          throw { channel: channel.name, error };
        }
      }),
    );

    // Categorize results
    results.forEach((result, index) => {
      const channelName = channelsToUse[index].name;
      if (result.status === 'fulfilled') {
        channelsSent.push(channelName);
      } else {
        channelsFailed.push(channelName);
      }
    });

    // Publish sent events for each successful channel
    channelsSent.forEach((channel) => {
      this.eventBus.publish(
        new NotificationSentEvent(notificationId, userId, channel, true),
      );
    });

    // Publish failed events for each failed channel
    channelsFailed.forEach((channel) => {
      this.eventBus.publish(
        new NotificationSentEvent(notificationId, userId, channel, false, 'Delivery failed'),
      );
    });

    this.logger.log(
      `Notification ${notificationId} delivery: ${channelsSent.length} successful, ${channelsFailed.length} failed`,
    );

    return {
      notificationId,
      channelsSent,
      channelsFailed,
    };
  }
}
