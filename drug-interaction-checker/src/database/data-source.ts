import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { parseDatabaseUrl } from './parse-database-url';

dotenv.config();

const parsed = parseDatabaseUrl(process.env.DATABASE_URL);

/**
 * TypeORM DataSource for CLI commands (migrations, schema sync).
 * Used by: npm run typeorm / npm run migration:*
 *
 * Supports DATABASE_URL (priority) or individual DB_* env vars.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: parsed?.host ?? process.env.DB_HOST ?? 'localhost',
  port: parsed?.port ?? parseInt(process.env.DB_PORT ?? '5432', 10),
  username: parsed?.username ?? process.env.DB_USERNAME ?? 'postgres',
  password: parsed?.password ?? process.env.DB_PASSWORD ?? '',
  database: parsed?.database ?? process.env.DB_DATABASE ?? 'postgres',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: parsed?.ssl ?? { rejectUnauthorized: false },
});
