import { ValueObject } from '../../../common/domain/value-object';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  static create(id: string): UserId {
    if (!id || id.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    return new UserId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
