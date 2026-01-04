import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewMapper } from '../mappers/review.mapper';
import { REVIEW_REPOSITORY } from '../../domain/repositories/review.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import { USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { Product } from '../../../products/domain/entities/product.entity';
import { User } from '../../../auth/domain/entities/user.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: Record<string, jest.Mock>;
  let productRepository: Record<string, jest.Mock>;
  let userRepository: Record<string, jest.Mock>;
  let reviewMapper: { toResponseDto: jest.Mock };

  const mockProduct = new Product(
    'prod-id',
    'Laptop',
    'A great laptop',
    999.99,
    10,
    'cat-id',
    undefined,
    [],
    true,
    new Date(),
    new Date(),
    undefined,
  );

  const mockUser = new User(
    'user-id',
    'test@example.com',
    'hashed-password',
    'Test User',
    'customer',
    [],
    new Date(),
    new Date(),
  );

  const mockReview = new Review(
    'review-id',
    'user-id',
    'Test User',
    'prod-id',
    5,
    'Great product!',
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    reviewRepository = {
      findById: jest.fn(),
      findByProductId: jest.fn(),
      findByUserAndProduct: jest.fn(),
      getProductRating: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    productRepository = {
      findById: jest.fn(),
    };

    userRepository = {
      findById: jest.fn(),
    };

    reviewMapper = {
      toResponseDto: jest.fn().mockImplementation((review: Review) => ({
        id: review.id,
        userId: review.userId,
        userName: review.userName,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepository },
        { provide: PRODUCT_REPOSITORY, useValue: productRepository },
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: ReviewMapper, useValue: reviewMapper },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductReviews', () => {
    it('should return paginated reviews for a product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      reviewRepository.findByProductId.mockResolvedValue({
        reviews: [mockReview],
        total: 1,
      });
      reviewRepository.getProductRating.mockResolvedValue({
        average: 5,
        count: 1,
      });

      const result = await service.getProductReviews('prod-id', 1, 10);

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(reviewRepository.findByProductId).toHaveBeenCalledWith('prod-id', {
        page: 1,
        limit: 10,
      });
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('pages', 1);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.getProductReviews('non-existent', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use default pagination values', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      reviewRepository.findByProductId.mockResolvedValue({
        reviews: [],
        total: 0,
      });
      reviewRepository.getProductRating.mockResolvedValue({
        average: 0,
        count: 0,
      });

      await service.getProductReviews('prod-id');

      expect(reviewRepository.findByProductId).toHaveBeenCalledWith('prod-id', {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('createReview', () => {
    const createDto = {
      rating: 5,
      comment: 'Excellent product!',
    };

    it('should create a review successfully', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      userRepository.findById.mockResolvedValue(mockUser);
      reviewRepository.findByUserAndProduct.mockResolvedValue(null);
      reviewRepository.save.mockResolvedValue(mockReview);

      const result = await service.createReview(
        'user-id',
        'prod-id',
        createDto,
      );

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(reviewRepository.findByUserAndProduct).toHaveBeenCalledWith(
        'user-id',
        'prod-id',
      );
      expect(reviewRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.createReview('user-id', 'non-existent', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.createReview('non-existent', 'prod-id', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already reviewed product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      userRepository.findById.mockResolvedValue(mockUser);
      reviewRepository.findByUserAndProduct.mockResolvedValue(mockReview);

      await expect(
        service.createReview('user-id', 'prod-id', createDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateReview', () => {
    const updateDto = {
      rating: 4,
      comment: 'Updated review',
    };

    it('should update a review successfully', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview);
      reviewRepository.update.mockResolvedValue({
        ...mockReview,
        rating: 4,
        comment: 'Updated review',
      });

      const result = await service.updateReview(
        'user-id',
        'review-id',
        updateDto,
      );

      expect(reviewRepository.findById).toHaveBeenCalledWith('review-id');
      expect(reviewRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if review not found', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateReview('user-id', 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if review belongs to different user', async () => {
      const otherUserReview = new Review(
        'review-id',
        'other-user-id',
        'Other User',
        'prod-id',
        5,
        'Great!',
        new Date(),
        new Date(),
      );
      reviewRepository.findById.mockResolvedValue(otherUserReview);

      await expect(
        service.updateReview('user-id', 'review-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview);
      reviewRepository.delete.mockResolvedValue(undefined);

      await service.deleteReview('user-id', 'review-id');

      expect(reviewRepository.findById).toHaveBeenCalledWith('review-id');
      expect(reviewRepository.delete).toHaveBeenCalledWith('review-id');
    });

    it('should throw NotFoundException if review not found', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteReview('user-id', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if review belongs to different user', async () => {
      const otherUserReview = new Review(
        'review-id',
        'other-user-id',
        'Other User',
        'prod-id',
        5,
        'Great!',
        new Date(),
        new Date(),
      );
      reviewRepository.findById.mockResolvedValue(otherUserReview);

      await expect(
        service.deleteReview('user-id', 'review-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
