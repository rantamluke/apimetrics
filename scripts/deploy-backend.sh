#!/bin/bash
set -e

echo "🚀 Deploying APImetrics Backend..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Build
echo "📦 Building backend..."
npm run build

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

# Get deployment URL
echo "✅ Deployment complete!"
echo ""
railway domain
echo ""
echo "🔗 Backend is live!"
echo ""
echo "Next steps:"
echo "1. Update NEXT_PUBLIC_API_URL in frontend/.env.local"
echo "2. Deploy frontend: ./scripts/deploy-frontend.sh"
