#!/bin/bash

# Reset local Supabase database and re-apply migrations

set -e

echo "⚠️  WARNING: This will reset your local database and delete all data."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

echo "🗑️  Resetting database..."
supabase db reset

echo "✓ Database reset complete"
echo "✓ All migrations re-applied"
