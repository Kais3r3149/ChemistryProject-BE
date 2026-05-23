/**
 * Parse a PostgreSQL DATABASE_URL connection string into TypeORM config.
 *
 * Supported formats:
 *   postgresql://user:password@host:port/database
 *   postgresql://user:password@host:port/database?sslmode=require
 *   postgres://user:password@host:port/database
 *
 * Returns undefined if the URL is empty/missing so callers can fall back
 * to individual env vars.
 */

interface PostgresConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export function parseDatabaseUrl(
  url: string | undefined,
): PostgresConnectionConfig | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  const sslMode = parsed.searchParams.get('sslmode');
  const ssl =
    sslMode === 'disable'
      ? false
      : { rejectUnauthorized: sslMode === 'verify-full' };

  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    username: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    database: (parsed.pathname || '/postgres').slice(1) || 'postgres',
    ssl,
  };
}
