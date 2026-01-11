import { ValueObject } from '../../../common/domain/value-object';

interface UsernameProps {
  value: string;
}

export class Username extends ValueObject<UsernameProps> {
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 30;

  private constructor(props: UsernameProps) {
    super(props);
  }

  static create(username: string): Username {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    const normalizedUsername = username.toLowerCase().trim();

    if (normalizedUsername.length < this.MIN_LENGTH) {
      throw new Error(`Username must be at least ${this.MIN_LENGTH} characters`);
    }

    if (normalizedUsername.length > this.MAX_LENGTH) {
      throw new Error(`Username must be at most ${this.MAX_LENGTH} characters`);
    }

    if (!this.USERNAME_REGEX.test(normalizedUsername)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    return new Username({ value: normalizedUsername });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
