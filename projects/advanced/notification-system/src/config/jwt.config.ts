import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: parseInt(process.env.JWT_EXPIRATION || '900', 10),
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
}));
