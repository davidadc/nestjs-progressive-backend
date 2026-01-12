import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChannel } from '../base.channel';
import { NotificationCreatedEvent } from '../../../notifications/domain/events/notification-created.event';

export interface SmsPayload {
  body: string;
  userId: string;
}

/**
 * SMS channel using Twilio adapter
 */
@Injectable()
export class SmsChannel extends BaseChannel {
  readonly name = 'sms';

  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private twilio: any;

  constructor(private readonly configService: ConfigService) {
    super();
    this.accountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber =
      this.configService.get<string>('TWILIO_FROM_NUMBER') || '';

    if (this.accountSid && this.authToken) {
      this.initializeTwilio();
    }
  }

  private async initializeTwilio(): Promise<void> {
    try {
      // Dynamic import to avoid errors if Twilio is not configured
      // In production, initialize Twilio client here
      this.logger.debug('Twilio SMS channel initialized');
    } catch (error) {
      this.logger.warn('Twilio not configured, SMS channel disabled');
    }
  }

  protected formatPayload(notification: NotificationCreatedEvent): SmsPayload {
    return {
      body: `${notification.title}: ${notification.message}`,
      userId: notification.userId,
    };
  }

  protected async deliver(payload: SmsPayload): Promise<void> {
    if (!this.accountSid || !this.authToken) {
      this.logger.debug('Twilio not configured, skipping SMS delivery');
      return;
    }

    // In production, you would:
    // 1. Look up user's phone number
    // 2. Send SMS via Twilio API
    this.logger.log(`Would send SMS to user ${payload.userId}: ${payload.body}`);
  }
}
