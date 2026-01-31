# 💰 APImetrics - AI Cost Optimizer

**Track, analyze, and optimize your AI API costs in real-time.**

## 🎯 Vision

Every AI startup is burning money on API calls. We help them see where, why, and how to save.

## 🏗️ Architecture

```
┌─────────────┐
│   SDK       │  Wraps OpenAI/Anthropic/etc calls
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │  Tracks usage, calculates costs, sends alerts
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │  Visualize costs, insights, recommendations
└─────────────┘
```

## 📦 Components

- **`/sdk`** - NPM package (TypeScript)
- **`/backend`** - Node.js API (Express + PostgreSQL)
- **`/frontend`** - Next.js dashboard
- **`/docs`** - Documentation site

## 🚀 Status

**Week 1 - MVP Development**
- [x] Project setup
- [ ] SDK wrapper (OpenAI)
- [ ] SDK wrapper (Anthropic)
- [ ] Backend API skeleton
- [ ] Database schema
- [ ] Cost calculation engine
- [ ] Basic alerts

## 💰 Business Model

- Free: Up to $100 API spend tracked
- Pro ($49/mo): Unlimited tracking + insights
- Team ($199/mo): Multi-project + advanced features

## 📅 Timeline

- **Week 1-2:** MVP build
- **Week 3:** Beta testing
- **Week 4:** ProductHunt launch

---

*Built by Nox & niQlas* 🌙
