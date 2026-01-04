import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { CommentsModule } from '../comments/comments.module';
import { TasksController } from './infrastructure/controllers/tasks.controller';
import { TasksService } from './application/services/tasks.service';
import { TaskMapper } from './application/mappers/task.mapper';
import { TaskRepository } from './infrastructure/persistence/task.repository';
import { TASK_REPOSITORY } from './domain/repositories/task.repository.interface';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    CommentsModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskMapper,
    {
      provide: TASK_REPOSITORY,
      useClass: TaskRepository,
    },
  ],
  exports: [TasksService, TASK_REPOSITORY],
})
export class TasksModule {}
