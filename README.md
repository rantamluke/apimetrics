# 💰 APImetrics - AI API Cost Optimizer

**Track, analyze, and optimize your AI API costs in real-time.**

---

## 🎯 What is APImetrics?

Every AI startup is burning money on API calls to OpenAI, Anthropic, and other providers. APImetrics helps you:

- 📊 **Track every API call** with detailed cost breakdowns
- 💡 **Get smart recommendations** to optimize costs
- 🔔 **Receive alerts** when costs spike or errors occur
- 📈 **Visualize trends** with beautiful interactive charts

---

## ⚡ Quick Start

### 1. Install the SDK

```bash
npm install @apimetrics/sdk
```

### 2. Wrap your API client

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
  tracker
);

// Use normally - costs tracked automatically! 🎯
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

That's it! Every API call is now tracked.

---

## 🏗️ Architecture

```
┌─────────────┐
│     SDK     │  Wraps OpenAI/Anthropic calls
└──────┬──────┘
       │ (batched every 5s)
       ▼
┌─────────────┐
│   Backend   │  Tracks usage, calculates costs
│  (Node.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │  Visualize costs & insights
│  (Next.js)  │
└─────────────┘
```

---

## 📦 Project Structure

```
apimetrics/
├── sdk/              # NPM package - Drop-in SDK
│   ├── src/
│   │   ├── client.ts         # Core tracking client
│   │   ├── providers/        # OpenAI & Anthropic wrappers
│   │   └── utils/            # Pricing calculator
│   └── README.md
│
├── backend/          # Express API - Node.js + PostgreSQL
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Alert service
│   │   ├── middleware/       # Auth & error handling
│   │   └── db/               # Database schema & queries
│   └── README.md
│
├── frontend/         # Next.js Dashboard - React + TailwindCSS
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── contexts/         # Auth context
│   │   └── lib/              # API client
│   └── README.md
│
├── STATUS.md         # Build progress tracker
└── LAUNCH_PLAN.md    # Complete launch strategy
```

---

## ✨ Features

### Core Functionality
- ✅ **Drop-in SDK** - Replace OpenAI/Anthropic clients with 2 lines
- ✅ **Auto-tracking** - Every API call tracked automatically
- ✅ **Real-time costs** - See costs immediately
- ✅ **Token usage** - Input/output token breakdown
- ✅ **Error tracking** - Failed calls are tracked too

### Analytics
- ✅ **Interactive dashboard** - Charts, graphs, time series
- ✅ **Cost breakdown** - By provider, model, time period
- ✅ **Performance metrics** - Latency, success rate
- ✅ **Top expensive calls** - Find your cost outliers

### Alerts
- ✅ **Daily budget alerts** - Get notified when spending exceeds threshold
- ✅ **Hourly spike detection** - Catch unusual cost spikes
- ✅ **Error rate alerts** - Know when API calls are failing
- ✅ **Multi-channel** - Email & Slack webhooks

### Recommendations
- ✅ **AI-powered insights** - Suggestions to reduce costs
- ✅ **Model optimization** - When to use cheaper models
- ✅ **Cost projections** - Predict future spending

---

## 🚀 Tech Stack

**SDK:**
- TypeScript
- OpenAI SDK
- Anthropic SDK

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT authentication
- Background jobs

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Recharts

---

## 💰 Pricing

### Free Tier
- Track up to $100 API spend/month
- 7 day data retention
- Basic analytics
- Email alerts

### Pro - $49/mo
- Unlimited tracking
- 90 day retention
- Advanced insights
- Slack integration
- Priority support

### Team - $199/mo
- Everything in Pro
- Multi-project support
- 1 year retention
- Custom alerts
- Team collaboration

---

## 📊 Status

**MVP Progress:** 85% Complete

**What's Done:**
- ✅ SDK (OpenAI + Anthropic)
- ✅ Backend API (Auth, Tracking, Analytics, Alerts)
- ✅ Frontend Dashboard (Complete UI)
- ✅ Database Schema
- ✅ Alert System

**What's Next:**
- [ ] Unit tests
- [ ] Deploy to production
- [ ] ProductHunt launch
- [ ] Beta user onboarding

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

**1. Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL and JWT_SECRET
psql apimetrics < src/db/schema.sql
npm run dev
```

**2. Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure NEXT_PUBLIC_API_URL
npm run dev
```

**3. SDK (for testing):**
```bash
cd sdk
npm install
npm run build
```

---

## 📖 Documentation

- [SDK Documentation](./sdk/README.md)
- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Launch Plan](./LAUNCH_PLAN.md)

---

## 🤝 Contributing

This is currently a private project. After launch, we may open-source parts of it.

---

## 📝 License

Proprietary - © 2026 APImetrics

---

## 👥 Team

Built with 🌙 by **Nox & niQlas**

---

## 🎯 Roadmap

### Phase 1 - MVP (Week 1-2) ✅
- Core SDK
- Backend API
- Dashboard UI
- Alert system

### Phase 2 - Launch (Week 3)
- Testing & polish
- Deploy to production
- ProductHunt launch
- Beta users

### Phase 3 - Growth (Month 2-3)
- More AI providers (Google, Cohere)
- Team collaboration
- Billing system (Stripe)
- Advanced analytics

### Phase 4 - Scale (Month 4-6)
- Mobile app
- White-label solution
- Enterprise tier
- ML-powered insights

---

**Ready to optimize your AI API costs?**

[Get Started](https://apimetrics.dev) | [Documentation](./docs) | [Launch Plan](./LAUNCH_PLAN.md)
