# 🔧 APImetrics Backend

**Node.js API for tracking and analyzing AI API costs.**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Setup database

```bash
# Create PostgreSQL database
createdb apimetrics

# Run migrations
psql apimetrics < src/db/schema.sql
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Auth

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `GET /v1/auth/me` - Get current user
- `GET /v1/auth/keys` - List API keys
- `POST /v1/auth/keys` - Create API key
- `DELETE /v1/auth/keys/:id` - Delete API key

### Tracking

- `POST /v1/track/batch` - Track batch of API calls

### Analytics

- `GET /v1/analytics/overview` - Dashboard overview
- `GET /v1/analytics/timeseries` - Time series data
- `GET /v1/analytics/top-expensive` - Most expensive calls
- `GET /v1/analytics/recommendations` - Cost optimization tips

## Authentication

**Bearer token (JWT):**
```
Authorization: Bearer eyJhbGc...
```

**API Key:**
```
Authorization: Bearer apim_abc123...
```

## Tech Stack

- Node.js + Express
- PostgreSQL
- TypeScript
- Zod (validation)
- JWT (auth)
