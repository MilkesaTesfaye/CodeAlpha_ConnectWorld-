import prisma from '../config/database';
import { AuditAction, Prisma } from '@prisma/client';

interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Convert a plain object to a Prisma-compatible JSON value.
 * Uses a direct cast since Record<string, unknown> is inherently JSON-serializable.
 */
function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * Log an auditable action to the database.
 * This is used for security auditing and compliance.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: toJsonValue(input.details ?? {}),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Failed to write audit log:', error);
  }
}
