import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;

  let mockRedis: Record<string, jest.Mock<any>>;

  beforeEach(async () => {
    // Mock Redis client
    mockRedis = {
      setex: jest.fn().mockResolvedValue('OK'),
      sadd: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      get: jest.fn(),
      smembers: jest.fn(),
      sismember: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: number | string) => {
        const config: Record<string, number | string> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
    // Replace Redis instance with mock
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (service as any).redis = mockRedis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setUserOnline', () => {
    it('should set user online status', async () => {
      await service.setUserOnline('user-123', 'online');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'presence:user-123',
        300,
        'online',
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('online_users', 'user-123');
    });

    it('should default to online status', async () => {
      await service.setUserOnline('user-123');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'presence:user-123',
        300,
        'online',
      );
    });
  });

  describe('setUserOffline', () => {
    it('should remove user from online set', async () => {
      await service.setUserOffline('user-123');

      expect(mockRedis.del).toHaveBeenCalledWith('presence:user-123');
      expect(mockRedis.srem).toHaveBeenCalledWith('online_users', 'user-123');
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      await service.updateStatus('user-123', 'away');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'presence:user-123',
        300,
        'away',
      );
    });
  });

  describe('getUserStatus', () => {
    it('should return user status', async () => {
      mockRedis.get.mockResolvedValue('online');

      const result = await service.getUserStatus('user-123');

      expect(result).toBe('online');
      expect(mockRedis.get).toHaveBeenCalledWith('presence:user-123');
    });

    it('should return null if user not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getUserStatus('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getOnlineUserIds', () => {
    it('should return list of online user IDs', async () => {
      mockRedis.smembers.mockResolvedValue(['user-1', 'user-2']);

      const result = await service.getOnlineUserIds();

      expect(result).toEqual(['user-1', 'user-2']);
      expect(mockRedis.smembers).toHaveBeenCalledWith('online_users');
    });
  });

  describe('setTyping', () => {
    it('should set typing indicator', async () => {
      await service.setTyping('conv-123', 'user-123');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'typing:conv-123:user-123',
        5,
        '1',
      );
    });
  });

  describe('clearTyping', () => {
    it('should clear typing indicator', async () => {
      await service.clearTyping('conv-123', 'user-123');

      expect(mockRedis.del).toHaveBeenCalledWith('typing:conv-123:user-123');
    });
  });

  describe('getTypingUsers', () => {
    it('should return list of typing users', async () => {
      mockRedis.keys.mockResolvedValue([
        'typing:conv-123:user-1',
        'typing:conv-123:user-2',
      ]);

      const result = await service.getTypingUsers('conv-123');

      expect(result).toEqual(['user-1', 'user-2']);
    });
  });
});
