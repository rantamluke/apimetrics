/**
 * Unit tests for pricing calculations
 */

import {
  calculateOpenAICost,
  calculateAnthropicCost,
  getSupportedModels,
} from '../utils/pricing';

describe('Pricing Calculator', () => {
  describe('calculateOpenAICost', () => {
    it('should calculate cost for gpt-4o correctly', () => {
      const result = calculateOpenAICost('gpt-4o', 1000, 500);
      
      // Input: 1000 tokens @ $2.50/1M = $0.0025
      // Output: 500 tokens @ $10.00/1M = $0.005
      // Total: $0.0075
      expect(result.inputCost).toBeCloseTo(0.0025, 4);
      expect(result.outputCost).toBeCloseTo(0.005, 4);
      expect(result.totalCost).toBeCloseTo(0.0075, 4);
      expect(result.currency).toBe('USD');
    });

    it('should calculate cost for gpt-4o-mini correctly', () => {
      const result = calculateOpenAICost('gpt-4o-mini', 10000, 5000);
      
      // Input: 10000 tokens @ $0.15/1M = $0.0015
      // Output: 5000 tokens @ $0.60/1M = $0.003
      // Total: $0.0045
      expect(result.inputCost).toBeCloseTo(0.0015, 4);
      expect(result.outputCost).toBeCloseTo(0.003, 4);
      expect(result.totalCost).toBeCloseTo(0.0045, 4);
    });

    it('should handle unknown models gracefully', () => {
      const result = calculateOpenAICost('gpt-unknown', 1000, 500);
      
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should handle zero tokens', () => {
      const result = calculateOpenAICost('gpt-4o', 0, 0);
      
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should calculate large token counts correctly', () => {
      const result = calculateOpenAICost('gpt-4-turbo', 1000000, 500000);
      
      // Input: 1M tokens @ $10.00/1M = $10.00
      // Output: 500k tokens @ $30.00/1M = $15.00
      // Total: $25.00
      expect(result.inputCost).toBeCloseTo(10.0, 2);
      expect(result.outputCost).toBeCloseTo(15.0, 2);
      expect(result.totalCost).toBeCloseTo(25.0, 2);
    });
  });

  describe('calculateAnthropicCost', () => {
    it('should calculate cost for claude-sonnet-4 correctly', () => {
      const result = calculateAnthropicCost('claude-sonnet-4', 2000, 1000);
      
      // Input: 2000 tokens @ $3.00/1M = $0.006
      // Output: 1000 tokens @ $15.00/1M = $0.015
      // Total: $0.021
      expect(result.inputCost).toBeCloseTo(0.006, 4);
      expect(result.outputCost).toBeCloseTo(0.015, 4);
      expect(result.totalCost).toBeCloseTo(0.021, 4);
    });

    it('should calculate cost for claude-haiku-3.5 correctly', () => {
      const result = calculateAnthropicCost('claude-haiku-3.5', 5000, 2000);
      
      // Input: 5000 tokens @ $0.80/1M = $0.004
      // Output: 2000 tokens @ $4.00/1M = $0.008
      // Total: $0.012
      expect(result.inputCost).toBeCloseTo(0.004, 4);
      expect(result.outputCost).toBeCloseTo(0.008, 4);
      expect(result.totalCost).toBeCloseTo(0.012, 4);
    });

    it('should handle unknown models gracefully', () => {
      const result = calculateAnthropicCost('claude-unknown', 1000, 500);
      
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('getSupportedModels', () => {
    it('should return all supported models', () => {
      const models = getSupportedModels();
      
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.provider && m.model && m.inputPer1M && m.outputPer1M)).toBe(true);
    });

    it('should include both OpenAI and Anthropic models', () => {
      const models = getSupportedModels();
      
      const openaiModels = models.filter(m => m.provider === 'openai');
      const anthropicModels = models.filter(m => m.provider === 'anthropic');
      
      expect(openaiModels.length).toBeGreaterThan(0);
      expect(anthropicModels.length).toBeGreaterThan(0);
    });
  });
});
