import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION || '900', 10),
  refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
}));
