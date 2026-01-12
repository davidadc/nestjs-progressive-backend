import { INotificationChannel } from './channel.strategy.interface';
import { NotificationPreference } from '../../preferences/domain/entities/notification-preference.entity';

export const CHANNEL_FACTORY = Symbol('CHANNEL_FACTORY');

export interface IChannelFactory {
  /**
   * Get all channels enabled for a notification type and user preferences
   */
  getChannelsForType(
    type: string,
    preferences: NotificationPreference,
  ): INotificationChannel[];

  /**
   * Get all available channels
   */
  getAllChannels(): INotificationChannel[];

  /**
   * Get a specific channel by name
   */
  getChannel(name: string): INotificationChannel | undefined;
}
