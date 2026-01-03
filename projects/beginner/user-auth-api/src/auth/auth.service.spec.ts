import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../users/entities/user.entity';

jest.mock('bcrypt');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-token'),
}));

// Type for mocked PrismaService with only the methods we use
type MockPrismaService = {
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: MockPrismaService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: number) => {
        const config: Record<string, number> = {
          'jwt.accessExpiration': 900,
          'jwt.refreshExpiration': 604800,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const mockPrismaService: MockPrismaService = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    prismaService = module.get(PrismaService) as unknown as MockPrismaService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should register a new user successfully', async () => {
      const createdUser = {
        ...mockUser,
        id: 'new-user-id',
        email: registerDto.email,
        name: registerDto.name,
      };

      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.create.mockResolvedValue(createdUser);
      jwtService.sign.mockReturnValue('access-token');
      prismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        name: registerDto.name,
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('mocked-uuid-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('access-token');
      prismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('mocked-uuid-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid-refresh-token';

    it('should refresh tokens successfully', async () => {
      const storedToken = {
        id: 'token-id',
        token: refreshToken,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        createdAt: new Date(),
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(storedToken);
      prismaService.refreshToken.delete.mockResolvedValue({});
      jwtService.sign.mockReturnValue('new-access-token');
      prismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens(refreshToken);

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
        include: { user: true },
      });
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: storedToken.id },
      });
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('mocked-uuid-token');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.refreshToken.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const expiredToken = {
        id: 'token-id',
        token: refreshToken,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        createdAt: new Date(),
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
      prismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      // Should delete expired token
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: expiredToken.id },
      });
    });
  });

  describe('logout', () => {
    it('should logout and delete all refresh tokens for user', async () => {
      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout(mockUser.id);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });

    it('should logout and delete specific refresh token', async () => {
      const specificToken = 'specific-token';
      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout(mockUser.id, specificToken);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, token: specificToken },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(result.role).toBe(mockUser.role);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
