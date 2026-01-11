import { DomainEvent } from '../../../common/domain/domain-event';

export class CommentDeletedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'comment.deleted';
  }
}
