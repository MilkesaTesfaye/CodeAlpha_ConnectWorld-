import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isEmailVerified: boolean;
        sessionId?: string;
      };
      sessionId?: string;
      file?: Express.Multer.File;
    }
  }
}

export {};
