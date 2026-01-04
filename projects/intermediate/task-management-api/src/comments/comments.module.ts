import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { CommentsService } from './application/services/comments.service';
import { CommentMapper } from './application/mappers/comment.mapper';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { COMMENT_REPOSITORY } from './domain/repositories/comment.repository.interface';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ProjectsModule),
  ],
  providers: [
    CommentsService,
    CommentMapper,
    {
      provide: COMMENT_REPOSITORY,
      useClass: CommentRepository,
    },
  ],
  exports: [CommentsService, COMMENT_REPOSITORY],
})
export class CommentsModule {}
