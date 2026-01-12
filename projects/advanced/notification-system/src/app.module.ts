import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

// Config
import { databaseConfig, jwtConfig, redisConfig, channelsConfig } from './config';
import { validate } from './config/env.validation';

// Infrastructure
import { DrizzleModule } from './drizzle/drizzle.module';

// Common
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { CommonModule } from './common/common.module';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, channelsConfig],
      envFilePath: '.env',
      validate,
    }),

    // CQRS
    CqrsModule,

    // Database
    DrizzleModule,

    // Common
    CommonModule,

    // Auth
    AuthModule,
    UsersModule,

    // Feature Modules
    ChannelsModule,
    PreferencesModule,
    NotificationsModule,
  ],
  providers: [
    // Global JWT Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Exception Filter (RFC 7807)
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
export class AppModule {}
