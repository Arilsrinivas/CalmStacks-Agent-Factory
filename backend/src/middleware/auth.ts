import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUserPayload, UserRole } from '../types/index.js';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'legalconnect-secret-calmstacks-2026';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export function signToken(payload: AuthenticatedUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthenticatedUserPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
  } catch (error) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is invalid or expired');
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authorization header with Bearer token is required');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Bearer token is missing');
  }

  const decoded = verifyToken(token);
  req.user = decoded;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'User is not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied. Required role(s): [${roles.join(', ')}], current role: ${req.user.role}`
      );
    }

    next();
  };
}
