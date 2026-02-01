# 🎉 New API Providers Added!

APImetrics now supports **4 major AI providers**:

## Supported APIs

### 1. **OpenAI** ✅
- GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- Full support with accurate cost tracking

### 2. **Anthropic** ✅
- Claude Opus 4, Sonnet 4, Sonnet 3.5, Haiku 3.5
- Full support with accurate cost tracking

### 3. **Google Gemini** 🆕
- Gemini Pro, Pro Vision, 1.5 Pro, 1.5 Flash
- Native API wrapper with cost tracking
- **Pricing:** Starting at $0.075 per 1M tokens (Flash)

### 4. **Kimi (Moonshot AI)** 🆕
- Moonshot v1-8k, v1-32k, v1-128k
- Chinese AI platform support
- **Pricing:** Starting at $0.10 per 1M tokens
- Great for multilingual applications

## Usage Examples

All providers follow the same simple pattern:

```typescript
import { APImetricsClient, GeminiWrapper } from '@apimetrics/sdk';

const tracker = new APImetricsClient({ apiKey: 'apim_...' });
const client = new GeminiWrapper({ apiKey: '...' }, tracker);

const response = await client.generateContent({ ... });
// ✨ Costs tracked automatically!
```

## Documentation

- **Provider Integration Guide:** `sdk/ADDING_PROVIDERS.md`
- **Pricing Calculator:** `sdk/src/utils/pricing.ts`
- **Frontend Examples:** https://apimetrics.vercel.app/settings

## Adding More Providers

Want support for another API? It's easy!

1. Read `sdk/ADDING_PROVIDERS.md`
2. Create a wrapper in `sdk/src/providers/`
3. Add pricing info
4. Export from `src/index.ts`

Pull requests welcome! 🚀

## Roadmap

Coming soon:
- Cohere
- Mistral AI
- Together AI
- Replicate
- Groq
- DeepSeek
- More...

---

**Built today:** Feb 1, 2026  
**Status:** Production ready ✅  
**Live:** https://apimetrics.vercel.app
