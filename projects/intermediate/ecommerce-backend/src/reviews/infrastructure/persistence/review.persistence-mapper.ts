import { Injectable } from '@nestjs/common';
import { Review } from '../../domain/entities/review.entity';
import { ReviewOrmEntity } from './review.orm-entity';

@Injectable()
export class ReviewPersistenceMapper {
  toDomain(entity: ReviewOrmEntity): Review {
    return new Review(
      entity.id,
      entity.userId,
      entity.userName,
      entity.productId,
      entity.rating,
      entity.comment,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toOrm(domain: Review): ReviewOrmEntity {
    const entity = new ReviewOrmEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.userName = domain.userName;
    entity.productId = domain.productId;
    entity.rating = domain.rating;
    entity.comment = domain.comment ?? '';
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
