import prisma from '../config/database';

/**
 * Database helpers for common operations.
 */

/**
 * Check if a record exists by ID.
 */
export async function exists(model: string, id: string): Promise<boolean> {
  const record = await (prisma as any)[model].findUnique({
    where: { id },
    select: { id: true },
  });
  return !!record;
}

/**
 * Soft-delete a record by updating deletedAt.
 */
export async function softDelete(model: string, id: string): Promise<void> {
  await (prisma as any)[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Generate a CUID-like unique ID using timestamp + random.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}

/**
 * Wrap a database operation with error handling.
 */
export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw error;
  }
}
