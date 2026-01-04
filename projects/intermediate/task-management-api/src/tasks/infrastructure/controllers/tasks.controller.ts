import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from '../../application/services/tasks.service';
import { CommentsService } from '../../../comments/application/services/comments.service';
import { CreateTaskDto } from '../../application/dto/create-task.dto';
import { UpdateTaskDto } from '../../application/dto/update-task.dto';
import { UpdateTaskStatusDto } from '../../application/dto/update-task-status.dto';
import { FindTasksDto } from '../../application/dto/find-tasks.dto';
import { TaskResponseDto } from '../../application/dto/task-response.dto';
import { CreateCommentDto } from '../../../comments/application/dto/create-comment.dto';
import { CommentResponseDto } from '../../../comments/application/dto/comment-response.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../users/domain/entities/user.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create a new task in a project (Admin, Manager)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(projectId, dto, user);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assignee (use "me" for current user)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title/description' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field (createdAt, dueDate, priority, status)' })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tasks',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: FindTasksDto,
    @CurrentUser() user: User,
  ): Promise<{ items: TaskResponseDto[]; pagination: unknown }> {
    return this.tasksService.findAll(query, user);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the task',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findById(id, user);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task (Admin, Manager, or Assignee)' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, dto, user);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status only (Admin, Manager, or Assignee)' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 200,
    description: 'Task status updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateStatus(id, dto.status, user);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task (Admin, Manager)' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.tasksService.delete(id, user);
  }

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 201,
    description: 'Comment added successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async addComment(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(taskId, dto, user);
  }

  @Get('tasks/:id/comments')
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of comments',
    type: [CommentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getComments(
    @Param('id', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findByTaskId(taskId, user);
  }
}
