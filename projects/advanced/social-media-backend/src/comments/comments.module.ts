import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from '../shared/persistence/entities/comment.entity';
import { NotificationEntity } from '../shared/persistence/entities/notification.entity';
import { LikeEntity } from '../shared/persistence/entities/like.entity';
import { CommentsController } from './infrastructure/controllers/comments.controller';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { COMMENT_REPOSITORY } from './domain/repositories/comment.repository.interface';
import { PostsModule } from '../posts/posts.module';

// Command Handlers
import { CreateCommentHandler } from './application/commands/create-comment.handler';
import { DeleteCommentHandler } from './application/commands/delete-comment.handler';
import { LikeCommentHandler } from './application/commands/like-comment.handler';
import { UnlikeCommentHandler } from './application/commands/unlike-comment.handler';

// Query Handlers
import { GetPostCommentsHandler } from './application/queries/get-post-comments.handler';

// Event Handlers
import { CommentCreatedHandler } from './infrastructure/event-handlers/comment-created.handler';

const CommandHandlers = [
  CreateCommentHandler,
  DeleteCommentHandler,
  LikeCommentHandler,
  UnlikeCommentHandler,
];

const QueryHandlers = [GetPostCommentsHandler];

const EventHandlers = [CommentCreatedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([CommentEntity, NotificationEntity, LikeEntity]),
    PostsModule,
  ],
  controllers: [CommentsController],
  providers: [
    {
      provide: COMMENT_REPOSITORY,
      useClass: CommentRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [COMMENT_REPOSITORY],
})
export class CommentsModule {}
