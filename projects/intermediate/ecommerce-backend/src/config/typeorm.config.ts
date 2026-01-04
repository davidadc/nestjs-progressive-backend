import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isCompiled = __dirname.includes('dist');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD || 'admin',
  database: process.env.DATABASE_NAME || 'ecommerce_db',
  entities: [isCompiled ? 'dist/**/*.orm-entity.js' : 'src/**/*.orm-entity.ts'],
  migrations: [isCompiled ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
