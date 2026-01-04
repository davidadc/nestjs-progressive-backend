export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly priceAtTime: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtTime: number;
  }): OrderItem {
    return new OrderItem(
      props.id,
      props.orderId,
      props.productId,
      props.productName,
      props.quantity,
      props.priceAtTime,
      new Date(),
    );
  }

  getSubtotal(): number {
    return this.priceAtTime * this.quantity;
  }
}
