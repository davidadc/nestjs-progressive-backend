import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { NotificationId } from '../value-objects/notification-id.vo';
import { NotificationType } from '../value-objects/notification-type.vo';
import { NotificationCreatedEvent } from '../events/notification-created.event';
import { NotificationReadEvent } from '../events/notification-read.event';
import {
  NotificationTitleTooLongException,
  NotificationMessageTooLongException,
} from '../exceptions/notification.exceptions';

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1000;

export interface CreateNotificationProps {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ReconstitutedNotificationProps {
  id: NotificationId;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export class Notification extends AggregateRoot {
  private _id: NotificationId;
  private _userId: string;
  private _type: NotificationType;
  private _title: string;
  private _message: string;
  private _data: Record<string, unknown>;
  private _read: boolean;
  private _readAt: Date | null;
  private _createdAt: Date;

  private constructor() {
    super();
  }

  /**
   * Factory method to create a new Notification aggregate
   */
  public static create(props: CreateNotificationProps): Notification {
    // Validate title length
    if (props.title.length > MAX_TITLE_LENGTH) {
      throw new NotificationTitleTooLongException(
        props.title.length,
        MAX_TITLE_LENGTH,
      );
    }

    // Validate message length
    if (props.message.length > MAX_MESSAGE_LENGTH) {
      throw new NotificationMessageTooLongException(
        props.message.length,
        MAX_MESSAGE_LENGTH,
      );
    }

    const notification = new Notification();
    notification._id = NotificationId.generate();
    notification._userId = props.userId;
    notification._type = props.type;
    notification._title = props.title;
    notification._message = props.message;
    notification._data = props.data || {};
    notification._read = false;
    notification._readAt = null;
    notification._createdAt = new Date();

    // Raise domain event
    notification.addDomainEvent(
      new NotificationCreatedEvent(
        notification._id.value,
        notification._userId,
        notification._type.value,
        notification._title,
        notification._message,
        notification._data,
      ),
    );

    return notification;
  }

  /**
   * Reconstitute a Notification from persistence
   */
  public static reconstitute(props: ReconstitutedNotificationProps): Notification {
    const notification = new Notification();
    notification._id = props.id;
    notification._userId = props.userId;
    notification._type = props.type;
    notification._title = props.title;
    notification._message = props.message;
    notification._data = props.data;
    notification._read = props.read;
    notification._readAt = props.readAt;
    notification._createdAt = props.createdAt;
    return notification;
  }

  /**
   * Mark this notification as read
   */
  public markAsRead(): void {
    if (this._read) {
      return; // Already read, no-op
    }

    this._read = true;
    this._readAt = new Date();

    // Raise domain event
    this.addDomainEvent(
      new NotificationReadEvent(this._id.value, this._userId, this._readAt),
    );
  }

  /**
   * Check if notification belongs to a specific user
   */
  public belongsTo(userId: string): boolean {
    return this._userId === userId;
  }

  // Getters
  get id(): NotificationId {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get type(): NotificationType {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get data(): Record<string, unknown> {
    return this._data;
  }

  get read(): boolean {
    return this._read;
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
