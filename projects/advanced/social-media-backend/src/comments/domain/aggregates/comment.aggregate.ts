import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentDeletedEvent } from '../events/comment-deleted.event';
import { CommentLikedEvent } from '../events/comment-liked.event';
import { CommentUnlikedEvent } from '../events/comment-unliked.event';

export interface CreateCommentProps {
  postId: string;
  userId: string;
  content: string;
  postAuthorId: string;
}

export interface ReconstructCommentProps {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Comment extends AggregateRoot<CommentId> {
  private _postId: string;
  private _userId: string;
  private _content: string;
  private _likesCount: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: CommentId) {
    super(id);
  }

  // Factory method for creating a new comment
  public static create(props: CreateCommentProps): Comment {
    const commentId = CommentId.generate();

    if (!props.content || props.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (props.content.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
    }

    const comment = new Comment(commentId);
    comment._postId = props.postId;
    comment._userId = props.userId;
    comment._content = props.content.trim();
    comment._likesCount = 0;
    comment._createdAt = new Date();
    comment._updatedAt = new Date();

    // Add domain event
    comment.addDomainEvent(
      new CommentCreatedEvent(
        commentId.value,
        props.postId,
        props.userId,
        props.postAuthorId,
      ),
    );

    return comment;
  }

  // Factory method for reconstructing from persistence
  public static reconstitute(props: ReconstructCommentProps): Comment {
    const commentId = CommentId.create(props.id);

    const comment = new Comment(commentId);
    comment._postId = props.postId;
    comment._userId = props.userId;
    comment._content = props.content;
    comment._likesCount = props.likesCount;
    comment._createdAt = props.createdAt;
    comment._updatedAt = props.updatedAt;

    return comment;
  }

  // Business method: Like the comment
  public like(userId: string): void {
    this._likesCount++;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommentLikedEvent(this._id.value, userId, this._userId),
    );
  }

  // Business method: Unlike the comment
  public unlike(userId: string): void {
    if (this._likesCount > 0) {
      this._likesCount--;
      this._updatedAt = new Date();

      this.addDomainEvent(new CommentUnlikedEvent(this._id.value, userId));
    }
  }

  // Business method: Delete the comment
  public delete(): void {
    this.addDomainEvent(new CommentDeletedEvent(this._id.value, this._postId));
  }

  // Check if user can delete this comment
  public canBeDeletedBy(userId: string): boolean {
    return this._userId === userId;
  }

  // Getters
  get postId(): string {
    return this._postId;
  }

  get userId(): string {
    return this._userId;
  }

  get content(): string {
    return this._content;
  }

  get likesCount(): number {
    return this._likesCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Required by AggregateRoot
  toPrimitives(): Record<string, unknown> {
    return {
      id: this._id.value,
      postId: this._postId,
      userId: this._userId,
      content: this._content,
      likesCount: this._likesCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
