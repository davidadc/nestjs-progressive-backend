import { ValueObject } from '../../../common/domain/value-object';

interface PostContentProps {
  value: string;
}

export class PostContent extends ValueObject<PostContentProps> {
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 2000;

  private constructor(props: PostContentProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(content: string): PostContent {
    const trimmed = content?.trim();

    if (!trimmed || trimmed.length < this.MIN_LENGTH) {
      throw new Error('Post content cannot be empty');
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(
        `Post content cannot exceed ${this.MAX_LENGTH} characters`,
      );
    }

    return new PostContent({ value: trimmed });
  }

  public extractHashtags(): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.props.value.match(hashtagRegex);
    if (!matches) return [];

    return matches
      .map((tag) => tag.slice(1).toLowerCase())
      .filter((tag, index, self) => self.indexOf(tag) === index);
  }

  protected getEqualityComponents(): unknown[] {
    return [this.props.value];
  }
}
