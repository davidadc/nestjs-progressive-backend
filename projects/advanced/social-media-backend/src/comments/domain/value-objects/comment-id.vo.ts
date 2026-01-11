import { ValueObject } from '../../../common/domain/value-object';

interface CommentIdProps {
  value: string;
}

export class CommentId extends ValueObject<CommentIdProps> {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private constructor(props: CommentIdProps) {
    super(props);
  }

  public static create(id: string): CommentId {
    if (!id || !this.UUID_REGEX.test(id)) {
      throw new Error('Invalid CommentId format');
    }
    return new CommentId({ value: id });
  }

  public static generate(): CommentId {
    const uuid = crypto.randomUUID();
    return new CommentId({ value: uuid });
  }

  get value(): string {
    return this.props.value;
  }
}
