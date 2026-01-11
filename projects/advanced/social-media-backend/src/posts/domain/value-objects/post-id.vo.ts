import { ValueObject } from '../../../common/domain/value-object';

interface PostIdProps {
  value: string;
}

export class PostId extends ValueObject<PostIdProps> {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(props: PostIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(id: string): PostId {
    if (!id || !this.UUID_REGEX.test(id)) {
      throw new Error('Invalid post ID format');
    }
    return new PostId({ value: id });
  }

  public static generate(): PostId {
    const uuid = crypto.randomUUID();
    return new PostId({ value: uuid });
  }

  protected getEqualityComponents(): unknown[] {
    return [this.props.value];
  }
}
