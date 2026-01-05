import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { JwtAuthGuard } from './auth/infrastructure/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  appConfig,
  jwtConfig,
  storageConfig,
  uploadConfig,
  envValidationSchema,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, storageConfig, uploadConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? [
            { name: 'short', ttl: 1000, limit: 10000 },
            { name: 'medium', ttl: 10000, limit: 10000 },
            { name: 'long', ttl: 60000, limit: 10000 },
          ]
        : [
            {
              name: 'short',
              ttl: 1000, // 1 second
              limit: 3, // 3 requests per second
            },
            {
              name: 'medium',
              ttl: 10000, // 10 seconds
              limit: 20, // 20 requests per 10 seconds
            },
            {
              name: 'long',
              ttl: 60000, // 1 minute
              limit: 100, // 100 requests per minute
            },
          ],
    ),
    PrismaModule,
    AuthModule,
    UsersModule,
    FilesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
