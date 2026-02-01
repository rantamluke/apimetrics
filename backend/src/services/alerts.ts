/**
 * Alert Service - Send notifications via Email/Slack
 */

import axios from 'axios';
import { db } from '../db';
import { sendAlert } from './email';

export interface Alert {
  id: string;
  userId: string;
  name: string;
  type: 'daily_budget' | 'hourly_spike' | 'error_rate';
  threshold: number;
  channels: AlertChannel[];
  enabled: boolean;
  lastTriggeredAt?: Date;
}

export interface AlertChannel {
  type: 'email' | 'slack';
  value?: string;
  webhook?: string;
}

/**
 * Check and trigger alerts for a user
 */
export async function checkAlerts(userId: string): Promise<void> {
  // Get user's alerts
  const result = await db.query(
    'SELECT * FROM alerts WHERE user_id = $1 AND enabled = true',
    [userId]
  );

  const alerts = result.rows as Alert[];

  for (const alert of alerts) {
    const shouldTrigger = await shouldTriggerAlert(alert);
    
    if (shouldTrigger) {
      await triggerAlert(alert);
    }
  }
}

/**
 * Check if alert should be triggered
 */
async function shouldTriggerAlert(alert: Alert): Promise<boolean> {
  const now = Date.now();
  const timeWindow = getTimeWindow(alert.type);

  switch (alert.type) {
    case 'daily_budget': {
      // Check if daily spend exceeds threshold
      const result = await db.query(
        `
        SELECT SUM(cost) as total_cost
        FROM api_calls
        WHERE user_id = $1
          AND timestamp >= $2
        `,
        [alert.userId, now - 24 * 60 * 60 * 1000]
      );

      const totalCost = parseFloat(result.rows[0]?.total_cost || 0);
      return totalCost >= alert.threshold;
    }

    case 'hourly_spike': {
      // Check if hourly spend is abnormally high
      const result = await db.query(
        `
        SELECT SUM(cost) as total_cost
        FROM api_calls
        WHERE user_id = $1
          AND timestamp >= $2
        `,
        [alert.userId, now - 60 * 60 * 1000]
      );

      const hourlyCost = parseFloat(result.rows[0]?.total_cost || 0);
      return hourlyCost >= alert.threshold;
    }

    case 'error_rate': {
      // Check if error rate exceeds threshold
      const result = await db.query(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM api_calls
        WHERE user_id = $1
          AND timestamp >= $2
        `,
        [alert.userId, now - 60 * 60 * 1000]
      );

      const { total, errors } = result.rows[0];
      if (total === 0) return false;

      const errorRate = (errors / total) * 100;
      return errorRate >= alert.threshold;
    }

    default:
      return false;
  }
}

/**
 * Trigger an alert
 */
async function triggerAlert(alert: Alert): Promise<void> {
  console.log(`🚨 Triggering alert: ${alert.name} (${alert.type})`);

  // Get alert details
  const details = await getAlertDetails(alert);

  // Send to all channels
  for (const channel of alert.channels) {
    try {
      if (channel.type === 'email') {
        await sendEmailAlert(channel.value!, alert, details);
      } else if (channel.type === 'slack') {
        await sendSlackAlert(channel.webhook!, alert, details);
      }
    } catch (error) {
      console.error(`Failed to send alert to ${channel.type}:`, error);
    }
  }

  // Update last triggered timestamp
  await db.query(
    'UPDATE alerts SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1',
    [alert.id]
  );
}

/**
 * Get alert details for notification
 */
async function getAlertDetails(alert: Alert): Promise<any> {
  const now = Date.now();
  const timeWindow = getTimeWindow(alert.type);

  const result = await db.query(
    `
    SELECT 
      SUM(cost) as total_cost,
      COUNT(*) as total_calls,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
    FROM api_calls
    WHERE user_id = $1
      AND timestamp >= $2
    `,
    [alert.userId, now - timeWindow]
  );

  return result.rows[0];
}

/**
 * Send email alert via SendGrid
 */
async function sendEmailAlert(
  email: string,
  alert: Alert,
  details: any
): Promise<void> {
  console.log(`📧 Sending email alert to ${email}`);
  
  const { total_cost, total_calls, errors } = details;
  
  try {
    if (alert.type === 'daily_budget') {
      await sendAlert({
        to: email,
        subject: `Budget Alert: $${parseFloat(total_cost).toFixed(2)}`,
        type: 'budget_exceeded',
        data: {
          threshold: alert.threshold,
          actual: parseFloat(total_cost),
          timeRange: 'daily',
          projectName: alert.name,
        },
      });
    } else if (alert.type === 'hourly_spike') {
      await sendAlert({
        to: email,
        subject: `Cost Spike: $${parseFloat(total_cost).toFixed(2)}`,
        type: 'cost_spike',
        data: {
          actual: parseFloat(total_cost),
          timeRange: 'hourly',
          projectName: alert.name,
        },
      });
    } else if (alert.type === 'error_rate') {
      const errorRate = total_calls > 0 ? (errors / total_calls) * 100 : 0;
      await sendAlert({
        to: email,
        subject: `Error Rate Alert: ${errorRate.toFixed(1)}%`,
        type: 'error_rate',
        data: {
          threshold: alert.threshold,
          actual: errorRate,
          timeRange: 'hourly',
          projectName: alert.name,
        },
      });
    }
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(
  webhook: string,
  alert: Alert,
  details: any
): Promise<void> {
  console.log(`📢 Sending Slack alert to ${webhook}`);

  const message = formatAlertMessage(alert, details);

  await axios.post(webhook, {
    text: `🚨 *APImetrics Alert*`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 ${alert.name}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Alert Type: \`${alert.type}\` | Threshold: ${alert.threshold}`,
          },
        ],
      },
    ],
  });
}

/**
 * Format alert message
 */
function formatAlertMessage(alert: Alert, details: any): string {
  const { total_cost, total_calls, errors } = details;

  switch (alert.type) {
    case 'daily_budget':
      return `Your daily API spending has reached *$${parseFloat(total_cost).toFixed(2)}*, exceeding your threshold of $${alert.threshold}.\n\n` +
             `Total calls: ${total_calls}\n` +
             `Consider reviewing your usage or adjusting your budget.`;

    case 'hourly_spike':
      return `Unusual spike detected! API costs reached *$${parseFloat(total_cost).toFixed(2)}* in the last hour, exceeding your threshold of $${alert.threshold}.\n\n` +
             `Total calls: ${total_calls}\n` +
             `This may indicate an issue or unexpected usage pattern.`;

    case 'error_rate':
      const errorRate = total_calls > 0 ? (errors / total_calls) * 100 : 0;
      return `High error rate detected! *${errorRate.toFixed(1)}%* of API calls are failing (${errors}/${total_calls}), exceeding your threshold of ${alert.threshold}%.\n\n` +
             `Please check your API configuration and error logs.`;

    default:
      return `Alert triggered: ${alert.name}`;
  }
}

/**
 * Get time window for alert type
 */
function getTimeWindow(type: string): number {
  switch (type) {
    case 'daily_budget':
      return 24 * 60 * 60 * 1000;
    case 'hourly_spike':
    case 'error_rate':
      return 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

/**
 * Background job: Check all alerts
 */
export async function checkAllAlerts(): Promise<void> {
  try {
    // Get all users with enabled alerts
    const result = await db.query(
      'SELECT DISTINCT user_id FROM alerts WHERE enabled = true'
    );

    for (const row of result.rows) {
      await checkAlerts(row.user_id);
    }
  } catch (error) {
    console.error('Failed to check alerts:', error);
  }
}
