/**
 * Pricing utilities - Calculate API costs
 */

import { CostCalculation, ModelPricing } from '../types';

/**
 * OpenAI pricing (as of Jan 2025)
 * Prices per 1M tokens
 */
const OPENAI_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    inputPer1M: 2.50,
    outputPer1M: 10.00,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    inputPer1M: 10.00,
    outputPer1M: 30.00,
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    inputPer1M: 0.50,
    outputPer1M: 1.50,
  },
};

/**
 * Anthropic pricing (as of Jan 2025)
 * Prices per 1M tokens
 */
const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4': {
    provider: 'anthropic',
    model: 'claude-opus-4',
    inputPer1M: 15.00,
    outputPer1M: 75.00,
  },
  'claude-sonnet-4': {
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-sonnet-3.5': {
    provider: 'anthropic',
    model: 'claude-sonnet-3.5',
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-haiku-3.5': {
    provider: 'anthropic',
    model: 'claude-haiku-3.5',
    inputPer1M: 0.80,
    outputPer1M: 4.00,
  },
};

/**
 * Google Gemini pricing (as of Jan 2025)
 * Prices per 1M tokens
 */
const GOOGLE_PRICING: Record<string, ModelPricing> = {
  'gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
    inputPer1M: 0.25,
    outputPer1M: 0.50,
  },
  'gemini-pro-vision': {
    provider: 'google',
    model: 'gemini-pro-vision',
    inputPer1M: 0.25,
    outputPer1M: 0.50,
  },
  'gemini-1.5-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro',
    inputPer1M: 1.25,
    outputPer1M: 2.50,
  },
  'gemini-1.5-flash': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    inputPer1M: 0.075,
    outputPer1M: 0.30,
  },
};

/**
 * Kimi/Moonshot pricing (as of Jan 2025)
 * Prices per 1M tokens
 */
const MOONSHOT_PRICING: Record<string, ModelPricing> = {
  'moonshot-v1-8k': {
    provider: 'moonshot',
    model: 'moonshot-v1-8k',
    inputPer1M: 0.10,
    outputPer1M: 0.10,
  },
  'moonshot-v1-32k': {
    provider: 'moonshot',
    model: 'moonshot-v1-32k',
    inputPer1M: 0.20,
    outputPer1M: 0.20,
  },
  'moonshot-v1-128k': {
    provider: 'moonshot',
    model: 'moonshot-v1-128k',
    inputPer1M: 0.50,
    outputPer1M: 0.50,
  },
};

/**
 * Calculate OpenAI call cost
 */
export function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation {
  const pricing = OPENAI_PRICING[model];
  
  if (!pricing) {
    // Unknown model - return zero cost
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  };
}

/**
 * Calculate Anthropic call cost
 */
export function calculateAnthropicCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation {
  const pricing = ANTHROPIC_PRICING[model];
  
  if (!pricing) {
    // Unknown model - return zero cost
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  };
}

/**
 * Calculate Google Gemini call cost
 */
export function calculateGoogleCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation {
  const pricing = GOOGLE_PRICING[model];
  
  if (!pricing) {
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  };
}

/**
 * Calculate Moonshot/Kimi call cost
 */
export function calculateMoonshotCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation {
  const pricing = MOONSHOT_PRICING[model];
  
  if (!pricing) {
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  };
}

/**
 * Get all supported models
 */
export function getSupportedModels(): ModelPricing[] {
  return [
    ...Object.values(OPENAI_PRICING),
    ...Object.values(ANTHROPIC_PRICING),
    ...Object.values(GOOGLE_PRICING),
    ...Object.values(MOONSHOT_PRICING),
  ];
}
