import { createClient, RedisClientType } from 'redis';
import env from './env';
import logger from '../utils/logger';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection.
 * Falls back gracefully if Redis is unavailable in development.
 */
export async function connectRedis(): Promise<RedisClientType | null> {
  try {
    redisClient = createClient({ url: env.REDIS_URL, socket: { reconnectStrategy: false } });

    redisClient.on('error', () => {
      // Silently ignore — Redis is optional
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch {
    logger.warn('⚠️ Redis not available — running without caching');
    redisClient = null;
    return null;
  }
}

export function getRedis(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore quit errors
    }
  }
}
