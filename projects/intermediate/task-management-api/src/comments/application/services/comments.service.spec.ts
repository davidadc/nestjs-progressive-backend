import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import { TASK_REPOSITORY } from '../../../tasks/domain/repositories/task.repository.interface';
import { PROJECT_REPOSITORY } from '../../../projects/domain/repositories/project.repository.interface';
import { CommentMapper } from '../mappers/comment.mapper';
import { TaskComment } from '../../domain/entities/comment.entity';
import { Task } from '../../../tasks/domain/entities/task.entity';
import { TaskStatus } from '../../../tasks/domain/enums/task-status.enum';
import { TaskPriority } from '../../../tasks/domain/enums/task-priority.enum';
import { Project } from '../../../projects/domain/entities/project.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import { TaskNotFoundException } from '../../../tasks/domain/exceptions/task.exceptions';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockCommentRepository: any;
  let mockTaskRepository: any;
  let mockProjectRepository: any;
  let mockCommentMapper: any;

  const mockUser = new User({
    id: 'user-id',
    email: 'user@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockProject = new Project({
    id: 'project-id',
    name: 'Test Project',
    description: 'A test project',
    ownerId: 'user-id',
    members: [mockUser],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockTask = new Task({
    id: 'task-id',
    projectId: 'project-id',
    title: 'Test Task',
    description: 'A test task',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdById: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockComment = new TaskComment({
    id: 'comment-id',
    taskId: 'task-id',
    userId: 'user-id',
    user: mockUser,
    content: 'Test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockCommentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTaskId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockTaskRepository = {
      findById: jest.fn(),
    };

    mockProjectRepository = {
      findByIdWithMembers: jest.fn(),
    };

    mockCommentMapper = {
      toResponseDto: jest.fn().mockImplementation((comment) => ({
        id: comment.id,
        content: comment.content,
        taskId: comment.taskId,
      })),
      toResponseDtoList: jest.fn().mockImplementation((comments) =>
        comments.map((c: TaskComment) => ({
          id: c.id,
          content: c.content,
          taskId: c.taskId,
        })),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: COMMENT_REPOSITORY, useValue: mockCommentRepository },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: CommentMapper, useValue: mockCommentMapper },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      content: 'New comment',
    };

    it('should create a comment successfully', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockCommentRepository.create.mockResolvedValue(mockComment);
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      const result = await service.create('task-id', createDto, mockUser);

      expect(result).toBeDefined();
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        taskId: 'task-id',
        userId: mockUser.id,
        content: createDto.content,
      });
    });

    it('should throw TaskNotFoundException if task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUser),
      ).rejects.toThrow(TaskNotFoundException);
    });

    it('should throw ForbiddenException if user not in project', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      const projectWithoutUser = new Project({
        ...mockProject,
        members: [],
        ownerId: 'other-user',
      });
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(
        projectWithoutUser,
      );

      await expect(
        service.create('task-id', createDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByTaskId', () => {
    it('should return comments for a task', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockCommentRepository.findByTaskId.mockResolvedValue([mockComment]);

      const result = await service.findByTaskId('task-id', mockUser);

      expect(result).toHaveLength(1);
      expect(mockCommentRepository.findByTaskId).toHaveBeenCalledWith(
        'task-id',
      );
    });

    it('should throw TaskNotFoundException if task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(
        service.findByTaskId('non-existent', mockUser),
      ).rejects.toThrow(TaskNotFoundException);
    });
  });

  describe('update', () => {
    it('should update a comment if user is author', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockCommentRepository.update.mockResolvedValue({
        ...mockComment,
        content: 'Updated content',
      });

      const result = await service.update(
        'comment-id',
        'Updated content',
        mockUser,
      );

      expect(result).toBeDefined();
      expect(mockCommentRepository.update).toHaveBeenCalledWith(
        'comment-id',
        'Updated content',
      );
    });
  });

  describe('delete', () => {
    it('should delete a comment if user is author', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockCommentRepository.delete.mockResolvedValue(undefined);

      await service.delete('comment-id', mockUser);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith('comment-id');
    });
  });
});
