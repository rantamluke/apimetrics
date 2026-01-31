/**
 * OpenAI Wrapper - Track OpenAI API calls
 */

import OpenAI from 'openai';
import { APImetricsClient } from '../client';
import { APICall, TrackingOptions } from '../types';
import { calculateOpenAICost } from '../utils/pricing';

export class OpenAIWrapper extends OpenAI {
  private tracker: APImetricsClient;
  private trackingOptions?: TrackingOptions;

  constructor(
    config: ConstructorParameters<typeof OpenAI>[0],
    tracker: APImetricsClient,
    trackingOptions?: TrackingOptions
  ) {
    super(config);
    this.tracker = tracker;
    this.trackingOptions = trackingOptions;

    // Wrap chat.completions.create
    this.wrapChatCompletions();
  }

  private wrapChatCompletions(): void {
    const originalCreate = this.chat.completions.create.bind(this.chat.completions);

    this.chat.completions.create = async (params: any, options?: any) => {
      const startTime = Date.now();
      const callId = `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        const response = await originalCreate(params, options);
        const endTime = Date.now();

        // Track the call
        const usage = response.usage;
        const cost = calculateOpenAICost(
          params.model,
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0
        );

        const call: APICall = {
          id: callId,
          timestamp: startTime,
          provider: 'openai',
          model: params.model,
          endpoint: 'chat.completions',
          inputTokens: usage?.prompt_tokens,
          outputTokens: usage?.completion_tokens,
          totalTokens: usage?.total_tokens,
          cost: cost.totalCost,
          latency: endTime - startTime,
          status: 'success',
          metadata: {
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            stream: params.stream,
          },
        };

        await this.tracker.track(call, this.trackingOptions);

        return response;
      } catch (error: any) {
        const endTime = Date.now();

        // Track failed call
        const call: APICall = {
          id: callId,
          timestamp: startTime,
          provider: 'openai',
          model: params.model,
          endpoint: 'chat.completions',
          cost: 0,
          latency: endTime - startTime,
          status: 'error',
          errorMessage: error.message,
        };

        await this.tracker.track(call, this.trackingOptions);

        throw error;
      }
    };
  }
}
