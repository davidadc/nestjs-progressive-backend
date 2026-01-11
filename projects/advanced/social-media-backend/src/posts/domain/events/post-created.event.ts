import { DomainEvent } from '../../../common/domain/domain-event';

export class PostCreatedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly hashtags: string[],
  ) {
    super();
  }

  get eventName(): string {
    return 'post.created';
  }
}
