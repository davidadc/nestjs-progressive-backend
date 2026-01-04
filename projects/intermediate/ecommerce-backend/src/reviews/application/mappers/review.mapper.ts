import { Injectable } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { ReviewOrmEntity } from '../../infrastructure/persistence/review.orm-entity';
import { ReviewResponseDto } from '../dto/review-response.dto';

@Injectable()
export class ReviewMapper {
  toDomain(ormEntity: ReviewOrmEntity): Review {
    return new Review(
      ormEntity.id,
      ormEntity.userId,
      ormEntity.user?.name || '',
      ormEntity.productId,
      ormEntity.rating,
      ormEntity.comment,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  toOrmEntity(domain: Review): Partial<ReviewOrmEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      productId: domain.productId,
      rating: domain.rating,
      comment: domain.comment ?? undefined,
    };
  }

  toResponseDto(domain: Review): ReviewResponseDto {
    return {
      id: domain.id,
      userId: domain.userId,
      userName: domain.userName,
      productId: domain.productId,
      rating: domain.rating,
      comment: domain.comment,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
