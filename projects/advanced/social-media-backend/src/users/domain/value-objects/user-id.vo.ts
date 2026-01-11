import { ValueObject } from '../../../common/domain/value-object';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private constructor(props: UserIdProps) {
    super(props);
  }

  static create(id: string): UserId {
    if (!id || id.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    return new UserId({ value: id });
  }

  static generate(): UserId {
    const uuid = crypto.randomUUID();
    return new UserId({ value: uuid });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
