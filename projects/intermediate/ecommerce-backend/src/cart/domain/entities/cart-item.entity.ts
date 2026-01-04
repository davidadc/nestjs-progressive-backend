export class CartItem {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly price: number,
    public readonly quantity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    cartId: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }): CartItem {
    return new CartItem(
      props.id,
      props.cartId,
      props.productId,
      props.productName,
      props.price,
      props.quantity,
      new Date(),
      new Date(),
    );
  }

  getSubtotal(): number {
    return this.price * this.quantity;
  }

  updateQuantity(quantity: number): CartItem {
    return new CartItem(
      this.id,
      this.cartId,
      this.productId,
      this.productName,
      this.price,
      quantity,
      this.createdAt,
      new Date(),
    );
  }
}
