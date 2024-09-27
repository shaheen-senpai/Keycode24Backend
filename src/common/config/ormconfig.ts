import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT as string),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [__dirname + '/../../**/*.entity.ts'],
  migrations: [
    process.env.ENV === 'local'
      ? 'src/common/migrations/*.ts'
      : 'dist/common/migrations/*.js',
  ],
  namingStrategy: new SnakeNamingStrategy(),
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: false,
  dropSchema: false,
});
