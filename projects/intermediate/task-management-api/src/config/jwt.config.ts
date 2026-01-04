import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: parseInt(process.env.JWT_EXPIRATION || '900', 10),
}));
