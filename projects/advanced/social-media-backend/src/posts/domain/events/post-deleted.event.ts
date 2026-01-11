import { DomainEvent } from '../../../common/domain/domain-event';

export class PostDeletedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'post.deleted';
  }
}
