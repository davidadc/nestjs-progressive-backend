import { DomainEvent } from '../../../common/domain/domain-event';

export class UserFollowedEvent extends DomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'user.followed';
  }
}
