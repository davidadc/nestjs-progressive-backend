import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: number;
}

export default registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET || '',
    expiresIn: parseInt(process.env.JWT_EXPIRATION || '900', 10),
  }),
);
