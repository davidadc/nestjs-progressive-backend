import { DomainEvent } from '../../../common/domain/domain-event';

export class NotificationCreatedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly data?: Record<string, unknown>,
  ) {
    super();
  }
}
