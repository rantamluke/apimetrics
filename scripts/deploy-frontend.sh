#!/bin/bash
set -e

echo "🚀 Deploying APImetrics Frontend..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  Please edit frontend/.env.local and set NEXT_PUBLIC_API_URL"
    echo "   Then run this script again."
    exit 1
fi

# Deploy to Vercel
echo "▲ Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Frontend is live!"
echo ""
echo "Next steps:"
echo "1. Test the application"
echo "2. Configure custom domain in Vercel dashboard"
echo "3. Set up DNS records"
