#!/bin/bash

# Givy Local Development Setup Script
# Automates Supabase setup, migrations, and env configuration

set -e

echo "🎁 Setting up Givy local development environment..."

# Check prerequisites
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker"
  exit 1
fi

echo "✓ Node.js found: $(node -v)"
echo "✓ Docker found: $(docker -v)"

# Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Install Supabase CLI if needed
if ! command -v supabase &> /dev/null; then
  echo "📥 Installing Supabase CLI..."
  npm install -g supabase
fi

echo "✓ Supabase CLI ready"

# Setup .env.local
if [ ! -f .env.local ]; then
  echo ""
  echo "⚙️  Creating .env.local..."
  cp .env.example .env.local
  echo "✓ .env.local created (update with your values)"
else
  echo "✓ .env.local already exists"
fi

# Start Supabase
echo ""
echo "🚀 Starting Supabase..."
echo "(This may take a minute on first run)"
supabase start

# Extract anon key from supabase status
echo ""
echo "📋 Supabase Status:"
supabase status --local

echo ""
echo "⚠️  IMPORTANT: Update your .env.local with:"
echo "   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-above>"

# Run migrations
echo ""
read -p "Ready to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🗄️  Running migrations..."
  supabase db push
  echo "✓ Migrations applied"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with Supabase credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  supabase status --local     - Check Supabase services"
echo "  supabase logs --local       - View Supabase logs"
echo "  supabase stop               - Stop services"
echo "  npm run test                - Run unit tests"
echo "  npm run test:e2e            - Run E2E tests"
