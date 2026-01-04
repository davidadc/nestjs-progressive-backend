import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface FindProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
}

export interface IProductRepository {
  findAll(options: FindProductsOptions): Promise<PaginatedProducts>;
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  softDelete(id: string): Promise<void>;
  updateStock(id: string, quantity: number): Promise<void>;
}
