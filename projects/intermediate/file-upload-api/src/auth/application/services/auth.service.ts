import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../../users/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository.interface';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    storageLimit: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  storageUsed: number;
  storageLimit: number;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly defaultStorageLimit: bigint;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.defaultStorageLimit = BigInt(
      this.configService.get<number>('DEFAULT_STORAGE_LIMIT', 104857600),
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      storageUsed: BigInt(0),
      storageLimit: this.defaultStorageLimit,
    });

    // Generate JWT
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        storageLimit: Number(user.storageLimit),
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        storageLimit: Number(user.storageLimit),
      },
    };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      storageUsed: Number(user.storageUsed),
      storageLimit: Number(user.storageLimit),
      createdAt: user.createdAt,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findById(payload.sub);
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
