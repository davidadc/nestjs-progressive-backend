import { ValueObject } from '../../../common/domain/value-object';
import { InvalidNotificationChannelException } from '../exceptions/notification.exceptions';

export const NOTIFICATION_CHANNELS = [
  'email',
  'push',
  'sms',
  'websocket',
] as const;

export type NotificationChannelValue = (typeof NOTIFICATION_CHANNELS)[number];

interface NotificationChannelProps {
  value: NotificationChannelValue;
}

export class NotificationChannel extends ValueObject<NotificationChannelProps> {
  private constructor(props: NotificationChannelProps) {
    super(props);
  }

  public static create(channel: string): NotificationChannel {
    if (!NOTIFICATION_CHANNELS.includes(channel as NotificationChannelValue)) {
      throw new InvalidNotificationChannelException(channel);
    }
    return new NotificationChannel({
      value: channel as NotificationChannelValue,
    });
  }

  get value(): NotificationChannelValue {
    return this.props.value;
  }

  /**
   * Whether this channel delivers in real-time
   */
  public isRealTime(): boolean {
    return this.value === 'websocket';
  }

  /**
   * Whether this channel guarantees delivery
   */
  public isGuaranteed(): boolean {
    return ['email', 'sms'].includes(this.value);
  }
}
