import { Injectable, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChannel } from '../base.channel';
import { NotificationCreatedEvent } from '../../../notifications/domain/events/notification-created.event';

export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  userId: string;
}

/**
 * Email channel using SendGrid adapter
 */
@Injectable()
export class EmailChannel extends BaseChannel {
  readonly name = 'email';

  private readonly apiKey: string;
  private readonly fromEmail: string;
  private sendgrid: any;

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@example.com';

    if (this.apiKey) {
      this.initializeSendGrid();
    }
  }

  private async initializeSendGrid(): Promise<void> {
    try {
      // Dynamic import to avoid errors if SendGrid is not configured
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);
      this.sendgrid = sgMail.default;
    } catch (error) {
      this.logger.warn('SendGrid not configured, email channel disabled');
    }
  }

  protected formatPayload(notification: NotificationCreatedEvent): EmailPayload {
    return {
      to: '', // Will be resolved in deliver
      from: this.fromEmail,
      subject: notification.title,
      html: this.renderTemplate(notification),
      userId: notification.userId,
    };
  }

  protected async deliver(payload: EmailPayload): Promise<void> {
    if (!this.sendgrid || !this.apiKey) {
      this.logger.debug('SendGrid not configured, skipping email delivery');
      return;
    }

    // In production, you would look up the user's email here
    // For now, we'll log the intent
    this.logger.log(
      `Would send email to user ${payload.userId}: ${payload.subject}`,
    );

    // Uncomment to actually send:
    // await this.sendgrid.send({
    //   to: payload.to,
    //   from: payload.from,
    //   subject: payload.subject,
    //   html: payload.html,
    // });
  }

  private renderTemplate(notification: NotificationCreatedEvent): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4A90D9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <p>${notification.message}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
