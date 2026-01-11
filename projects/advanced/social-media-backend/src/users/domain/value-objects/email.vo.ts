import { ValueObject } from '../../../common/domain/value-object';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    return new Email({ value: normalizedEmail });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
