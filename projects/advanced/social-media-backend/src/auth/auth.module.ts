import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../shared/persistence/entities/user.entity';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { LoginHandler } from './application/commands/login.handler';
import { RegisterHandler } from './application/commands/register.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token.handler';

const CommandHandlers = [LoginHandler, RegisterHandler, RefreshTokenHandler];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<number>('jwt.accessExpiration') || 900,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, ...CommandHandlers],
  exports: [JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
