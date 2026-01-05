/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from '../../application/services/presence.service';
import { MessageService } from '../../../messages/application/services/message.service';
import { ConversationService } from '../../../conversations/application/services/conversation.service';
import { AuthService } from '../../../auth/application/services/auth.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;
  let mockPresenceService: jest.Mocked<Partial<PresenceService>>;
  let mockMessageService: jest.Mocked<Partial<MessageService>>;
  let mockConversationService: jest.Mocked<Partial<ConversationService>>;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    };

    mockAuthService = {
      validateUser: jest.fn(),
    };

    mockPresenceService = {
      setUserOnline: jest.fn().mockResolvedValue(undefined),
      setUserOffline: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      setTyping: jest.fn().mockResolvedValue(undefined),
      clearTyping: jest.fn().mockResolvedValue(undefined),
    };

    mockMessageService = {
      sendMessage: jest.fn(),
    };

    mockConversationService = {
      isParticipant: jest.fn(),
      getParticipantIds: jest.fn(),
    };

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      fetchSockets: jest.fn().mockResolvedValue([]),
    };

    mockSocket = {
      id: 'socket-123',
      data: {},
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
      } as any,
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PresenceService, useValue: mockPresenceService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ConversationService, useValue: mockConversationService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate user with valid token and set online', async () => {
      mockJwtService.verify!.mockReturnValue({
        sub: 'user-123',
        email: 'test@example.com',
      });
      mockAuthService.validateUser!.mockResolvedValue(mockUser);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('user-123');
      expect(mockPresenceService.setUserOnline).toHaveBeenCalledWith(
        'user-123',
        'online',
      );
      expect(mockServer.emit).toHaveBeenCalledWith('user:online', {
        userId: 'user-123',
        name: 'Test User',
        status: 'online',
      });
      expect(mockSocket.data.user).toEqual(mockUser);
    });

    it('should disconnect client when no token provided', async () => {
      mockSocket.handshake = { auth: {}, headers: {} } as any;

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'No token provided',
        code: 'AUTH_ERROR',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client when token is invalid', async () => {
      mockJwtService.verify!.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid token',
        code: 'AUTH_ERROR',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client when user not found', async () => {
      mockJwtService.verify!.mockReturnValue({
        sub: 'user-123',
        email: 'test@example.com',
      });
      mockAuthService.validateUser!.mockResolvedValue(null);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'User not found',
        code: 'AUTH_ERROR',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should extract token from Authorization header', async () => {
      mockSocket.handshake = {
        auth: {},
        headers: { authorization: 'Bearer header-token' },
      } as any;
      mockJwtService.verify!.mockReturnValue({
        sub: 'user-123',
        email: 'test@example.com',
      });
      mockAuthService.validateUser!.mockResolvedValue(mockUser);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token');
    });
  });

  describe('handleDisconnect', () => {
    it('should set user offline and broadcast', async () => {
      mockSocket.data.user = mockUser;

      await gateway.handleDisconnect(mockSocket as Socket);

      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockServer.emit).toHaveBeenCalledWith('user:offline', {
        userId: 'user-123',
      });
    });

    it('should do nothing if user not found in socket data', async () => {
      mockSocket.data.user = undefined;

      await gateway.handleDisconnect(mockSocket as Socket);

      expect(mockPresenceService.setUserOffline).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should join conversation room when user is participant', async () => {
      mockConversationService.isParticipant!.mockResolvedValue(true);

      await gateway.handleJoinConversation(mockSocket as Socket, {
        conversationId: 'conv-123',
      });

      expect(mockConversationService.isParticipant).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
      );
      expect(mockSocket.join).toHaveBeenCalledWith('conversation:conv-123');
    });

    it('should emit error when user is not participant', async () => {
      mockConversationService.isParticipant!.mockResolvedValue(false);

      await gateway.handleJoinConversation(mockSocket as Socket, {
        conversationId: 'conv-123',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Not a participant of this conversation',
        code: 'FORBIDDEN',
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveConversation', () => {
    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should leave conversation room and clear typing', async () => {
      await gateway.handleLeaveConversation(mockSocket as Socket, {
        conversationId: 'conv-123',
      });

      expect(mockSocket.leave).toHaveBeenCalledWith('conversation:conv-123');
      expect(mockPresenceService.clearTyping).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
      );
    });
  });

  describe('handleSendMessage', () => {
    const mockMessage = {
      id: 'msg-123',
      conversationId: 'conv-123',
      senderId: 'user-123',
      content: 'Hello!',
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: mockUser,
    };

    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should send message and broadcast to conversation room', async () => {
      mockMessageService.sendMessage!.mockResolvedValue(mockMessage);
      mockConversationService.getParticipantIds!.mockResolvedValue([
        'user-123',
        'user-456',
      ]);

      await gateway.handleSendMessage(mockSocket as Socket, {
        conversationId: 'conv-123',
        content: 'Hello!',
      });

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        'conv-123',
        { content: 'Hello!' },
        'user-123',
      );
      expect(mockPresenceService.clearTyping).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
      );
      expect(mockServer.to).toHaveBeenCalledWith('conversation:conv-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'message:received',
        mockMessage,
      );
    });

    it('should emit error when message sending fails', async () => {
      mockMessageService.sendMessage!.mockRejectedValue(
        new Error('Database error'),
      );

      await gateway.handleSendMessage(mockSocket as Socket, {
        conversationId: 'conv-123',
        content: 'Hello!',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Database error',
        code: 'MESSAGE_ERROR',
      });
    });
  });

  describe('handleTypingStart', () => {
    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should set typing and broadcast to conversation', async () => {
      await gateway.handleTypingStart(mockSocket as Socket, {
        conversationId: 'conv-123',
      });

      expect(mockPresenceService.setTyping).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
      );
      expect(mockSocket.to).toHaveBeenCalledWith('conversation:conv-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('typing:update', {
        conversationId: 'conv-123',
        userId: 'user-123',
        isTyping: true,
      });
    });
  });

  describe('handleTypingStop', () => {
    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should clear typing and broadcast to conversation', async () => {
      await gateway.handleTypingStop(mockSocket as Socket, {
        conversationId: 'conv-123',
      });

      expect(mockPresenceService.clearTyping).toHaveBeenCalledWith(
        'conv-123',
        'user-123',
      );
      expect(mockSocket.to).toHaveBeenCalledWith('conversation:conv-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('typing:update', {
        conversationId: 'conv-123',
        userId: 'user-123',
        isTyping: false,
      });
    });
  });

  describe('handlePresenceUpdate', () => {
    beforeEach(() => {
      mockSocket.data.user = mockUser;
    });

    it('should update status and broadcast to all', async () => {
      await gateway.handlePresenceUpdate(mockSocket as Socket, {
        status: 'away',
      });

      expect(mockPresenceService.updateStatus).toHaveBeenCalledWith(
        'user-123',
        'away',
      );
      expect(mockServer.emit).toHaveBeenCalledWith('user:online', {
        userId: 'user-123',
        name: 'Test User',
        status: 'away',
      });
    });
  });
});
