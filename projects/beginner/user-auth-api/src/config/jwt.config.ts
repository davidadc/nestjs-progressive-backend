import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION ?? '900', 10), // 15 minutes
  refreshExpiration: parseInt(
    process.env.JWT_REFRESH_EXPIRATION ?? '604800',
    10,
  ), // 7 days
}));
