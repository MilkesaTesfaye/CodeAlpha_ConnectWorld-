import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './error.middleware';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

/**
 * Extract token from Authorization header or cookie.
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const token = req.cookies?.accessToken;
  if (token) {
    return token;
  }

  return null;
}

/**
 * Authentication middleware.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const decoded: TokenPayload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, roleId: true, isEmailVerified: true, isActive: true, isBanned: true },
    });

    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive || user.isBanned) {
      throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');
    }

    // Resolve role name by looking up the role record
    let roleName: UserRole = UserRole.USER;
    if (user.roleId) {
      const role = await prisma.role.findUnique({ where: { id: user.roleId } });
      if (role) roleName = role.name;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: roleName,
      isEmailVerified: user.isEmailVerified,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
    }
  }
}

/**
 * Optional authentication middleware.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded: TokenPayload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, roleId: true, isEmailVerified: true },
      });

      if (user) {
        let roleName: UserRole = UserRole.USER;
        if (user.roleId) {
          const role = await prisma.role.findUnique({ where: { id: user.roleId } });
          if (role) roleName = role.name;
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: roleName,
          isEmailVerified: user.isEmailVerified,
        };
      }
    }
  } catch {
    // Silently fail — auth is optional
  }

  next();
}

/**
 * Role-based authorization middleware.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}
