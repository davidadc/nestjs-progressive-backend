/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageService } from './message.service';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IConversationRepository,
  CONVERSATION_REPOSITORY,
} from '../../../conversations/domain/repositories/conversation.repository.interface';

describe('MessageService', () => {
  let service: MessageService;
  let mockMessageRepository: jest.Mocked<IMessageRepository>;
  let mockConversationRepository: jest.Mocked<
    Pick<IConversationRepository, 'findById' | 'isParticipant'>
  >;

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-1',
    content: 'Hello, world!',
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: {
      id: 'user-1',
      name: 'User 1',
      avatar: null,
    },
  };

  const mockConversation = {
    id: 'conv-123',
    name: null,
    isGroup: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMessageRepository = {
      findById: jest.fn(),
      findByConversationId: jest.fn(),
      create: jest.fn(),
      getLastMessage: jest.fn(),
    };

    mockConversationRepository = {
      findById: jest.fn(),
      isParticipant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: MESSAGE_REPOSITORY,
          useValue: mockMessageRepository,
        },
        {
          provide: CONVERSATION_REPOSITORY,
          useValue: mockConversationRepository,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    const sendMessageDto = { content: 'Hello, world!' };

    it('should send a message successfully', async () => {
      mockConversationRepository.findById.mockResolvedValue(mockConversation);
      mockConversationRepository.isParticipant.mockResolvedValue(true);
      mockMessageRepository.create.mockResolvedValue(mockMessage);
      mockMessageRepository.findByConversationId.mockResolvedValue({
        messages: [mockMessage],
        total: 1,
        hasMore: false,
      });

      const result = await service.sendMessage(
        'conv-123',
        sendMessageDto,
        'user-1',
      );

      expect(mockConversationRepository.findById).toHaveBeenCalledWith(
        'conv-123',
      );
      expect(mockConversationRepository.isParticipant).toHaveBeenCalledWith(
        'conv-123',
        'user-1',
      );
      expect(mockMessageRepository.create).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: 'msg-123',
          content: 'Hello, world!',
        }),
      );
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationRepository.findById.mockResolvedValue(null);

      await expect(
        service.sendMessage('non-existent', sendMessageDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockConversationRepository.findById.mockResolvedValue(mockConversation);
      mockConversationRepository.isParticipant.mockResolvedValue(false);

      await expect(
        service.sendMessage('conv-123', sendMessageDto, 'user-3'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessageHistory', () => {
    it('should return paginated messages', async () => {
      mockConversationRepository.findById.mockResolvedValue(mockConversation);
      mockConversationRepository.isParticipant.mockResolvedValue(true);
      mockMessageRepository.findByConversationId.mockResolvedValue({
        messages: [mockMessage],
        total: 1,
        hasMore: false,
      });

      const result = await service.getMessageHistory(
        'conv-123',
        'user-1',
        1,
        50,
      );

      expect(result.messages).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationRepository.findById.mockResolvedValue(null);

      await expect(
        service.getMessageHistory('non-existent', 'user-1', 1, 50),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockConversationRepository.findById.mockResolvedValue(mockConversation);
      mockConversationRepository.isParticipant.mockResolvedValue(false);

      await expect(
        service.getMessageHistory('conv-123', 'user-3', 1, 50),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
