import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Prisma client singleton with driver adapter (Prisma 7).
 * Uses the mariadb driver adapter for database connectivity.
 * In development, reuse the same instance across hot-reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/connectworld';

  // Parse the connection URL for adapter config
  const url = new URL(connectionString);
  const poolConfig = {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port, 10) || 3306,
    user: decodeURIComponent(url.username) || 'root',
    password: url.password ? decodeURIComponent(url.password) : '',
    database: url.pathname.replace('/', '') || 'connectworld',
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  };

  const adapter = new PrismaMariaDb(poolConfig);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

const prisma =
  global.__prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
