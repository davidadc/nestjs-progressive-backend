import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import {
  AuthResponseDto,
  AuthTokensDto,
  UserProfileDto,
} from '../../application/dto/auth-response.dto';
import { LoginCommand } from '../../application/commands/login.command';
import { RegisterCommand } from '../../application/commands/register.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { Repository } from 'typeorm';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.commandBus.execute(
      new RegisterCommand(dto.email, dto.username, dto.name, dto.password),
    );
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.commandBus.execute(new LoginCommand(dto.email, dto.password));
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthTokensDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.commandBus.execute(new RefreshTokenCommand(dto.refreshToken));
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.userId },
    });

    if (!user) {
      throw ProblemDetailsFactory.notFound('User', currentUser.userId);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
    };
  }
}
