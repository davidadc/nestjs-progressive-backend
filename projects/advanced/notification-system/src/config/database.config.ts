import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD || 'admin',
  name: process.env.DATABASE_NAME || 'notification_db',
  url:
    process.env.DATABASE_URL ||
    'postgresql://admin:admin@localhost:5432/notification_db',
}));
