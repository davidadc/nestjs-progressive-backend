import { CartItem } from './cart-item.entity';

export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: CartItem[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: { id: string; userId: string }): Cart {
    return new Cart(props.id, props.userId, [], new Date(), new Date());
  }

  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  findItem(productId: string): CartItem | undefined {
    return this.items.find((item) => item.productId === productId);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
