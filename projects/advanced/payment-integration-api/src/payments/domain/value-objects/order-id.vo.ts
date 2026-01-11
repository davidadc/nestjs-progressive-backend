import { randomUUID } from 'crypto';
import { ValueObject } from '../../../common/domain';
import { InvalidOrderIdException } from '../exceptions/payment.exceptions';

// UUID regex pattern (accepts any valid UUID format)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderIdProps {
  value: string;
}

export class OrderId extends ValueObject<OrderIdProps> {
  private constructor(props: OrderIdProps) {
    super(props);
  }

  public static generate(): OrderId {
    return new OrderId({ value: randomUUID() });
  }

  public static create(id: string): OrderId {
    // Allow any string as order ID (can be external system's ID)
    if (!id || id.trim().length === 0) {
      throw new InvalidOrderIdException(id);
    }
    return new OrderId({ value: id.trim() });
  }

  get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.value;
  }
}
