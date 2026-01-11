import { DomainEvent } from '../../../common/domain/domain-event';

export class CommentLikedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly commentAuthorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'comment.liked';
  }
}
