import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
const migrationConfig = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT as string) || 5432,
  database: process.env.POSTGRES_DB || '',
  username: process.env.POSTGRES_USER || '',
  password: process.env.POSTGRES_PASSWORD || '',
  entities: [
    __dirname + '/../../**/*.entity.ts',
    __dirname + '/../../**/*.entity.js',
  ],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  migrationsTableName: 'migrations',
  migrations: ['dist/common/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'dist/common/migrations',
  },
};
export default migrationConfig;
