import { ValueObject } from '../../../common/domain/value-object';
import { InvalidNotificationTypeException } from '../exceptions/notification.exceptions';

export const NOTIFICATION_TYPES = [
  'order_completed',
  'new_comment',
  'new_follower',
  'liked_post',
  'mention',
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

interface NotificationTypeProps {
  value: NotificationTypeValue;
}

export class NotificationType extends ValueObject<NotificationTypeProps> {
  private constructor(props: NotificationTypeProps) {
    super(props);
  }

  public static create(type: string): NotificationType {
    if (!NOTIFICATION_TYPES.includes(type as NotificationTypeValue)) {
      throw new InvalidNotificationTypeException(type);
    }
    return new NotificationType({ value: type as NotificationTypeValue });
  }

  get value(): NotificationTypeValue {
    return this.props.value;
  }

  /**
   * High priority notifications require immediate delivery via all enabled channels
   */
  public isHighPriority(): boolean {
    return ['order_completed', 'mention'].includes(this.value);
  }

  /**
   * Get default channels for this notification type
   */
  public getDefaultChannels(): string[] {
    const channelMap: Record<NotificationTypeValue, string[]> = {
      order_completed: ['email', 'push'],
      new_comment: ['push', 'websocket'],
      new_follower: ['push', 'websocket'],
      liked_post: ['websocket'],
      mention: ['email', 'push', 'websocket'],
    };
    return channelMap[this.value];
  }
}
