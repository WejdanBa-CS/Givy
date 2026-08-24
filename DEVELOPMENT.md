# Givy Development Guide

This guide covers setting up a local development environment for Givy with Supabase, running tests, and deploying.

## Table of Contents

- [Quick Start](#quick-start)
- [Local Supabase Setup](#local-supabase-setup)
- [Environment Configuration](#environment-configuration)
- [Running Tests](#running-tests)
- [Debugging](#debugging)
- [Database Migrations](#database-migrations)
- [Deployment](#deployment)

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for local Supabase)
- Git
- npm

### 1. Clone and Install

```bash
git clone https://github.com/WejdanBa-CS/Givy.git
cd Givy
npm install
```

### 2. Set Up Local Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase start

# This starts a local Postgres instance at:
# - API URL: http://localhost:54321
# - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (printed to console)
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local Supabase credentials:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BETA_REQUIRE_INVITE=false  # Disable for local dev
```

### 4. Run Migrations

```bash
# Run all migrations in Supabase SQL editor or via CLI:
supabase db push
```

Or manually in the Supabase dashboard:
1. Go to [http://localhost:54321/projects](http://localhost:54321/projects)
2. Select your project → SQL Editor
3. Run migrations in order from `supabase/migrations/`:
   - 001_closed_beta.sql
   - 002_support_me.sql
   - 003_security_hardening.sql
   - ... (all migrations)

### 5. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Local Supabase Setup

### Starting Services

```bash
# Start Supabase stack (Postgres, Auth, Storage, Realtime)
supabase start

# Output will show:
# - API URL: http://localhost:54321
# - Anon Key: ...
# - Service Role Key: ... (server-side only)
```

### Accessing the Dashboard

Localhost Supabase runs its own dashboard at:
- **URL:** [http://localhost:54323](http://localhost:54323)
- **Email:** test@example.com (default)
- **Password:** password (default)

### Running Migrations Locally

```bash
# Option 1: Push migrations via CLI
supabase db push

# Option 2: Via dashboard SQL editor
# - Open http://localhost:54323 → SQL Editor
# - Copy-paste each migration file in order
# - Execute

# Option 3: Reset and re-seed
supabase db reset
```

### Viewing Local Database

```bash
# Connect psql to local Postgres
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or use a GUI tool (DBeaver, pgAdmin):
# Host: localhost
# Port: 54322
# User: postgres
# Password: postgres
```

### Stopping Services

```bash
# Stop and remove containers
supabase stop

# Preserve data:
supabase stop --no-backup
```

## Environment Configuration

### Local Development (`.env.local`)

```dotenv
# Required for cloud Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # Local
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...            # From 'supabase start'
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: AI gift recommendations
OPENAI_API_KEY=sk-...      # Free option: use Groq
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant

# Optional: Closed beta
NEXT_PUBLIC_BETA_REQUIRE_INVITE=false
NEXT_PUBLIC_ALLOW_GUEST=true  # Demo mode

# Optional: Notifications
# SUPABASE_SERVICE_ROLE_KEY=... (server-side only)
# RESEND_API_KEY=...
# RESEND_FROM_EMAIL=Givy <hello@givy.gifts>
```

### Production (Render Env Vars)

Set these in Render dashboard → Environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  (public anon key only)
NEXT_PUBLIC_SITE_URL=https://www.givy.gifts
NEXT_PUBLIC_BETA_REQUIRE_INVITE=true
OPENAI_API_KEY=sk-... or gsk-... (Groq)
SUPABASE_SERVICE_ROLE_KEY=... (server-side, never public)
RESEND_API_KEY=...
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test -- --coverage
```

Tests are in `src/**/__tests__/*.spec.ts`

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run only security-focused tests
npm run test:e2e:security

# Watch mode (useful for development)
npx playwright test --watch

# Debug mode (opens inspector)
npx playwright test --debug

# Generate visual reports
npx playwright show-report
```

E2E tests are in `e2e/*.spec.ts`

### Running Tests Against Local Supabase

```bash
# Ensure Supabase is running
supabase start

# In another terminal, start dev server
npm run dev

# Run E2E tests (they'll hit localhost:3000)
npm run test:e2e
```

## Debugging

### VS Code Debugging

1. **Add `.vscode/launch.json`:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"],
      "outputCapture": "std"
    }
  ]
}
```

2. **Start dev server with debugger:**

```bash
node --inspect-brk ./node_modules/next/dist/bin/next dev
```

3. **Set breakpoints in VS Code and press F5**

### Browser DevTools

```bash
npm run dev
# Open http://localhost:3000 → F12
# Console, Network, Application tabs available
```

### Server-Side Logs

Check the terminal running `npm run dev` for:
- API route logs
- Supabase errors
- Build warnings

### Supabase Logs

```bash
# View real-time logs from local Supabase
supabase logs --local
```

## Database Migrations

### Creating a New Migration

```bash
# Create new migration file
supabase migration new your_migration_name

# This generates: supabase/migrations/TIMESTAMP_your_migration_name.sql
```

### Running Migrations

```bash
# Apply pending migrations locally
supabase db push

# Reset database and re-apply all migrations
supabase db reset
```

### Verifying Migrations

```bash
# List applied migrations
supabase migration list --local

# Check schema
psql postgresql://postgres:postgres@localhost:54322/postgres
\dt                    # List tables
\d gift_lists          # Describe table
```

## Deployment

### Deploy to Render

1. **Push to master/main:**

```bash
git push origin main
```

2. **Render auto-deploys** (if connected via GitHub)

3. **Or manually trigger in Render dashboard:**
   - Go to Givy service
   - Click "Manual Deploy"
   - Select branch
   - Click "Deploy"

### Pre-Deployment Checklist

- [ ] All tests pass: `npm run test && npm run test:e2e`
- [ ] No secrets in code: Check `.env.local` isn't committed
- [ ] Build succeeds: `npm run build`
- [ ] Environment vars set in Render dashboard
- [ ] Supabase production project configured
- [ ] RLS policies enabled on production
- [ ] Security headers verified in `next.config.ts`

## Troubleshooting

### Supabase Connection Issues

```bash
# Test connection
curl http://localhost:54321/

# Check if services are running
supabase status --local

# Restart services
supabase stop && supabase start
```

### Migration Errors

```bash
# Reset and re-apply
supabase db reset

# Check for syntax errors in migration file
# Ensure all migrations run in order
```

### Auth Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and anon key match
- Check Supabase Auth providers are enabled
- Clear browser cookies: DevTools → Application → Cookies → delete all
- Check token expiration in localStorage

### Performance

```bash
# Profile Next.js build
npm run build -- --analyze

# Monitor Postgres queries
supabase logs --local --tail 100
```

---

For more help, see [README.md](README.md) or email hello@givy.gifts
