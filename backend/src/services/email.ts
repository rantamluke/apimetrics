/**
 * Email service using SendGrid
 */

import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'alerts@apimetrics.dev';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'APImetrics';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailAlert {
  to: string;
  subject: string;
  type: 'budget_exceeded' | 'cost_spike' | 'error_rate';
  data: {
    threshold?: number;
    actual?: number;
    timeRange?: string;
    projectName?: string;
    [key: string]: any;
  };
}

/**
 * Send budget exceeded alert
 */
export async function sendBudgetAlert(alert: EmailAlert): Promise<void> {
  const { to, data } = alert;
  const { threshold, actual, timeRange, projectName } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .metric { font-size: 32px; font-weight: bold; color: #dc2626; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Budget Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your API costs have exceeded the threshold</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">Budget Exceeded</h2>
        <p>Your ${projectName || 'project'} has exceeded its ${timeRange || 'daily'} budget limit.</p>
        
        <div style="margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong>Budget Threshold:</strong> $${threshold?.toFixed(2)}
          </div>
          <div>
            <strong>Current Spending:</strong> <span class="metric">$${actual?.toFixed(2)}</span>
          </div>
        </div>
        
        <p>Consider reviewing your usage or adjusting your budget limits.</p>
      </div>
      
      <a href="https://apimetrics.dev/dashboard" class="button">View Dashboard →</a>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <h3>What you can do:</h3>
        <ul>
          <li>Review recent API calls in your dashboard</li>
          <li>Check for any unexpected spikes in usage</li>
          <li>Consider switching to cheaper models for non-critical tasks</li>
          <li>Set up rate limiting to control costs</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you set up budget alerts for your APImetrics account.</p>
      <p><a href="https://apimetrics.dev/settings/alerts">Manage alert settings</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `⚠️ Budget Alert: $${actual?.toFixed(2)} / $${threshold?.toFixed(2)}`,
    html,
  };

  if (!SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping email send');
    console.log('[Email] Would send:', msg.subject, 'to', to);
    return;
  }

  try {
    await sgMail.send(msg);
    console.log(`[Email] Budget alert sent to ${to}`);
  } catch (error) {
    console.error('[Email] Failed to send budget alert:', error);
    throw error;
  }
}

/**
 * Send cost spike alert
 */
export async function sendCostSpikeAlert(alert: EmailAlert): Promise<void> {
  const { to, data } = alert;
  const { actual, timeRange, projectName } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .metric { font-size: 32px; font-weight: bold; color: #dc2626; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📈 Cost Spike Detected</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Unusual increase in API costs</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">Unusual Activity</h2>
        <p>We detected a significant spike in your ${projectName || 'project'}'s API costs.</p>
        
        <div style="margin: 20px 0;">
          <div>
            <strong>${timeRange || 'Hourly'} Cost:</strong> <span class="metric">$${actual?.toFixed(2)}</span>
          </div>
        </div>
        
        <p>This is significantly higher than your typical usage pattern.</p>
      </div>
      
      <a href="https://apimetrics.dev/dashboard" class="button">Investigate Now →</a>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <h3>Recommended actions:</h3>
        <ul>
          <li>Check for any runaway processes or infinite loops</li>
          <li>Review recent code deployments</li>
          <li>Verify API key hasn't been compromised</li>
          <li>Check for unusual traffic patterns</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you set up spike alerts for your APImetrics account.</p>
      <p><a href="https://apimetrics.dev/settings/alerts">Manage alert settings</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `📈 Cost Spike Alert: $${actual?.toFixed(2)} in ${timeRange || '1 hour'}`,
    html,
  };

  if (!SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping email send');
    console.log('[Email] Would send:', msg.subject, 'to', to);
    return;
  }

  try {
    await sgMail.send(msg);
    console.log(`[Email] Cost spike alert sent to ${to}`);
  } catch (error) {
    console.error('[Email] Failed to send cost spike alert:', error);
    throw error;
  }
}

/**
 * Send error rate alert
 */
export async function sendErrorRateAlert(alert: EmailAlert): Promise<void> {
  const { to, data } = alert;
  const { threshold, actual, timeRange, projectName } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .metric { font-size: 32px; font-weight: bold; color: #dc2626; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 High Error Rate</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your API calls are failing</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">Error Rate Exceeded</h2>
        <p>Your ${projectName || 'project'} is experiencing a high error rate.</p>
        
        <div style="margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong>Threshold:</strong> ${threshold}%
          </div>
          <div>
            <strong>Current Error Rate:</strong> <span class="metric">${actual}%</span>
          </div>
        </div>
        
        <p>Immediate action may be required to restore service.</p>
      </div>
      
      <a href="https://apimetrics.dev/dashboard" class="button">View Errors →</a>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <h3>Common causes:</h3>
        <ul>
          <li>Invalid API keys or authentication issues</li>
          <li>Rate limits exceeded</li>
          <li>Malformed requests or invalid parameters</li>
          <li>Provider service disruptions</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you set up error alerts for your APImetrics account.</p>
      <p><a href="https://apimetrics.dev/settings/alerts">Manage alert settings</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `🚨 Error Rate Alert: ${actual}% (threshold: ${threshold}%)`,
    html,
  };

  if (!SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping email send');
    console.log('[Email] Would send:', msg.subject, 'to', to);
    return;
  }

  try {
    await sgMail.send(msg);
    console.log(`[Email] Error rate alert sent to ${to}`);
  } catch (error) {
    console.error('[Email] Failed to send error rate alert:', error);
    throw error;
  }
}

/**
 * Main email dispatcher
 */
export async function sendAlert(alert: EmailAlert): Promise<void> {
  switch (alert.type) {
    case 'budget_exceeded':
      return sendBudgetAlert(alert);
    case 'cost_spike':
      return sendCostSpikeAlert(alert);
    case 'error_rate':
      return sendErrorRateAlert(alert);
    default:
      throw new Error(`Unknown alert type: ${alert.type}`);
  }
}
