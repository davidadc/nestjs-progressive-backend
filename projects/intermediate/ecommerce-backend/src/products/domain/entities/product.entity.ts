import { Category } from './category.entity';

export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly categoryId: string,
    public readonly category: Category | null,
    public readonly images: string[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(props: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    images?: string[];
    isActive?: boolean;
  }): Product {
    return new Product(
      props.id,
      props.name,
      props.description,
      props.price,
      props.stock,
      props.categoryId,
      null,
      props.images ?? [],
      props.isActive ?? true,
      new Date(),
      new Date(),
      null,
    );
  }

  isInStock(): boolean {
    return this.stock > 0 && this.isActive;
  }

  hasEnoughStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  reduceStock(quantity: number): Product {
    if (!this.hasEnoughStock(quantity)) {
      throw new Error('Insufficient stock');
    }
    return new Product(
      this.id,
      this.name,
      this.description,
      this.price,
      this.stock - quantity,
      this.categoryId,
      this.category,
      this.images,
      this.isActive,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }
}
