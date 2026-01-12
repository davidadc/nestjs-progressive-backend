/**
 * Base exception for notification domain errors
 */
export abstract class NotificationDomainException extends Error {
  public readonly code: string;

  protected constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/**
 * Thrown when notification ID format is invalid
 */
export class InvalidNotificationIdException extends NotificationDomainException {
  constructor(id: string) {
    super(
      `Invalid notification ID format: '${id}'. Expected a valid UUID.`,
      'INVALID_NOTIFICATION_ID',
    );
  }
}

/**
 * Thrown when notification type is not supported
 */
export class InvalidNotificationTypeException extends NotificationDomainException {
  constructor(type: string) {
    super(
      `Invalid notification type: '${type}'. Allowed types: order_completed, new_comment, new_follower, liked_post, mention.`,
      'INVALID_NOTIFICATION_TYPE',
    );
  }
}

/**
 * Thrown when notification channel is not supported
 */
export class InvalidNotificationChannelException extends NotificationDomainException {
  constructor(channel: string) {
    super(
      `Invalid notification channel: '${channel}'. Allowed channels: email, push, sms, websocket.`,
      'INVALID_NOTIFICATION_CHANNEL',
    );
  }
}

/**
 * Thrown when a notification is not found
 */
export class NotificationNotFoundException extends NotificationDomainException {
  constructor(id: string) {
    super(`Notification with ID '${id}' not found.`, 'NOTIFICATION_NOT_FOUND');
  }
}

/**
 * Thrown when user tries to access another user's notification
 */
export class NotificationAccessDeniedException extends NotificationDomainException {
  constructor(notificationId: string, userId: string) {
    super(
      `User '${userId}' does not have access to notification '${notificationId}'.`,
      'NOTIFICATION_ACCESS_DENIED',
    );
  }
}

/**
 * Thrown when notification title exceeds max length
 */
export class NotificationTitleTooLongException extends NotificationDomainException {
  constructor(length: number, maxLength: number) {
    super(
      `Notification title is too long (${length} characters). Maximum allowed: ${maxLength}.`,
      'NOTIFICATION_TITLE_TOO_LONG',
    );
  }
}

/**
 * Thrown when notification message exceeds max length
 */
export class NotificationMessageTooLongException extends NotificationDomainException {
  constructor(length: number, maxLength: number) {
    super(
      `Notification message is too long (${length} characters). Maximum allowed: ${maxLength}.`,
      'NOTIFICATION_MESSAGE_TOO_LONG',
    );
  }
}
