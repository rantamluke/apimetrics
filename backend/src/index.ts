/**
 * APImetrics Backend API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { trackRouter } from './routes/track';
import { analyticsRouter } from './routes/analytics';
import { authRouter } from './routes/auth';
import { alertsRouter } from './routes/alerts';
import { errorHandler } from './middleware/errorHandler';
import { checkAllAlerts } from './services/alerts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/v1/auth', authRouter);
app.use('/v1/track', trackRouter);
app.use('/v1/analytics', analyticsRouter);
app.use('/v1/alerts', alertsRouter);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 APImetrics backend running on port ${PORT}`);
});

// Start alert checker (every 5 minutes)
setInterval(() => {
  checkAllAlerts().catch(console.error);
}, 5 * 60 * 1000);

// Run once on startup
checkAllAlerts().catch(console.error);
