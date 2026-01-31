/**
 * Tracking routes - Receive API call data from SDK
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

export const trackRouter = Router();

// Validation schema
const APICallSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  provider: z.enum(['openai', 'anthropic', 'other']),
  model: z.string(),
  endpoint: z.string(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  cost: z.number(),
  latency: z.number(),
  status: z.enum(['success', 'error']),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const BatchSchema = z.object({
  calls: z.array(APICallSchema),
});

/**
 * POST /v1/track/batch
 * Receive batch of API calls
 */
trackRouter.post('/batch', authenticate, async (req, res) => {
  try {
    const { calls } = BatchSchema.parse(req.body);
    const userId = req.user!.id;

    // Insert calls into database
    const values = calls.map((call) => [
      call.id,
      userId,
      call.timestamp,
      call.provider,
      call.model,
      call.endpoint,
      call.inputTokens || null,
      call.outputTokens || null,
      call.totalTokens || null,
      call.cost,
      call.latency,
      call.status,
      call.errorMessage || null,
      JSON.stringify(call.metadata || {}),
    ]);

    // Bulk insert
    await db.query(
      `
      INSERT INTO api_calls (
        id, user_id, timestamp, provider, model, endpoint,
        input_tokens, output_tokens, total_tokens, cost, latency,
        status, error_message, metadata
      ) VALUES ${values.map((_, i) => `($${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${i * 14 + 4}, $${i * 14 + 5}, $${i * 14 + 6}, $${i * 14 + 7}, $${i * 14 + 8}, $${i * 14 + 9}, $${i * 14 + 10}, $${i * 14 + 11}, $${i * 14 + 12}, $${i * 14 + 13}, $${i * 14 + 14})`).join(', ')}
      ON CONFLICT (id) DO NOTHING
      `,
      values.flat()
    );

    // Update daily stats asynchronously
    updateDailyStats(userId, calls).catch(console.error);

    res.json({ success: true, tracked: calls.length });
  } catch (error) {
    console.error('Track error:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * Update daily aggregated stats
 */
async function updateDailyStats(userId: string, calls: any[]) {
  // Group by date + provider + model
  const groups = new Map<string, any>();

  for (const call of calls) {
    const date = new Date(call.timestamp).toISOString().split('T')[0];
    const key = `${date}:${call.provider}:${call.model}`;

    if (!groups.has(key)) {
      groups.set(key, {
        date,
        provider: call.provider,
        model: call.model,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalLatency: 0,
      });
    }

    const group = groups.get(key)!;
    group.totalCalls++;
    if (call.status === 'success') group.successfulCalls++;
    else group.failedCalls++;
    group.totalCost += call.cost;
    group.totalInputTokens += call.inputTokens || 0;
    group.totalOutputTokens += call.outputTokens || 0;
    group.totalLatency += call.latency;
  }

  // Upsert daily stats
  for (const [, stats] of groups) {
    await db.query(
      `
      INSERT INTO daily_stats (
        user_id, date, provider, model, total_calls, successful_calls,
        failed_calls, total_cost, total_input_tokens, total_output_tokens, avg_latency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, date, provider, model) DO UPDATE SET
        total_calls = daily_stats.total_calls + EXCLUDED.total_calls,
        successful_calls = daily_stats.successful_calls + EXCLUDED.successful_calls,
        failed_calls = daily_stats.failed_calls + EXCLUDED.failed_calls,
        total_cost = daily_stats.total_cost + EXCLUDED.total_cost,
        total_input_tokens = daily_stats.total_input_tokens + EXCLUDED.total_input_tokens,
        total_output_tokens = daily_stats.total_output_tokens + EXCLUDED.total_output_tokens,
        avg_latency = (daily_stats.avg_latency * daily_stats.total_calls + EXCLUDED.avg_latency * EXCLUDED.total_calls) / (daily_stats.total_calls + EXCLUDED.total_calls)
      `,
      [
        userId,
        stats.date,
        stats.provider,
        stats.model,
        stats.totalCalls,
        stats.successfulCalls,
        stats.failedCalls,
        stats.totalCost,
        stats.totalInputTokens,
        stats.totalOutputTokens,
        Math.round(stats.totalLatency / stats.totalCalls),
      ]
    );
  }
}
