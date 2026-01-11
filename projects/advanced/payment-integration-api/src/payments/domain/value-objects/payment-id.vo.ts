import { randomUUID } from 'crypto';
import { ValueObject } from '../../../common/domain';
import { InvalidPaymentIdException } from '../exceptions/payment.exceptions';

// UUID v4 regex pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PaymentIdProps {
  value: string;
}

export class PaymentId extends ValueObject<PaymentIdProps> {
  private constructor(props: PaymentIdProps) {
    super(props);
  }

  public static generate(): PaymentId {
    return new PaymentId({ value: randomUUID() });
  }

  public static create(id: string): PaymentId {
    if (!UUID_REGEX.test(id)) {
      throw new InvalidPaymentIdException(id);
    }
    return new PaymentId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.value;
  }
}
