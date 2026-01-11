import { DomainEvent } from '../../../common/domain/domain-event';

export class PostUnlikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'post.unliked';
  }
}
