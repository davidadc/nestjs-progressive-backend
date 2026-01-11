import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginCommand } from './login.command';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../../infrastructure/strategies/jwt.strategy';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResponseDto> {
    const { email, password } = command;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw ProblemDetailsFactory.invalidCredentials();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ProblemDetailsFactory.invalidCredentials();
    }

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
