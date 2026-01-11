import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenCommand } from './refresh-token.command';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { AuthTokensDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../../infrastructure/strategies/jwt.strategy';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthTokensDto> {
    const { refreshToken } = command;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw ProblemDetailsFactory.tokenExpired();
    }

    if (payload.type !== 'refresh') {
      throw ProblemDetailsFactory.unauthorized('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw ProblemDetailsFactory.unauthorized('User not found');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: UserEntity): AuthTokensDto {
    const accessExpiration =
      this.configService.get<number>('jwt.accessExpiration') || 900;
    const refreshExpiration =
      this.configService.get<number>('jwt.refreshExpiration') || 604800;

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

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiration,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: accessExpiration,
    };
  }
}
