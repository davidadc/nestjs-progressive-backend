/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import {
  IConversationRepository,
  CONVERSATION_REPOSITORY,
} from '../../domain/repositories/conversation.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/repositories/user.repository.interface';

describe('ConversationService', () => {
  let service: ConversationService;
  let mockConversationRepository: jest.Mocked<IConversationRepository>;
  let mockUserRepository: jest.Mocked<
    Pick<IUserRepository, 'findById' | 'findByIds'>
  >;

  const mockUser1 = {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User 1',
    avatar: null,
  };

  const mockUser2 = {
    id: 'user-2',
    email: 'user2@example.com',
    name: 'User 2',
    avatar: null,
  };

  const mockConversation = {
    id: 'conv-123',
    name: null,
    isGroup: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      { id: 'user-1', name: 'User 1', avatar: null },
      { id: 'user-2', name: 'User 2', avatar: null },
    ],
    lastMessage: null,
  };

  beforeEach(async () => {
    mockConversationRepository = {
      findById: jest.fn(),
      findByIdWithParticipants: jest.fn(),
      findByUserId: jest.fn(),
      findExistingConversation: jest.fn(),
      create: jest.fn(),
      addParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      isParticipant: jest.fn(),
      getParticipantIds: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: CONVERSATION_REPOSITORY,
          useValue: mockConversationRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new 1:1 conversation', async () => {
      const dto = { participantIds: ['user-2'] };
      const currentUserId = 'user-1';

      mockUserRepository.findByIds.mockResolvedValue([mockUser1, mockUser2]);
      mockConversationRepository.findExistingConversation.mockResolvedValue(
        null,
      );
      mockConversationRepository.create.mockResolvedValue({
        id: 'conv-123',
        name: null,
        isGroup: false,
      });
      mockConversationRepository.addParticipant.mockResolvedValue({});
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );

      const result = await service.create(dto, currentUserId);

      expect(mockUserRepository.findByIds).toHaveBeenCalled();
      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        name: undefined,
        isGroup: false,
      });
      expect(result).toEqual(expect.objectContaining({ id: 'conv-123' }));
    });

    it('should return existing conversation for same participants', async () => {
      const dto = { participantIds: ['user-2'] };
      const currentUserId = 'user-1';

      mockUserRepository.findByIds.mockResolvedValue([mockUser1, mockUser2]);
      mockConversationRepository.findExistingConversation.mockResolvedValue({
        id: 'existing-conv',
      });
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );

      const result = await service.create(dto, currentUserId);

      expect(mockConversationRepository.create).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if participant not found', async () => {
      const dto = { participantIds: ['non-existent'] };
      const currentUserId = 'user-1';

      mockUserRepository.findByIds.mockResolvedValue([mockUser1]);

      await expect(service.create(dto, currentUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('should return conversation if user is participant', async () => {
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );
      mockConversationRepository.isParticipant.mockResolvedValue(true);

      const result = await service.findById('conv-123', 'user-1');

      expect(result).toEqual(expect.objectContaining({ id: 'conv-123' }));
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        null,
      );

      await expect(service.findById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );
      mockConversationRepository.isParticipant.mockResolvedValue(false);

      await expect(service.findById('conv-123', 'user-3')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return paginated conversations', async () => {
      mockConversationRepository.findByUserId.mockResolvedValue({
        conversations: [mockConversation],
        total: 1,
      });

      const result = await service.findByUserId('user-1', 1, 20);

      expect(result.conversations).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to conversation', async () => {
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );
      mockConversationRepository.isParticipant
        .mockResolvedValueOnce(true) // current user is participant
        .mockResolvedValueOnce(false); // new user is not participant
      mockUserRepository.findById.mockResolvedValue(mockUser2);
      mockConversationRepository.addParticipant.mockResolvedValue({});

      const result = await service.addParticipant(
        'conv-123',
        'user-3',
        'user-1',
      );

      expect(mockConversationRepository.addParticipant).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if user already participant', async () => {
      mockConversationRepository.findByIdWithParticipants.mockResolvedValue(
        mockConversation,
      );
      mockConversationRepository.isParticipant.mockResolvedValue(true);

      await expect(
        service.addParticipant('conv-123', 'user-2', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
