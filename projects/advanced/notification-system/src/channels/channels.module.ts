import { Module, Global } from '@nestjs/common';
import { CHANNEL_FACTORY } from './domain/channel.factory';
import { ChannelFactory } from './infrastructure/channel.factory.impl';
import { WebSocketChannel } from './infrastructure/websocket/websocket.channel';
import { EmailChannel } from './infrastructure/email/sendgrid.channel';
import { PushChannel } from './infrastructure/push/fcm.channel';
import { SmsChannel } from './infrastructure/sms/twilio.channel';

@Global()
@Module({
  providers: [
    WebSocketChannel,
    EmailChannel,
    PushChannel,
    SmsChannel,
    {
      provide: CHANNEL_FACTORY,
      useClass: ChannelFactory,
    },
  ],
  exports: [
    CHANNEL_FACTORY,
    WebSocketChannel,
    EmailChannel,
    PushChannel,
    SmsChannel,
  ],
})
export class ChannelsModule {}
