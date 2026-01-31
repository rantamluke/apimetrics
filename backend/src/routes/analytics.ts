/**
 * Analytics routes - Dashboard data
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

export const analyticsRouter = Router();

/**
 * GET /v1/analytics/overview
 * Get overview stats for dashboard
 */
analyticsRouter.get('/overview', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;

    // Get total costs and call counts
    const stats = await db.query(
      `
      SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_calls,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_calls,
        SUM(cost) as total_cost,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        AVG(latency) as avg_latency
      FROM api_calls
      WHERE user_id = $1
        AND timestamp >= $2
      `,
      [userId, Date.now() - days * 24 * 60 * 60 * 1000]
    );

    // Get breakdown by provider
    const byProvider = await db.query(
      `
      SELECT 
        provider,
        COUNT(*) as calls,
        SUM(cost) as cost,
        AVG(latency) as avg_latency
      FROM api_calls
      WHERE user_id = $1
        AND timestamp >= $2
      GROUP BY provider
      ORDER BY cost DESC
      `,
      [userId, Date.now() - days * 24 * 60 * 60 * 1000]
    );

    // Get breakdown by model
    const byModel = await db.query(
      `
      SELECT 
        model,
        provider,
        COUNT(*) as calls,
        SUM(cost) as cost,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens
      FROM api_calls
      WHERE user_id = $1
        AND timestamp >= $2
      GROUP BY model, provider
      ORDER BY cost DESC
      LIMIT 10
      `,
      [userId, Date.now() - days * 24 * 60 * 60 * 1000]
    );

    res.json({
      overview: stats.rows[0],
      byProvider: byProvider.rows,
      byModel: byModel.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /v1/analytics/timeseries
 * Get time series data for charts
 */
analyticsRouter.get('/timeseries', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;
    const groupBy = (req.query.groupBy as string) || 'day'; // hour, day

    let interval = '1 day';
    let format = 'YYYY-MM-DD';
    
    if (groupBy === 'hour') {
      interval = '1 hour';
      format = 'YYYY-MM-DD HH24:00';
    }

    const timeseries = await db.query(
      `
      SELECT 
        TO_CHAR(DATE_TRUNC($1, TO_TIMESTAMP(timestamp / 1000)), $2) as period,
        COUNT(*) as calls,
        SUM(cost) as cost,
        AVG(latency) as avg_latency
      FROM api_calls
      WHERE user_id = $3
        AND timestamp >= $4
      GROUP BY period
      ORDER BY period ASC
      `,
      [groupBy, format, userId, Date.now() - days * 24 * 60 * 60 * 1000]
    );

    res.json({ data: timeseries.rows });
  } catch (error) {
    console.error('Timeseries error:', error);
    res.status(500).json({ error: 'Failed to fetch timeseries' });
  }
});

/**
 * GET /v1/analytics/top-expensive
 * Get most expensive calls
 */
analyticsRouter.get('/top-expensive', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const calls = await db.query(
      `
      SELECT 
        id,
        timestamp,
        provider,
        model,
        cost,
        input_tokens,
        output_tokens,
        latency,
        metadata
      FROM api_calls
      WHERE user_id = $1
        AND status = 'success'
      ORDER BY cost DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    res.json({ calls: calls.rows });
  } catch (error) {
    console.error('Top expensive error:', error);
    res.status(500).json({ error: 'Failed to fetch top calls' });
  }
});

/**
 * GET /v1/analytics/recommendations
 * Get cost optimization recommendations
 */
analyticsRouter.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const recommendations = [];

    // Check if user is using expensive models for simple tasks
    const modelUsage = await db.query(
      `
      SELECT 
        model,
        COUNT(*) as calls,
        AVG(output_tokens) as avg_output,
        SUM(cost) as total_cost
      FROM api_calls
      WHERE user_id = $1
        AND timestamp >= $2
        AND status = 'success'
      GROUP BY model
      `,
      [userId, Date.now() - 7 * 24 * 60 * 60 * 1000]
    );

    // Recommend cheaper models for short outputs
    for (const row of modelUsage.rows) {
      if (row.model === 'gpt-4o' && row.avg_output < 500) {
        recommendations.push({
          type: 'model_downgrade',
          severity: 'high',
          title: 'Consider using GPT-4o-mini for shorter responses',
          description: `You're using ${row.model} for responses with avg ${Math.round(row.avg_output)} tokens. Switching to gpt-4o-mini could save ~70% ($${((row.total_cost * 0.7).toFixed(2))}/week).`,
          potentialSavings: row.total_cost * 0.7,
        });
      }

      if (row.model === 'claude-sonnet-4' && row.avg_output < 500) {
        recommendations.push({
          type: 'model_downgrade',
          severity: 'high',
          title: 'Consider using Claude Haiku for shorter responses',
          description: `You're using ${row.model} for responses with avg ${Math.round(row.avg_output)} tokens. Switching to claude-haiku-3.5 could save ~75% ($${((row.total_cost * 0.75).toFixed(2))}/week).`,
          potentialSavings: row.total_cost * 0.75,
        });
      }
    }

    // Check error rates
    const errorRate = await db.query(
      `
      SELECT 
        (SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)::float / COUNT(*)) as error_rate
      FROM api_calls
      WHERE user_id = $1
        AND timestamp >= $2
      `,
      [userId, Date.now() - 24 * 60 * 60 * 1000]
    );

    if (errorRate.rows[0]?.error_rate > 0.05) {
      recommendations.push({
        type: 'error_rate',
        severity: 'medium',
        title: 'High error rate detected',
        description: `${(errorRate.rows[0].error_rate * 100).toFixed(1)}% of your calls are failing. Check your prompts and API configuration.`,
      });
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});
