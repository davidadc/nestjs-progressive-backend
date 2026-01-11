import { DomainEvent } from '../../../common/domain/domain-event';

export class CommentCreatedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
    public readonly userId: string,
    public readonly postAuthorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'comment.created';
  }
}
