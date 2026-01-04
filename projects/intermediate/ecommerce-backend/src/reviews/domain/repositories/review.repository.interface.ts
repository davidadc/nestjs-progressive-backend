import { Review } from '../entities/review.entity';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface FindReviewsOptions {
  productId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface IReviewRepository {
  findById(id: string): Promise<Review | null>;
  findByProductId(
    productId: string,
    options?: FindReviewsOptions,
  ): Promise<PaginatedReviews>;
  findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null>;
  getProductRating(productId: string): Promise<ProductRating>;
  save(review: Review): Promise<Review>;
  update(review: Review): Promise<Review>;
  delete(id: string): Promise<void>;
}
