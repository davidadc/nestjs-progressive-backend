import { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export class CreateNotificationCommand {
  constructor(
    public readonly userId: string,
    public readonly type: NotificationTypeValue,
    public readonly title: string,
    public readonly message: string,
    public readonly data?: Record<string, unknown>,
  ) {}
}
