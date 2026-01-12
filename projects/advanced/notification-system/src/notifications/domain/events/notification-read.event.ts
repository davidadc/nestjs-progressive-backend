import { DomainEvent } from '../../../common/domain/domain-event';

export class NotificationReadEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly readAt: Date,
  ) {
    super();
  }
}
