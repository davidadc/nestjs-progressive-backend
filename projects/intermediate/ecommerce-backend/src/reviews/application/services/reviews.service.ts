import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { REVIEW_REPOSITORY } from '../../domain/repositories/review.repository.interface';
import type { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import type { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { CreateReviewDto, UpdateReviewDto } from '../dto/create-review.dto';
import {
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
} from '../dto/review-response.dto';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly reviewMapper: ReviewMapper,
  ) {}

  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviewsResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const { reviews, total } = await this.reviewRepository.findByProductId(
      productId,
      { page, limit },
    );

    const rating = await this.reviewRepository.getProductRating(productId);

    return {
      reviews: reviews.map((review) => this.reviewMapper.toResponseDto(review)),
      rating,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createReview(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingReview = await this.reviewRepository.findByUserAndProduct(
      userId,
      productId,
    );
    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = Review.create({
      id: uuidv4(),
      userId,
      userName: user.name,
      productId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);
    return this.reviewMapper.toResponseDto(savedReview);
  }

  async updateReview(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const existingReview = await this.reviewRepository.findById(reviewId);
    if (!existingReview) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    if (existingReview.userId !== userId) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    const updatedReview = existingReview.update({
      rating: dto.rating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewRepository.update(updatedReview);
    return this.reviewMapper.toResponseDto(savedReview);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const existingReview = await this.reviewRepository.findById(reviewId);
    if (!existingReview) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    if (existingReview.userId !== userId) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    await this.reviewRepository.delete(reviewId);
  }
}
