import { Injectable } from '@nestjs/common';
import { IChannelFactory } from '../domain/channel.factory';
import { INotificationChannel } from '../domain/channel.strategy.interface';
import { NotificationPreference } from '../../preferences/domain/entities/notification-preference.entity';
import { WebSocketChannel } from './websocket/websocket.channel';
import { EmailChannel } from './email/sendgrid.channel';
import { PushChannel } from './push/fcm.channel';
import { SmsChannel } from './sms/twilio.channel';

@Injectable()
export class ChannelFactory implements IChannelFactory {
  private readonly channels: Map<string, INotificationChannel>;

  constructor(
    private readonly webSocketChannel: WebSocketChannel,
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
    private readonly smsChannel: SmsChannel,
  ) {
    this.channels = new Map<string, INotificationChannel>();
    this.channels.set('websocket', webSocketChannel);
    this.channels.set('email', emailChannel);
    this.channels.set('push', pushChannel);
    this.channels.set('sms', smsChannel);
  }

  getChannelsForType(
    type: string,
    preferences: NotificationPreference,
  ): INotificationChannel[] {
    const enabledChannels: INotificationChannel[] = [];

    for (const channel of this.channels.values()) {
      if (channel.canSend(preferences, type)) {
        enabledChannels.push(channel);
      }
    }

    return enabledChannels;
  }

  getAllChannels(): INotificationChannel[] {
    return Array.from(this.channels.values());
  }

  getChannel(name: string): INotificationChannel | undefined {
    return this.channels.get(name);
  }
}
