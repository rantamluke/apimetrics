/**
 * Google Gemini API Wrapper
 */

import { APImetricsClient } from '../client';

export class GeminiWrapper {
  private tracker: APImetricsClient;
  private apiKey: string;
  private baseURL: string;

  constructor(config: { apiKey: string; baseURL?: string }, tracker: APImetricsClient) {
    this.tracker = tracker;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1';
  }

  async generateContent(params: {
    model: string;
    contents: any[];
    generationConfig?: any;
  }) {
    const startTime = Date.now();
    const model = params.model || 'gemini-pro';

    try {
      const response = await fetch(
        `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: params.contents,
            generationConfig: params.generationConfig
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token usage
      const inputTokens = data.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

      // Track the call
      await this.tracker.track({
        provider: 'google',
        model,
        endpoint: 'generateContent',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        latency: Date.now() - startTime,
        status: 'success'
      });

      return data;
    } catch (error: any) {
      await this.tracker.track({
        provider: 'google',
        model,
        endpoint: 'generateContent',
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
