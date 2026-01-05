/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/repositories/user.repository.interface';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    avatar: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Expected avatar in responses (service converts null to undefined)
  const expectedAvatar = undefined;

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findOnlineUsers: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatar: expectedAvatar,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: 'test-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          avatar: expectedAvatar,
          createdAt: mockUser.createdAt,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatar: expectedAvatar,
        createdAt: mockUser.createdAt,
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });
});
