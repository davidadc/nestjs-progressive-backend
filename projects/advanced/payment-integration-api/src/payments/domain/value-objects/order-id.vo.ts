import { randomUUID } from 'crypto';
import { ValueObject } from '../../../common/domain';
import { InvalidOrderIdException } from '../exceptions/payment.exceptions';

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
