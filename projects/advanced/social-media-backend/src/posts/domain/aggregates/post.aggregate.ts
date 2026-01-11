import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { PostId, PostContent } from '../value-objects';
import { PostCreatedEvent } from '../events/post-created.event';
import { PostDeletedEvent } from '../events/post-deleted.event';
import { PostLikedEvent } from '../events/post-liked.event';
import { PostUnlikedEvent } from '../events/post-unliked.event';

export interface CreatePostProps {
  authorId: string;
  content: string;
  images?: string[];
}

export interface ReconstructPostProps {
  id: string;
  authorId: string;
  content: string;
  images?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Post extends AggregateRoot<PostId> {
  private _authorId: string;
  private _content: PostContent;
  private _images: string[];
  private _likesCount: number;
  private _commentsCount: number;
  private _hashtags: string[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: PostId) {
    super(id);
  }

  // Factory method for creating a new post
  public static create(props: CreatePostProps): Post {
    const postId = PostId.generate();
    const content = PostContent.create(props.content);

    const post = new Post(postId);
    post._authorId = props.authorId;
    post._content = content;
    post._images = props.images || [];
    post._likesCount = 0;
    post._commentsCount = 0;
    post._hashtags = content.extractHashtags();
    post._createdAt = new Date();
    post._updatedAt = new Date();

    // Add domain event
    post.addDomainEvent(
      new PostCreatedEvent(postId.value, props.authorId, post._hashtags),
    );

    return post;
  }

  // Factory method for reconstructing from persistence
  public static reconstitute(props: ReconstructPostProps): Post {
    const postId = PostId.create(props.id);
    const content = PostContent.create(props.content);

    const post = new Post(postId);
    post._authorId = props.authorId;
    post._content = content;
    post._images = props.images || [];
    post._likesCount = props.likesCount;
    post._commentsCount = props.commentsCount;
    post._hashtags = content.extractHashtags();
    post._createdAt = props.createdAt;
    post._updatedAt = props.updatedAt;

    return post;
  }

  // Business method: Like the post
  public like(userId: string): void {
    this._likesCount++;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PostLikedEvent(this._id.value, userId, this._authorId),
    );
  }

  // Business method: Unlike the post
  public unlike(userId: string): void {
    if (this._likesCount > 0) {
      this._likesCount--;
      this._updatedAt = new Date();

      this.addDomainEvent(new PostUnlikedEvent(this._id.value, userId));
    }
  }

  // Business method: Add a comment
  public addComment(): void {
    this._commentsCount++;
    this._updatedAt = new Date();
  }

  // Business method: Remove a comment
  public removeComment(): void {
    if (this._commentsCount > 0) {
      this._commentsCount--;
      this._updatedAt = new Date();
    }
  }

  // Business method: Delete the post
  public delete(): void {
    this.addDomainEvent(new PostDeletedEvent(this._id.value, this._authorId));
  }

  // Check if user can delete this post
  public canBeDeletedBy(userId: string): boolean {
    return this._authorId === userId;
  }

  // Getters
  get authorId(): string {
    return this._authorId;
  }

  get content(): string {
    return this._content.value;
  }

  get images(): string[] {
    return [...this._images];
  }

  get likesCount(): number {
    return this._likesCount;
  }

  get commentsCount(): number {
    return this._commentsCount;
  }

  get hashtags(): string[] {
    return [...this._hashtags];
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
      authorId: this._authorId,
      content: this._content.value,
      images: this._images,
      likesCount: this._likesCount,
      commentsCount: this._commentsCount,
      hashtags: this._hashtags,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
