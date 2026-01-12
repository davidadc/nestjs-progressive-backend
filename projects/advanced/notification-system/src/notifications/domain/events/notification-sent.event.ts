import { DomainEvent } from '../../../common/domain/domain-event';

export class NotificationSentEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channel: string,
    public readonly success: boolean,
    public readonly error?: string,
  ) {
    super();
  }
}
