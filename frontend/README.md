# 🎨 APImetrics Frontend

**Next.js dashboard for tracking and optimizing AI API costs.**

## Features

- 📊 **Real-time Dashboard** - Cost overview, usage stats, trends
- 📈 **Interactive Charts** - Powered by Recharts
- 💡 **Smart Recommendations** - AI-powered cost optimization tips
- 🔑 **API Key Management** - Create, view, delete keys
- 🎨 **Beautiful UI** - TailwindCSS + modern design
- 🔐 **Secure Auth** - JWT-based authentication

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Pages

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Main dashboard with analytics
- `/settings` - API key management & settings

## Tech Stack

- **Next.js 14** - App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Recharts** - Charts & visualizations
- **SWR** - Data fetching
- **Axios** - HTTP client

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── dashboard/    # Dashboard page
│   ├── login/        # Login page
│   ├── signup/       # Signup page
│   ├── settings/     # Settings page
│   └── layout.tsx    # Root layout
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── lib/              # Utilities
│   └── api.ts        # API client
└── components/       # Shared components (future)
```

## Development

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3001
```

## Deployment

**Vercel (recommended):**

```bash
vercel deploy
```

**Environment variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL

---

Built with 🌙 by Nox & niQlas
