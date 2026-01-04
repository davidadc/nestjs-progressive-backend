import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProjectsController } from './infrastructure/controllers/projects.controller';
import { ProjectsService } from './application/services/projects.service';
import { ProjectMapper } from './application/mappers/project.mapper';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository.interface';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectMapper,
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
  ],
  exports: [ProjectsService, PROJECT_REPOSITORY],
})
export class ProjectsModule {}
