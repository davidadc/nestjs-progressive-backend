import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PostEntity } from '../shared/persistence/entities/post.entity';
import { FollowEntity } from '../shared/persistence/entities/follow.entity';
import { FeedController } from './infrastructure/controllers/feed.controller';
import { FeedRepository } from './infrastructure/persistence/feed.repository';
import { FEED_REPOSITORY } from './domain/repositories/feed.repository.interface';
import { FeedCacheService } from './application/services/feed-cache.service';
import { PostsModule } from '../posts/posts.module';

// Query Handlers
import { GetPersonalizedFeedHandler } from './application/queries/get-personalized-feed.handler';
import { GetTrendingFeedHandler } from './application/queries/get-trending-feed.handler';

const QueryHandlers = [GetPersonalizedFeedHandler, GetTrendingFeedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PostEntity, FollowEntity]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        }),
      }),
      inject: [ConfigService],
    }),
    PostsModule,
  ],
  controllers: [FeedController],
  providers: [
    {
      provide: FEED_REPOSITORY,
      useClass: FeedRepository,
    },
    FeedCacheService,
    ...QueryHandlers,
  ],
  exports: [FEED_REPOSITORY],
})
export class FeedModule {}
