/**
 * Unit tests for APImetrics Client
 */

import { APImetricsClient } from '../client';
import { APICall } from '../types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('APImetricsClient', () => {
  let client: APImetricsClient;
  let mockPost: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios.create to return an object with post method
    mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
    mockedAxios.create.mockReturnValue({
      post: mockPost,
    } as any);

    client = new APImetricsClient({
      apiKey: 'test-api-key',
      endpoint: 'https://test.example.com',
      flushInterval: 100, // Short interval for testing
    });
  });

  afterEach(async () => {
    // Cleanup
    await client.shutdown();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test.example.com',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use default endpoint if not provided', () => {
      const defaultClient = new APImetricsClient({ apiKey: 'test-key' });
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.apimetrics.dev',
        })
      );
      
      defaultClient.shutdown();
    });
  });

  describe('track', () => {
    const mockCall: APICall = {
      id: 'call-123',
      provider: 'openai',
      model: 'gpt-4o',
      endpoint: '/v1/chat/completions',
      timestamp: Date.now(),
      inputTokens: 100,
      outputTokens: 50,
      cost: 0.001,
      latency: 1200,
      status: 'success',
    };

    it('should add call to queue', async () => {
      await client.track(mockCall);
      
      // Call should be queued (not flushed yet)
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should flush automatically when queue reaches 50', async () => {
      // Add 50 calls
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(client.track({ ...mockCall, id: `call-${i}` }));
      }
      await Promise.all(promises);

      // Should have flushed
      expect(mockPost).toHaveBeenCalledWith('/v1/track/batch', {
        calls: expect.arrayContaining([
          expect.objectContaining({ id: 'call-0' }),
        ]),
      });
    });

    it('should include metadata and options', async () => {
      await client.track(
        { ...mockCall, metadata: { userId: 'user-123' } },
        { projectId: 'proj-456' }
      );

      // Flush manually
      await client.flush();

      expect(mockPost).toHaveBeenCalledWith('/v1/track/batch', {
        calls: expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              userId: 'user-123',
              projectId: 'proj-456',
            }),
          }),
        ]),
      });
    });
  });

  describe('flush', () => {
    it('should send batched calls to backend', async () => {
      const call1: APICall = {
        id: 'call-1',
        provider: 'openai',
        model: 'gpt-4o',
        endpoint: '/v1/chat/completions',
        timestamp: Date.now(),
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        latency: 1000,
        status: 'success',
      };

      const call2: APICall = {
        id: 'call-2',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        endpoint: '/v1/messages',
        timestamp: Date.now(),
        inputTokens: 200,
        outputTokens: 100,
        cost: 0.002,
        latency: 1500,
        status: 'success',
      };

      await client.track(call1);
      await client.track(call2);
      await client.flush();

      expect(mockPost).toHaveBeenCalledWith('/v1/track/batch', {
        calls: expect.arrayContaining([
          expect.objectContaining({ id: 'call-1' }),
          expect.objectContaining({ id: 'call-2' }),
        ]),
      });
    });

    it('should not send request when queue is empty', async () => {
      await client.flush();
      
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      const mockCall: APICall = {
        id: 'call-123',
        provider: 'openai',
        model: 'gpt-4o',
        endpoint: '/v1/chat/completions',
        timestamp: Date.now(),
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        latency: 1000,
        status: 'success',
      };

      await client.track(mockCall);
      await client.flush();

      // Should not throw
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('auto-flush', () => {
    it('should flush periodically', async () => {
      const mockCall: APICall = {
        id: 'call-auto',
        provider: 'openai',
        model: 'gpt-4o',
        endpoint: '/v1/chat/completions',
        timestamp: Date.now(),
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        latency: 1000,
        status: 'success',
      };

      await client.track(mockCall);

      // Wait for auto-flush (100ms interval + buffer)
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockPost).toHaveBeenCalledWith('/v1/track/batch', {
        calls: expect.arrayContaining([
          expect.objectContaining({ id: 'call-auto' }),
        ]),
      });
    });
  });

  describe('shutdown', () => {
    it('should flush remaining calls', async () => {
      const mockCall: APICall = {
        id: 'call-shutdown',
        provider: 'openai',
        model: 'gpt-4o',
        endpoint: '/v1/chat/completions',
        timestamp: Date.now(),
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        latency: 1000,
        status: 'success',
      };

      await client.track(mockCall);
      await client.shutdown();

      expect(mockPost).toHaveBeenCalledWith('/v1/track/batch', {
        calls: expect.arrayContaining([
          expect.objectContaining({ id: 'call-shutdown' }),
        ]),
      });
    });
  });
});
