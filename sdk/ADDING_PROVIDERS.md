# Adding New API Providers

This guide explains how to add support for new AI API providers to APImetrics.

## Quick Steps

1. Create a new wrapper file in `src/providers/`
2. Implement the wrapper class
3. Add pricing information to `src/utils/pricing.ts`
4. Export the wrapper from `src/index.ts`
5. Test it!

## Step-by-Step Example: Adding Google Gemini

### 1. Create Wrapper (`src/providers/gemini.ts`)

```typescript
import { APImetricsClient } from '../client';
import { APICall } from '../types';

export class GeminiWrapper {
  private client: APImetricsClient;
  private geminiClient: any;

  constructor(config: any, tracker: APImetricsClient) {
    this.client = tracker;
    // Initialize the actual Gemini SDK
    this.geminiClient = config; // or new GeminiClient(config)
  }

  // Wrap the main methods
  async generateContent(params: any) {
    const startTime = Date.now();
    
    try {
      const response = await this.geminiClient.generateContent(params);
      
      // Track the call
      await this.client.track({
        provider: 'google',
        model: params.model || 'gemini-pro',
        endpoint: 'generateContent',
        inputTokens: response.usage?.promptTokens || 0,
        outputTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
        latency: Date.now() - startTime,
        status: 'success'
      });
      
      return response;
    } catch (error: any) {
      // Track errors too
      await this.client.track({
        provider: 'google',
        model: params.model || 'gemini-pro',
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
```

### 2. Add Pricing (`src/utils/pricing.ts`)

```typescript
const PRICING = {
  // ... existing providers
  google: {
    'gemini-pro': {
      input: 0.00025,  // per 1K tokens
      output: 0.0005
    },
    'gemini-pro-vision': {
      input: 0.00025,
      output: 0.0005
    }
  }
};
```

### 3. Export the Wrapper (`src/index.ts`)

```typescript
export { GeminiWrapper } from './providers/gemini';
```

### 4. Test It

```typescript
import { APImetricsClient, GeminiWrapper } from '@apimetrics/sdk';

const tracker = new APImetricsClient({ apiKey: 'apim_...' });
const gemini = new GeminiWrapper({ apiKey: '...' }, tracker);

const response = await gemini.generateContent({
  model: 'gemini-pro',
  prompt: 'Hello!'
});
```

## Provider-Specific Notes

### Free/Open APIs (like Kimi, DeepSeek)

For free APIs, set pricing to `0`:

```typescript
kimi: {
  'kimi-free': {
    input: 0,
    output: 0
  }
}
```

### APIs with Non-Standard Response Formats

Some APIs don't return token counts. You can estimate:

```typescript
// Rough estimation: ~4 chars per token
const estimatedTokens = Math.ceil(text.length / 4);
```

### Rate-Limited APIs

Add retry logic in the wrapper:

```typescript
async function callWithRetry(fn: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

## Checklist

Before submitting a new provider:

- [ ] Wrapper handles all main methods
- [ ] Tracks success and error cases
- [ ] Pricing information added (0 for free APIs)
- [ ] Exported from `src/index.ts`
- [ ] Tested with real API calls
- [ ] Documentation example added

## Common Patterns

### Streaming Responses

```typescript
async *stream(params: any) {
  const startTime = Date.now();
  let totalTokens = 0;
  
  try {
    for await (const chunk of this.client.stream(params)) {
      totalTokens += chunk.tokens || 0;
      yield chunk;
    }
    
    await this.tracker.track({
      // ... tracking data
      totalTokens
    });
  } catch (error) {
    // track error
  }
}
```

### Batch Requests

```typescript
async batchGenerate(requests: any[]) {
  const results = await Promise.all(
    requests.map(req => this.generate(req))
  );
  return results;
}
```

## Need Help?

Open an issue or PR on GitHub!
