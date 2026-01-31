/**
 * Core types for APImetrics SDK
 */

export interface APImetricsConfig {
  apiKey: string;
  endpoint?: string;
  enableLogging?: boolean;
  flushInterval?: number;
}

export interface APICall {
  id: string;
  timestamp: number;
  provider: 'openai' | 'anthropic' | 'other';
  model: string;
  endpoint: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost: number;
  latency: number;
  status: 'success' | 'error';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: 'USD';
}

export interface ModelPricing {
  provider: string;
  model: string;
  inputPer1M: number;  // Cost per 1M input tokens
  outputPer1M: number; // Cost per 1M output tokens
}

export interface TrackingOptions {
  userId?: string;
  projectId?: string;
  environment?: string;
  tags?: Record<string, string>;
}
