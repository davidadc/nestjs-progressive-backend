import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewOrmEntity } from './infrastructure/persistence/review.orm-entity';
import { ReviewRepository } from './infrastructure/persistence/review.repository';
import { ReviewPersistenceMapper } from './infrastructure/persistence/review.persistence-mapper';
import { ReviewsService } from './application/services/reviews.service';
import { ReviewMapper } from './application/mappers/review.mapper';
import { ReviewsController } from './infrastructure/controllers/reviews.controller';
import { REVIEW_REPOSITORY } from './domain/repositories/review.repository.interface';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewOrmEntity]),
    ProductsModule,
    AuthModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ReviewMapper,
    ReviewPersistenceMapper,
    {
      provide: REVIEW_REPOSITORY,
      useClass: ReviewRepository,
    },
  ],
  exports: [REVIEW_REPOSITORY],
})
export class ReviewsModule {}
