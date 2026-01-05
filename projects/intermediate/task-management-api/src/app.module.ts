import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { JwtAuthGuard } from './auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './auth/infrastructure/guards/roles.guard';
import { databaseConfig, jwtConfig, throttleConfig } from './config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, throttleConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl') || 60000,
          limit: configService.get<number>('throttle.limit') || 100,
        },
      ],
    }),

    // Event emitter for Observer pattern
    EventEmitterModule.forRoot(),

    // Database
    PrismaModule,

    // Common utilities
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
