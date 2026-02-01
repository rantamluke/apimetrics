/**
 * Kimi (Moonshot AI) API Wrapper
 * https://platform.moonshot.cn/
 */

import { APImetricsClient } from '../client';

export class KimiWrapper {
  private tracker: APImetricsClient;
  private apiKey: string;
  private baseURL: string;

  constructor(config: { apiKey: string; baseURL?: string }, tracker: APImetricsClient) {
    this.tracker = tracker;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.moonshot.cn/v1';
  }

  async chat(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }) {
    const startTime = Date.now();
    const model = params.model || 'moonshot-v1-8k';

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens
        })
      });

      if (!response.ok) {
        throw new Error(`Kimi API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token usage
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;

      // Track the call
      await this.tracker.track({
        provider: 'moonshot',
        model,
        endpoint: 'chat',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        latency: Date.now() - startTime,
        status: 'success'
      });

      return data;
    } catch (error: any) {
      await this.tracker.track({
        provider: 'moonshot',
        model,
        endpoint: 'chat',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latency: Date.now() - startTime,
        status: 'error',
        errorMessage: error.message
      });

      throw error;
    }
  }
}
