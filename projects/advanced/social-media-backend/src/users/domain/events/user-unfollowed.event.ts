import { DomainEvent } from '../../../common/domain/domain-event';

export class UserUnfollowedEvent extends DomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'user.unfollowed';
  }
}
