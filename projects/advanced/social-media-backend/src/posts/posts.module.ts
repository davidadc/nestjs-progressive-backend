import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../shared/persistence/entities/post.entity';
import { LikeEntity } from '../shared/persistence/entities/like.entity';
import { HashtagEntity } from '../shared/persistence/entities/hashtag.entity';
import { NotificationEntity } from '../shared/persistence/entities/notification.entity';
import { UserEntity } from '../shared/persistence/entities/user.entity';
import { CommentEntity } from '../shared/persistence/entities/comment.entity';
import { PostsController } from './infrastructure/controllers/posts.controller';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { POST_REPOSITORY } from './domain/repositories/post.repository.interface';
import { HashtagExtractorService } from './application/services/hashtag-extractor.service';

// Command Handlers
import { CreatePostHandler } from './application/commands/create-post.handler';
import { DeletePostHandler } from './application/commands/delete-post.handler';
import { LikePostHandler } from './application/commands/like-post.handler';
import { UnlikePostHandler } from './application/commands/unlike-post.handler';

// Query Handlers
import { GetPostHandler } from './application/queries/get-post.handler';
import { GetUserPostsHandler } from './application/queries/get-user-posts.handler';
import { GetPostLikesHandler } from './application/queries/get-post-likes.handler';

// Event Handlers
import { PostLikedHandler } from './infrastructure/event-handlers/post-liked.handler';

const CommandHandlers = [
  CreatePostHandler,
  DeletePostHandler,
  LikePostHandler,
  UnlikePostHandler,
];

const QueryHandlers = [GetPostHandler, GetUserPostsHandler, GetPostLikesHandler];

const EventHandlers = [PostLikedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      PostEntity,
      LikeEntity,
      HashtagEntity,
      NotificationEntity,
      UserEntity,
      CommentEntity,
    ]),
  ],
  controllers: [PostsController],
  providers: [
    {
      provide: POST_REPOSITORY,
      useClass: PostRepository,
    },
    HashtagExtractorService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [POST_REPOSITORY],
})
export class PostsModule {}
