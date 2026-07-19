import app from './app';
import env from './config/env';
import prisma from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import logger from './utils/logger';
import { createSocketServer } from './socket';

let server: ReturnType<typeof app.listen>;

async function bootstrap(): Promise<void> {
  try {
    // ─── Database Connection ──────────────────────────────────────────────
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // ─── Redis Connection ─────────────────────────────────────────────────
    try {
      await connectRedis();
    } catch {
      logger.warn('⚠️  Redis not available — running without caching');
    }

    // ─── Start HTTP Server ───────────────────────────────────────────────
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 ConnectWorld Server running on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Client URL: ${env.CLIENT_URL}`);
    });

    // ─── Socket.IO ────────────────────────────────────────────────────────
    createSocketServer(server);

    // ─── Graceful Shutdown ───────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await disconnectRedis();
        logger.info('✅ All connections closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('❌ Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
