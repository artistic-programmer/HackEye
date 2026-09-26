import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// Extend Express Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  userId: string;
}

export const AUTH_COOKIE_NAME = 'dailybugle_token';

/**
 * Middleware: requireAuth
 * Requires a valid Daily Bugle session JWT in HttpOnly cookie or Authorization Bearer header.
 * Attaches verified user document to req.user.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.[AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured on the server');
      res.status(500).json({
        success: false,
        message: 'Internal server configuration error',
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please sign in again.',
      });
      return;
    }

    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication payload',
      });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User session not found. Please sign in again.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: optionalAuth
 * Attempts to attach req.user if a valid token is provided, but never rejects the request.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.[AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        if (decoded?.userId) {
          const user = await User.findById(decoded.userId);
          if (user) {
            req.user = user;
          }
        }
      } catch {
        // Silently continue without user
      }
    }
    next();
  } catch {
    next();
  }
};
