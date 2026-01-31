/**
 * Anthropic Wrapper - Track Anthropic API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { APImetricsClient } from '../client';
import { APICall, TrackingOptions } from '../types';
import { calculateAnthropicCost } from '../utils/pricing';

export class AnthropicWrapper extends Anthropic {
  private tracker: APImetricsClient;
  private trackingOptions?: TrackingOptions;

  constructor(
    config: ConstructorParameters<typeof Anthropic>[0],
    tracker: APImetricsClient,
    trackingOptions?: TrackingOptions
  ) {
    super(config);
    this.tracker = tracker;
    this.trackingOptions = trackingOptions;

    // Wrap messages.create
    this.wrapMessages();
  }

  private wrapMessages(): void {
    const originalCreate = this.messages.create.bind(this.messages);

    this.messages.create = async (params: any, options?: any) => {
      const startTime = Date.now();
      const callId = `anthropic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        const response = await originalCreate(params, options);
        const endTime = Date.now();

        // Track the call
        const usage = response.usage;
        const cost = calculateAnthropicCost(
          params.model,
          usage?.input_tokens || 0,
          usage?.output_tokens || 0
        );

        const call: APICall = {
          id: callId,
          timestamp: startTime,
          provider: 'anthropic',
          model: params.model,
          endpoint: 'messages',
          inputTokens: usage?.input_tokens,
          outputTokens: usage?.output_tokens,
          totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
          cost: cost.totalCost,
          latency: endTime - startTime,
          status: 'success',
          metadata: {
            temperature: params.temperature,
            max_tokens: params.max_tokens,
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
          provider: 'anthropic',
          model: params.model,
          endpoint: 'messages',
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
