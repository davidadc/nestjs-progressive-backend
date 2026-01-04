import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { UserPersistenceMapper } from './infrastructure/persistence/user.persistence-mapper';
import { AuthService } from './application/services/auth.service';
import { AddressService } from './application/services/address.service';
import { UserMapper } from './application/mappers/user.mapper';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AddressController } from './infrastructure/controllers/address.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }
        return {
          secret,
          signOptions: {
            expiresIn: parseInt(
              configService.get<string>('JWT_EXPIRATION', '900'),
              10,
            ),
          },
        };
      },
    }),
  ],
  controllers: [AuthController, AddressController],
  providers: [
    AuthService,
    AddressService,
    UserMapper,
    UserPersistenceMapper,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [AuthService, AddressService, USER_REPOSITORY],
})
export class AuthModule {}
