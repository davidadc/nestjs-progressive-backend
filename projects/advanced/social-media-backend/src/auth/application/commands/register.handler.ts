import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterCommand } from './register.command';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../../infrastructure/strategies/jwt.strategy';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResponseDto> {
    const { email, username, name, password } = command;

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw ProblemDetailsFactory.conflict('User', 'email', email);
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      throw ProblemDetailsFactory.conflict('User', 'username', username);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      name,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const tokens = this.generateTokens(user);

    return {
      user: {
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
      },
      tokens,
    };
  }

  private generateTokens(user: UserEntity) {
    const accessExpiration = this.configService.get<number>('jwt.accessExpiration') || 900;
    const refreshExpiration = this.configService.get<number>('jwt.refreshExpiration') || 604800;

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: accessExpiration,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiration,
    };
  }
}
