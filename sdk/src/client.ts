/**
 * APImetrics Client - Core tracking logic
 */

import axios, { AxiosInstance } from 'axios';
import { APImetricsConfig, APICall, TrackingOptions } from './types';

export class APImetricsClient {
  private config: APImetricsConfig;
  private httpClient: AxiosInstance;
  private callQueue: APICall[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: APImetricsConfig) {
    this.config = {
      endpoint: 'https://api.apimetrics.dev',
      enableLogging: false,
      flushInterval: 5000, // 5 seconds
      ...config,
    };

    this.httpClient = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.startAutoFlush();
  }

  /**
   * Track an API call
   */
  async track(call: APICall, options?: TrackingOptions): Promise<void> {
    const enrichedCall = {
      ...call,
      metadata: {
        ...call.metadata,
        ...options,
      },
    };

    this.callQueue.push(enrichedCall);

    if (this.config.enableLogging) {
      console.log('[APImetrics] Tracked call:', call.id, `$${call.cost.toFixed(4)}`);
    }

    // Flush immediately if queue is large
    if (this.callQueue.length >= 50) {
      await this.flush();
    }
  }

  /**
   * Flush queued calls to backend
   */
  async flush(): Promise<void> {
    if (this.callQueue.length === 0) return;

    const batch = this.callQueue.splice(0);

    try {
      await this.httpClient.post('/v1/track/batch', {
        calls: batch,
      });

      if (this.config.enableLogging) {
        console.log(`[APImetrics] Flushed ${batch.length} calls`);
      }
    } catch (error) {
      console.error('[APImetrics] Failed to flush calls:', error);
      // Re-add to queue (with limit to avoid infinite growth)
      if (this.callQueue.length < 1000) {
        this.callQueue.unshift(...batch);
      }
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush and flush remaining calls
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}
