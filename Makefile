.PHONY: help setup dev test test-unit test-e2e test-e2e-security db-start db-stop db-reset migrate lint build

.DEFAULT_GOAL := help

help:  ## Show this help message
	@echo "Givy Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-25s %s\n", $$1, $$2}'

setup:  ## Setup local development environment
	@bash scripts/setup-local-dev.sh

dev:  ## Start development server
	npm run dev

test:  ## Run all tests
	npm run test && npm run test:e2e:security

test-unit:  ## Run unit tests only
	npm run test

test-unit-watch:  ## Run unit tests in watch mode
	npm run test:watch

test-e2e:  ## Run all E2E tests
	npm run test:e2e

test-e2e-security:  ## Run security E2E tests
	npm run test:e2e:security

test-e2e-debug:  ## Run E2E tests in debug mode
	npx playwright test --debug

db-start:  ## Start local Supabase
	supabase start

db-stop:  ## Stop local Supabase
	supabase stop

db-status:  ## Show Supabase status
	supabase status --local

db-reset:  ## Reset local database (WARNING: destroys data)
	@bash scripts/reset-db.sh

migrate:  ## Run pending migrations
	supabase db push

db-logs:  ## View Supabase logs
	supabase logs --local --tail 50

lint:  ## Run linter
	npm run lint

lint-fix:  ## Run linter and fix issues
	npm run lint -- --fix

build:  ## Build production bundle
	npm run build

start:  ## Start production server
	npm run start

clean:  ## Clean build artifacts
	rm -rf .next dist coverage

env-example:  ## Show .env.example
	cat .env.example
