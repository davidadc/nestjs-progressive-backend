import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  type ICommentRepository,
  COMMENT_REPOSITORY,
} from '../../domain/repositories/comment.repository.interface';
import {
  type ITaskRepository,
  TASK_REPOSITORY,
} from '../../../tasks/domain/repositories/task.repository.interface';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY,
} from '../../../projects/domain/repositories/project.repository.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CommentResponseDto } from '../dto/comment-response.dto';
import { CommentMapper } from '../mappers/comment.mapper';
import { TaskNotFoundException } from '../../../tasks/domain/exceptions/task.exceptions';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly commentMapper: CommentMapper,
  ) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    currentUser: User,
  ): Promise<CommentResponseDto> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException(taskId);
    }

    const project = await this.projectRepository.findByIdWithMembers(task.projectId);
    if (!project?.isMember(currentUser.id)) {
      throw new ForbiddenException('You must be a project member to comment on tasks');
    }

    const comment = await this.commentRepository.create({
      taskId,
      userId: currentUser.id,
      content: dto.content,
    });

    const commentWithUser = await this.commentRepository.findById(comment.id);
    return this.commentMapper.toResponseDto(commentWithUser!);
  }

  async findByTaskId(taskId: string, currentUser: User): Promise<CommentResponseDto[]> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException(taskId);
    }

    const project = await this.projectRepository.findByIdWithMembers(task.projectId);
    if (!project?.isMember(currentUser.id)) {
      throw new ForbiddenException('You must be a project member to view comments');
    }

    const comments = await this.commentRepository.findByTaskId(taskId);
    return this.commentMapper.toResponseDtoList(comments);
  }

  async update(
    id: string,
    content: string,
    currentUser: User,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID '${id}' not found`);
    }

    if (!comment.canUserModify(currentUser.id, currentUser.role)) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.commentRepository.update(id, content);
    return this.commentMapper.toResponseDto(updatedComment);
  }

  async delete(id: string, currentUser: User): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID '${id}' not found`);
    }

    if (!comment.canUserDelete(currentUser.id, currentUser.role)) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete(id);
  }
}
