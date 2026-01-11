import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashtagEntity } from '../shared/persistence/entities/hashtag.entity';
import { PostEntity } from '../shared/persistence/entities/post.entity';
import { HashtagsController } from './infrastructure/controllers/hashtags.controller';
import { HashtagRepository } from './infrastructure/persistence/hashtag.repository';
import { HASHTAG_REPOSITORY } from './domain/repositories/hashtag.repository.interface';
import { PostsModule } from '../posts/posts.module';

// Query Handlers
import { GetTrendingHashtagsHandler } from './application/queries/get-trending-hashtags.handler';
import { GetPostsByHashtagHandler } from './application/queries/get-posts-by-hashtag.handler';

const QueryHandlers = [GetTrendingHashtagsHandler, GetPostsByHashtagHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([HashtagEntity, PostEntity]),
    PostsModule,
  ],
  controllers: [HashtagsController],
  providers: [
    {
      provide: HASHTAG_REPOSITORY,
      useClass: HashtagRepository,
    },
    ...QueryHandlers,
  ],
  exports: [HASHTAG_REPOSITORY],
})
export class HashtagsModule {}
