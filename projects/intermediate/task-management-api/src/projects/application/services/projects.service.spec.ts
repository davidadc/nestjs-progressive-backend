import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import { TASK_REPOSITORY } from '../../../tasks/domain/repositories/task.repository.interface';
import { USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { ProjectMapper } from '../mappers/project.mapper';
import { Project } from '../../domain/entities/project.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import {
  ProjectNotFoundException,
  ProjectAccessDeniedException,
  NotProjectOwnerException,
  UserAlreadyMemberException,
} from '../../domain/exceptions/project.exceptions';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockProjectRepository: any;
  let mockTaskRepository: any;
  let mockUserRepository: any;
  let mockProjectMapper: any;

  const mockOwner = new User({
    id: 'owner-id',
    email: 'owner@example.com',
    name: 'Owner User',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockMember = new User({
    id: 'member-id',
    email: 'member@example.com',
    name: 'Member User',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockProject = new Project({
    id: 'project-id-1',
    name: 'Test Project',
    description: 'A test project',
    ownerId: 'owner-id',
    owner: mockOwner,
    members: [mockOwner],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockProjectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithMembers: jest.fn(),
      findAllAccessibleByUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      isMember: jest.fn(),
    };

    mockTaskRepository = {
      countByProjectId: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn(),
    };

    mockProjectMapper = {
      toResponseDto: jest.fn().mockImplementation((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
      })),
      toResponseDtoList: jest.fn().mockImplementation((projects) =>
        projects.map((p: Project) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: ProjectMapper, useValue: mockProjectMapper },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'New Project',
      description: 'A new project',
    };

    it('should create a project successfully', async () => {
      mockProjectRepository.create.mockResolvedValue(mockProject);

      const result = await service.create(createDto, 'owner-id');

      expect(result).toBeDefined();
      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        description: createDto.description,
        ownerId: 'owner-id',
      });
    });
  });

  describe('findById', () => {
    it('should return a project if user is a member', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockTaskRepository.countByProjectId.mockResolvedValue(5);

      const result = await service.findById('project-id-1', 'owner-id');

      expect(result).toBeDefined();
      expect(mockTaskRepository.countByProjectId).toHaveBeenCalledWith(
        'project-id-1',
      );
    });

    it('should throw ProjectNotFoundException if project not found', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(null);

      await expect(
        service.findById('non-existent', 'owner-id'),
      ).rejects.toThrow(ProjectNotFoundException);
    });

    it('should throw ProjectAccessDeniedException if user is not a member', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);

      await expect(
        service.findById('project-id-1', 'non-member-id'),
      ).rejects.toThrow(ProjectAccessDeniedException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Project',
    };

    it('should update a project if user is owner', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Project',
      });

      const result = await service.update(
        'project-id-1',
        updateDto,
        'owner-id',
      );

      expect(result).toBeDefined();
      expect(mockProjectRepository.update).toHaveBeenCalled();
    });

    it('should throw NotProjectOwnerException if user is not owner', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        service.update('project-id-1', updateDto, 'non-owner-id'),
      ).rejects.toThrow(NotProjectOwnerException);
    });
  });

  describe('delete', () => {
    it('should delete a project if user is owner', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.delete.mockResolvedValue(undefined);

      await service.delete('project-id-1', 'owner-id');

      expect(mockProjectRepository.delete).toHaveBeenCalledWith('project-id-1');
    });

    it('should throw NotProjectOwnerException if user is not owner', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        service.delete('project-id-1', 'non-owner-id'),
      ).rejects.toThrow(NotProjectOwnerException);
    });
  });

  describe('addMember', () => {
    it('should add a member to the project', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockUserRepository.findById.mockResolvedValue(mockMember);
      mockProjectRepository.addMember.mockResolvedValue({
        ...mockProject,
        members: [mockOwner, mockMember],
      });

      const result = await service.addMember(
        'project-id-1',
        'member-id',
        'owner-id',
      );

      expect(result).toBeDefined();
      expect(mockProjectRepository.addMember).toHaveBeenCalledWith(
        'project-id-1',
        'member-id',
      );
    });

    it('should throw NotFoundException if user to add not found', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.addMember('project-id-1', 'non-existent', 'owner-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UserAlreadyMemberException if user is already a member', async () => {
      mockProjectRepository.findByIdWithMembers.mockResolvedValue(mockProject);
      mockUserRepository.findById.mockResolvedValue(mockOwner);

      await expect(
        service.addMember('project-id-1', 'owner-id', 'owner-id'),
      ).rejects.toThrow(UserAlreadyMemberException);
    });
  });
});
