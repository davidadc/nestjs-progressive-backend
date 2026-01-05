import { Injectable, Inject } from '@nestjs/common';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository.interface';
import {
  type ITaskRepository,
  TASK_REPOSITORY,
} from '../../../tasks/domain/repositories/task.repository.interface';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/repositories/user.repository.interface';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectResponseDto } from '../dto/project-response.dto';
import { ProjectMapper } from '../mappers/project.mapper';
import {
  ProjectNotFoundException,
  ProjectAccessDeniedException,
  NotProjectOwnerException,
  UserAlreadyMemberException,
  UserNotMemberException,
} from '../../domain/exceptions/project.exceptions';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly projectMapper: ProjectMapper,
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.create({
      name: dto.name,
      description: dto.description,
      ownerId: userId,
    });

    return this.projectMapper.toResponseDto(project);
  }

  async findById(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findByIdWithMembers(id);
    if (!project) {
      throw new ProjectNotFoundException(id);
    }

    if (!project.isMember(userId)) {
      throw new ProjectAccessDeniedException();
    }

    const taskCount = await this.taskRepository.countByProjectId(id);
    return this.projectMapper.toResponseDto(project, taskCount);
  }

  async findAllAccessibleByUser(userId: string): Promise<ProjectResponseDto[]> {
    const projects =
      await this.projectRepository.findAllAccessibleByUser(userId);
    return this.projectMapper.toResponseDtoList(projects);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ProjectNotFoundException(id);
    }

    if (!project.isOwner(userId)) {
      throw new NotProjectOwnerException();
    }

    const updatedProject = await this.projectRepository.update(id, {
      name: dto.name,
      description: dto.description,
    });

    return this.projectMapper.toResponseDto(updatedProject);
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ProjectNotFoundException(id);
    }

    if (!project.isOwner(userId)) {
      throw new NotProjectOwnerException();
    }

    await this.projectRepository.delete(id);
  }

  async addMember(
    projectId: string,
    userIdToAdd: string,
    currentUserId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (!project.isOwner(currentUserId)) {
      throw new NotProjectOwnerException();
    }

    const userToAdd = await this.userRepository.findById(userIdToAdd);
    if (!userToAdd) {
      throw new NotFoundException(`User with ID '${userIdToAdd}' not found`);
    }

    if (project.isMember(userIdToAdd)) {
      throw new UserAlreadyMemberException();
    }

    const updatedProject = await this.projectRepository.addMember(
      projectId,
      userIdToAdd,
    );

    return this.projectMapper.toResponseDto(updatedProject);
  }

  async removeMember(
    projectId: string,
    userIdToRemove: string,
    currentUserId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (!project.isOwner(currentUserId)) {
      throw new NotProjectOwnerException();
    }

    if (project.isOwner(userIdToRemove)) {
      throw new ProjectAccessDeniedException('Cannot remove the project owner');
    }

    const isMember = await this.projectRepository.isMember(
      projectId,
      userIdToRemove,
    );
    if (!isMember) {
      throw new UserNotMemberException();
    }

    const updatedProject = await this.projectRepository.removeMember(
      projectId,
      userIdToRemove,
    );

    return this.projectMapper.toResponseDto(updatedProject);
  }
}
