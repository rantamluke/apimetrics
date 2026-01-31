/**
 * Alerts routes - Manage user alerts
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { checkAlerts } from '../services/alerts';

export const alertsRouter = Router();

/**
 * GET /v1/alerts
 * List user's alerts
 */
alertsRouter.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, name, type, threshold, channels, enabled, last_triggered_at, created_at
      FROM alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user!.id]
    );

    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('List alerts error:', error);
    res.status(500).json({ error: 'Failed to list alerts' });
  }
});

/**
 * POST /v1/alerts
 * Create new alert
 */
alertsRouter.post('/', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().max(100),
      type: z.enum(['daily_budget', 'hourly_spike', 'error_rate']),
      threshold: z.number().positive(),
      channels: z.array(
        z.object({
          type: z.enum(['email', 'slack']),
          value: z.string().optional(),
          webhook: z.string().optional(),
        })
      ),
    });

    const data = schema.parse(req.body);

    const result = await db.query(
      `
      INSERT INTO alerts (user_id, name, type, threshold, channels)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [req.user!.id, data.name, data.type, data.threshold, JSON.stringify(data.channels)]
    );

    res.json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * PATCH /v1/alerts/:id
 * Update alert
 */
alertsRouter.patch('/:id', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().max(100).optional(),
      threshold: z.number().positive().optional(),
      channels: z
        .array(
          z.object({
            type: z.enum(['email', 'slack']),
            value: z.string().optional(),
            webhook: z.string().optional(),
          })
        )
        .optional(),
      enabled: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.threshold !== undefined) {
      updates.push(`threshold = $${paramCount++}`);
      values.push(data.threshold);
    }
    if (data.channels !== undefined) {
      updates.push(`channels = $${paramCount++}`);
      values.push(JSON.stringify(data.channels));
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      values.push(data.enabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id, req.user!.id);

    const result = await db.query(
      `
      UPDATE alerts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * DELETE /v1/alerts/:id
 * Delete alert
 */
alertsRouter.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

/**
 * POST /v1/alerts/:id/test
 * Test an alert (trigger manually)
 */
alertsRouter.post('/:id/test', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Trigger alert check for this user
    await checkAlerts(req.user!.id);

    res.json({ success: true, message: 'Alert check triggered' });
  } catch (error) {
    console.error('Test alert error:', error);
    res.status(500).json({ error: 'Failed to test alert' });
  }
});
