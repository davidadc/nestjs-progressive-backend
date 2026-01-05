import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { User, UserRole } from '../../../users/domain/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  const mockUser = new User({
    id: 'user-id-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash the password before saving', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
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

      const result = await service.validateUser({
        sub: 'user-id-1',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.validateUser({
        sub: 'non-existent',
        email: 'test@example.com',
      });

      expect(result).toBeNull();
    });
  });
});
