import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration for ConnectWorld.
 * In Prisma 7, the database connection URL is specified here for CLI commands (push, migrate).
 * The PrismaClient at runtime reads the URL from the DATABASE_URL env var via the .env file.
 */
export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/connectworld',
  },
});
