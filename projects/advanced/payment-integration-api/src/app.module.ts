import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { databaseConfig, paymentConfig, appConfig } from './config';
import { PaymentsModule } from './payments/payments.module';
import {
  IdempotencyKeyEntity,
  IDEMPOTENCY_REPOSITORY,
  IdempotencyRepository,
  IdempotencyInterceptor,
  IdempotencyService,
} from './common/idempotency';
import { HealthModule } from './common/health';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, paymentConfig, appConfig],
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          __dirname +
            '/**/infrastructure/persistence/entities/*.entity{.ts,.js}',
          __dirname + '/common/**/*.entity{.ts,.js}',
        ],
        synchronize: false, // Use migrations
        logging: configService.get('app.nodeEnv') === 'development',
      }),
    }),

    // Idempotency Entity
    TypeOrmModule.forFeature([IdempotencyKeyEntity]),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature Modules
    PaymentsModule,

    // Health Checks
    HealthModule,
  ],
  providers: [
    // Rate Limiting Guard (global)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Idempotency
    {
      provide: IDEMPOTENCY_REPOSITORY,
      useClass: IdempotencyRepository,
    },
    IdempotencyService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
