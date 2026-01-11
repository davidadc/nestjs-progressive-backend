import { DomainEvent } from '../../../common/domain/domain-event';

export class PostLikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly postAuthorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'post.liked';
  }
}
