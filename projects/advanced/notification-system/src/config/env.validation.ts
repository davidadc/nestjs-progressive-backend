import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // App
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  // Database
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  @Min(1)
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_URL: string;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  @IsOptional()
  JWT_EXPIRATION: number = 900;

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  @IsNumber()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: number = 604800;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // SendGrid (Email) - Optional
  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_EMAIL?: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_NAME?: string;

  // Twilio (SMS) - Optional
  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID?: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN?: string;

  @IsString()
  @IsOptional()
  TWILIO_FROM_NUMBER?: string;

  // Firebase Cloud Messaging (Push) - Optional
  @IsString()
  @IsOptional()
  FCM_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  FCM_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  FCM_CLIENT_EMAIL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Unknown error';
        return `${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
