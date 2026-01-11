import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, paymentConfig, appConfig } from './config';
import { PaymentsModule } from './payments/payments.module';

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
        entities: [__dirname + '/**/infrastructure/persistence/entities/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations
        logging: configService.get('app.nodeEnv') === 'development',
      }),
    }),

    // Feature Modules
    PaymentsModule,
  ],
})
export class AppModule {}
