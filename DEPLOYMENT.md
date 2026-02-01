# 🚀 APImetrics Deployment Guide

Complete guide for deploying APImetrics to production.

---

## 📋 Prerequisites

- [ ] Railway or Render account (for backend)
- [ ] Vercel account (for frontend)
- [ ] SendGrid account (for emails)
- [ ] Domain name (apimetrics.dev)
- [ ] PostgreSQL database (provided by Railway/Render)

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

**On Railway:**
```bash
# Railway will auto-create database
# Just get the DATABASE_URL from the dashboard
```

**On Render:**
```bash
# Create PostgreSQL instance via Render dashboard
# Copy the Internal Database URL
```

### 2. Run Migrations

```bash
# Get database URL from your deployment platform
export DATABASE_URL="postgresql://..."

# Run schema
psql $DATABASE_URL < backend/src/db/schema.sql
```

---

## 🔧 Backend Deployment

### Option A: Railway (Recommended)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Create Project:**
```bash
cd backend
railway init
railway link
```

3. **Set Environment Variables:**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set SENDGRID_API_KEY=SG.your-key-here
railway variables set SENDGRID_FROM_EMAIL=alerts@apimetrics.dev
railway variables set CORS_ORIGIN=https://apimetrics.dev
```

4. **Deploy:**
```bash
git push railway main
# or
railway up
```

5. **Get URL:**
```bash
railway domain
# Copy the URL (e.g., https://apimetrics-backend.railway.app)
```

### Option B: Render

1. **Connect Repository:**
   - Go to Render dashboard
   - New → Web Service
   - Connect GitHub repo

2. **Configure:**
   - Name: `apimetrics-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Region: Frankfurt (closest to users)

3. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (auto-populated from database)
   - `JWT_SECRET` = (generate random string)
   - `SENDGRID_API_KEY` = (from SendGrid)
   - `SENDGRID_FROM_EMAIL` = `alerts@apimetrics.dev`
   - `CORS_ORIGIN` = `https://apimetrics.dev`

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment

### Option C: Docker (Any Platform)

```bash
cd backend

# Build image
docker build -t apimetrics-backend .

# Run locally to test
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e SENDGRID_API_KEY="..." \
  apimetrics-backend

# Push to registry
docker tag apimetrics-backend your-registry/apimetrics-backend
docker push your-registry/apimetrics-backend
```

---

## 🎨 Frontend Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
vercel login
```

2. **Configure Environment:**
```bash
cd frontend
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Set Environment Variables on Vercel:**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter your backend URL
```

5. **Configure Domain:**
   - Go to Vercel dashboard
   - Settings → Domains
   - Add `apimetrics.dev` and `www.apimetrics.dev`
   - Update DNS records as instructed

---

## 📧 Email Service (SendGrid)

### 1. Create SendGrid Account

- Go to [sendgrid.com](https://sendgrid.com)
- Sign up for free tier (100 emails/day)

### 2. Create API Key

- Settings → API Keys → Create API Key
- Name: `apimetrics-production`
- Permissions: Full Access (or Mail Send only)
- Copy the key (starts with `SG.`)

### 3. Verify Sender

- Settings → Sender Authentication
- Verify domain `apimetrics.dev`
- Or verify email `alerts@apimetrics.dev`

### 4. Test Email

```bash
cd backend
export SENDGRID_API_KEY="SG.your-key-here"
export SENDGRID_FROM_EMAIL="alerts@apimetrics.dev"

# Create a test script
node -e "
  const { sendAlert } = require('./dist/services/email');
  sendAlert({
    to: 'your-email@example.com',
    type: 'budget_exceeded',
    subject: 'Test Alert',
    data: {
      threshold: 10,
      actual: 15,
      timeRange: 'daily',
      projectName: 'Test Project'
    }
  }).then(() => console.log('Sent!')).catch(console.error);
"
```

---

## 🌐 DNS Configuration

### Domain Setup (apimetrics.dev)

**Frontend (Vercel):**
```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

**Backend (Railway/Render):**
```
CNAME api     your-backend.railway.app
```

**Email (SendGrid):**
```
CNAME em123   u123456.wl123.sendgrid.net
CNAME s1._domainkey   s1.domainkey.u123456.wl123.sendgrid.net
CNAME s2._domainkey   s2.domainkey.u123456.wl123.sendgrid.net
```

---

## 🧪 Post-Deployment Testing

### 1. Backend Health Check

```bash
curl https://api.apimetrics.dev/health
# Should return: {"status":"ok","timestamp":...}
```

### 2. Frontend Check

```bash
curl -I https://apimetrics.dev
# Should return: 200 OK
```

### 3. End-to-End Test

```bash
# 1. Create account at https://apimetrics.dev/signup
# 2. Get API key from dashboard
# 3. Test SDK:

npm install @apimetrics/sdk

# test.js
const { APImetricsClient } = require('@apimetrics/sdk');

const client = new APImetricsClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.apimetrics.dev',
});

client.track({
  id: 'test-call-123',
  provider: 'openai',
  model: 'gpt-4o',
  endpoint: '/v1/chat/completions',
  timestamp: Date.now(),
  inputTokens: 100,
  outputTokens: 50,
  cost: 0.001,
  latency: 1200,
  status: 'success',
}).then(() => console.log('Tracked!'));

# 4. Check dashboard - should see the call
```

### 4. Alert Test

```bash
# 1. Go to https://apimetrics.dev/alerts
# 2. Create a budget alert with low threshold ($0.01)
# 3. Track a few API calls
# 4. Wait 5 minutes (alert check interval)
# 5. Check your email for alert
```

---

## 📊 Monitoring

### Backend Logs

**Railway:**
```bash
railway logs
```

**Render:**
- Dashboard → Logs tab

### Frontend Logs

**Vercel:**
```bash
vercel logs
```

### Database Monitoring

```bash
# Check table sizes
psql $DATABASE_URL -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check row counts
psql $DATABASE_URL -c "
  SELECT 
    'users' as table, COUNT(*) as rows FROM users
  UNION ALL
  SELECT 'api_calls', COUNT(*) FROM api_calls
  UNION ALL
  SELECT 'alerts', COUNT(*) FROM alerts;
"
```

---

## 🔄 CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Deploy Backend
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Deploy Frontend
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 🔐 Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Set secure CORS origins
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable database backups
- [ ] Set up error tracking (Sentry)
- [ ] Enable rate limiting
- [ ] Rotate API keys regularly
- [ ] Monitor for suspicious activity

---

## 💰 Cost Estimation

### Monthly Costs (Estimated)

**Backend (Railway Starter):**
- $5/month for 500MB RAM, 1GB disk

**Database (Railway/Render):**
- $0-15/month (free tier → paid)

**Frontend (Vercel):**
- $0/month (Hobby plan)

**Email (SendGrid):**
- $0-15/month (free tier → Essentials)

**Domain:**
- $12/year for .dev domain

**Total:** ~$20-50/month

---

## 📞 Support

**Issues during deployment?**

1. Check logs: `railway logs` or Render dashboard
2. Verify environment variables are set correctly
3. Test database connection
4. Check DNS propagation (can take up to 48h)

**Still stuck?**
- Open GitHub issue
- Check deployment platform docs
- Contact support@apimetrics.dev

---

## ✅ Deployment Checklist

- [ ] Database created and migrated
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] DNS configured
- [ ] SendGrid configured and verified
- [ ] Environment variables set
- [ ] End-to-end test passed
- [ ] Monitoring set up
- [ ] SSL certificates active
- [ ] Backups configured
- [ ] Alert system tested

---

**Ready to launch!** 🚀
