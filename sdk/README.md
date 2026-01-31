# 📦 @apimetrics/sdk

**Drop-in replacement for OpenAI/Anthropic SDKs with automatic cost tracking.**

## Installation

```bash
npm install @apimetrics/sdk
```

## Quick Start

### OpenAI

```typescript
import { APImetricsClient, OpenAIWrapper } from '@apimetrics/sdk';

// Initialize tracker
const tracker = new APImetricsClient({
  apiKey: 'your-apimetrics-key',
});

// Use OpenAIWrapper instead of OpenAI
const openai = new OpenAIWrapper(
  {
    apiKey: process.env.OPENAI_API_KEY,
  },
  tracker,
  {
    projectId: 'my-app',
    environment: 'production',
  }
);

// Use normally - costs are tracked automatically!
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Anthropic

```typescript
import { APImetricsClient, AnthropicWrapper } from '@apimetrics/sdk';

const tracker = new APImetricsClient({
  apiKey: 'your-apimetrics-key',
});

const anthropic = new AnthropicWrapper(
  {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  tracker
);

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Features

- ✅ **Zero code changes** - Drop-in replacement
- ✅ **Automatic tracking** - Every call is tracked
- ✅ **Real-time costs** - See costs immediately
- ✅ **Batching** - Efficient data transmission
- ✅ **Error tracking** - Failed calls are tracked too
- ✅ **Metadata** - Tag calls with custom data

## Configuration

```typescript
const tracker = new APImetricsClient({
  apiKey: 'your-key',
  endpoint: 'https://api.apimetrics.dev', // optional
  enableLogging: true, // optional, for debugging
  flushInterval: 5000, // optional, milliseconds
});
```

## Tracking Options

```typescript
const openai = new OpenAIWrapper(config, tracker, {
  userId: 'user-123',
  projectId: 'my-app',
  environment: 'production',
  tags: {
    feature: 'chat',
    version: 'v2',
  },
});
```

## Shutdown

```typescript
// Flush remaining calls before exit
await tracker.shutdown();
```

## Supported Models

**OpenAI:**
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo
- gpt-3.5-turbo

**Anthropic:**
- claude-opus-4
- claude-sonnet-4
- claude-sonnet-3.5
- claude-haiku-3.5

## License

MIT
