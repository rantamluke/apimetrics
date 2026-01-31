/**
 * Auth routes - Registration, login, API keys
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const API_KEY_PREFIX = 'apim_';

/**
 * POST /v1/auth/register
 * Register new user
 */
authRouter.post('/register', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const { email, password } = schema.parse(req.body);

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, plan',
      [email, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    // Generate first API key
    const apiKey = await createAPIKey(user.id, 'Default Key');

    res.json({
      user: { id: user.id, email: user.email, plan: user.plan },
      token,
      apiKey,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * POST /v1/auth/login
 * Login user
 */
authRouter.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = schema.parse(req.body);

    // Get user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: { id: user.id, email: user.email, plan: user.plan },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * GET /v1/auth/me
 * Get current user
 */
authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * GET /v1/auth/keys
 * List API keys
 */
authRouter.get('/keys', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, name, last_used_at, created_at
      FROM api_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user!.id]
    );

    res.json({ keys: result.rows });
  } catch (error) {
    console.error('List keys error:', error);
    res.status(500).json({ error: 'Failed to list keys' });
  }
});

/**
 * POST /v1/auth/keys
 * Create new API key
 */
authRouter.post('/keys', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().max(100),
    });

    const { name } = schema.parse(req.body);
    const apiKey = await createAPIKey(req.user!.id, name);

    res.json({ apiKey });
  } catch (error) {
    console.error('Create key error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * DELETE /v1/auth/keys/:id
 * Delete API key
 */
authRouter.delete('/keys/:id', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

/**
 * Helper: Create API key
 */
async function createAPIKey(userId: string, name: string): Promise<string> {
  // Generate random key
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const apiKey = `${API_KEY_PREFIX}${randomBytes}`;

  // Hash for storage
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Store in DB
  await db.query(
    'INSERT INTO api_keys (user_id, key_hash, name) VALUES ($1, $2, $3)',
    [userId, keyHash, name]
  );

  return apiKey;
}

/**
 * Helper: Verify API key
 */
export async function verifyAPIKey(apiKey: string): Promise<any | null> {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const result = await db.query(
    `
    SELECT u.id, u.email, u.plan
    FROM api_keys k
    JOIN users u ON u.id = k.user_id
    WHERE k.key_hash = $1
    `,
    [keyHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Update last_used_at
  await db.query(
    'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = $1',
    [keyHash]
  );

  return result.rows[0];
}
