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
 * Get all supported models
 */
export function getSupportedModels(): ModelPricing[] {
  return [
    ...Object.values(OPENAI_PRICING),
    ...Object.values(ANTHROPIC_PRICING),
  ];
}
