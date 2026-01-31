/**
 * Auth middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAPIKey } from '../routes/auth';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        plan: string;
      };
    }
  }
}

/**
 * Authenticate via JWT or API key
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token.startsWith('apim_')) {
      // API Key authentication
      const user = await verifyAPIKey(token);
      if (!user) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }

      req.user = user;
      next();
    } else if (type === 'Bearer') {
      // JWT authentication
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Get user
        const result = await db.query(
          'SELECT id, email, plan FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        req.user = result.rows[0];
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    } else {
      res.status(401).json({ error: 'Invalid authorization format' });
      return;
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
