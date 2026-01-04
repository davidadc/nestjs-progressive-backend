import { Injectable } from '@nestjs/common';
import { Project } from '../../domain/entities/project.entity';
import { ProjectResponseDto, ProjectMemberDto } from '../dto/project-response.dto';
import { User } from '../../../users/domain/entities/user.entity';

@Injectable()
export class ProjectMapper {
  toResponseDto(project: Project, taskCount?: number): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      owner: project.owner ? this.toMemberDto(project.owner) : undefined,
      members: project.members?.map((m) => this.toMemberDto(m)),
      taskCount,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  toResponseDtoList(projects: Project[]): ProjectResponseDto[] {
    return projects.map((project) => this.toResponseDto(project));
  }

  private toMemberDto(user: User): ProjectMemberDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
