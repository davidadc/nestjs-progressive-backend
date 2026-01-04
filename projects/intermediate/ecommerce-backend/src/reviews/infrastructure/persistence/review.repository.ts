import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IReviewRepository,
  FindReviewsOptions,
  PaginatedReviews,
  ProductRating,
} from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { ReviewOrmEntity } from './review.orm-entity';
import { ReviewPersistenceMapper } from './review.persistence-mapper';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly repository: Repository<ReviewOrmEntity>,
    private readonly mapper: ReviewPersistenceMapper,
  ) {}

  async findById(id: string): Promise<Review | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByProductId(
    productId: string,
    options: FindReviewsOptions,
  ): Promise<PaginatedReviews> {
    const { page = 1, limit = 10 } = options;

    const [entities, total] = await this.repository.findAndCount({
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews: entities.map((e) => this.mapper.toDomain(e)),
      total,
    };
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null> {
    const entity = await this.repository.findOne({
      where: { userId, productId },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async getProductRating(productId: string): Promise<ProductRating> {
    const result = await this.repository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.productId = :productId', { productId })
      .getRawOne<{ average: string | null; count: string }>();

    return {
      average: parseFloat(result?.average ?? '0') || 0,
      count: parseInt(result?.count ?? '0', 10) || 0,
    };
  }

  async save(review: Review): Promise<Review> {
    const entity = this.mapper.toOrm(review);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async update(review: Review): Promise<Review> {
    const entity = this.mapper.toOrm(review);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
