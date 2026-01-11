import { DomainEvent } from '../../../common/domain/domain-event';

export class CommentUnlikedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'comment.unliked';
  }
}
