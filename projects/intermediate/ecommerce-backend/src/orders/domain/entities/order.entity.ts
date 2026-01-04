import { OrderItem } from './order-item.entity';
import type { Address } from '../../../auth/domain/entities/user.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly status: OrderStatus,
    public readonly shippingAddress: Address,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    userId: string;
    items: OrderItem[];
    shippingAddress: Address;
  }): Order {
    const total = props.items.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    return new Order(
      props.id,
      props.userId,
      props.items,
      total,
      OrderStatus.PENDING,
      props.shippingAddress,
      new Date(),
      new Date(),
    );
  }

  canBeCancelled(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.PROCESSING
    );
  }

  updateStatus(status: OrderStatus): Order {
    return new Order(
      this.id,
      this.userId,
      this.items,
      this.total,
      status,
      this.shippingAddress,
      this.createdAt,
      new Date(),
    );
  }
}
