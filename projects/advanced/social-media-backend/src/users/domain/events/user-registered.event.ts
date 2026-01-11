import { DomainEvent } from '../../../common/domain/domain-event';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'user.registered';
  }
}
