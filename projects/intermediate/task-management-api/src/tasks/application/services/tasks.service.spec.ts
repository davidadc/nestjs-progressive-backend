import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksService } from './tasks.service';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository.interface';
import { PROJECT_REPOSITORY } from '../../../projects/domain/repositories/project.repository.interface';
import { COMMENT_REPOSITORY } from '../../../comments/domain/repositories/comment.repository.interface';
import { TaskMapper } from '../mappers/task.mapper';
import { Task } from '../../domain/entities/task.entity';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import { TaskPriority } from '../../domain/enums/task-priority.enum';
import { Project } from '../../../projects/domain/entities/project.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import {
  TaskNotFoundException,
  TaskAccessDeniedException,
  TaskModificationDeniedException,
} from '../../domain/exceptions/task.exceptions';
import {
  ProjectNotFoundException,
  ProjectAccessDeniedException,
} from '../../../projects/domain/exceptions/project.exceptions';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskRepository: any;
  let mockProjectRepository: any;
  let mockCommentRepository: any;
  let mockTaskMapper: any;
  let mockEventEmitter: any;

  const mockUser = new User({
    id: 'user-id',
    email: 'user@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.MANAGER,
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
    assignedToId: 'user-id',
    createdById: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockTaskRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    };

    mockProjectRepository = {
      findByIdWithMembers: jest.fn(),
    };

    mockCommentRepository = {
      countByTaskId: jest.fn(),
    };

    mockTaskMapper = {
      toResponseDto: jest.fn().mockImplementation((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
      })),
      toResponseDtoList: jest.fn().mockImplementation((tasks) =>
        tasks.map((t: Task) => ({
          id: t.id,
          title: t.title,
          status: t.status,
        })),
      ),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: COMMENT_REPOSITORY, useValue: mockCommentRepository },
        { provide: TaskMapper, useValue: mockTaskMapper },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Task',
      description: 'A new task',
      priority: TaskPriority.HIGH,
    };

    it('should create a task successfully', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.create.mockResolvedValue(mockTask);
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);

      const result = await service.create('project-id', createDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.created',
        expect.anything(),
      );
    });

    it('should throw ProjectNotFoundException if project not found', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUser),
      ).rejects.toThrow(ProjectNotFoundException);
    });

    it('should throw ProjectAccessDeniedException if user is not a member', async () => {
      const projectWithoutUser = new Project({
        ...mockProject,
        members: [],
        ownerId: 'other-user',
      });
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(
        projectWithoutUser,
      );

      await expect(
        service.create('project-id', createDto, mockUser),
      ).rejects.toThrow(ProjectAccessDeniedException);
    });

    it('should throw TaskModificationDeniedException if user cannot manage tasks', async () => {
      const regularUser = new User({ ...mockUser, role: UserRole.USER });
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);

      await expect(
        service.create('project-id', createDto, regularUser),
      ).rejects.toThrow(TaskModificationDeniedException);
    });
  });

  describe('findById', () => {
    it('should return a task with comment count', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockCommentRepository.countByTaskId.mockResolvedValue(5);

      const result = await service.findById('task-id', mockUser);

      expect(result).toBeDefined();
      expect(mockCommentRepository.countByTaskId).toHaveBeenCalledWith(
        'task-id',
      );
    });

    it('should throw TaskNotFoundException if task not found', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(service.findById('non-existent', mockUser)).rejects.toThrow(
        TaskNotFoundException,
      );
    });

    it('should throw TaskAccessDeniedException if user not in project', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);
      const projectWithoutUser = new Project({
        ...mockProject,
        members: [],
        ownerId: 'other-user',
      });
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(
        projectWithoutUser,
      );

      await expect(service.findById('task-id', mockUser)).rejects.toThrow(
        TaskAccessDeniedException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Task',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update a task successfully', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.update.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      const result = await service.update('task-id', updateDto, mockUser);

      expect(result).toBeDefined();
      expect(mockTaskRepository.update).toHaveBeenCalled();
    });

    it('should emit status changed event when status changes', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.update.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      await service.update('task-id', { status: TaskStatus.DONE }, mockUser);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.status.changed',
        expect.anything(),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status and emit event', async () => {
      mockTaskRepository.findByIdWithRelations.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.updateStatus.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus(
        'task-id',
        TaskStatus.IN_PROGRESS,
        mockUser,
      );

      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.status.changed',
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('should delete a task if user can manage tasks', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.delete.mockResolvedValue(undefined);

      await service.delete('task-id', mockUser);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith('task-id');
    });

    it('should throw TaskModificationDeniedException if user cannot manage tasks', async () => {
      const regularUser = new User({ ...mockUser, role: UserRole.USER });
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);

      await expect(service.delete('task-id', regularUser)).rejects.toThrow(
        TaskModificationDeniedException,
      );
    });
  });
});
