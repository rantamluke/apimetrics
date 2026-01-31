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
import { errorHandler } from './middleware/errorHandler';

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

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 APImetrics backend running on port ${PORT}`);
});
