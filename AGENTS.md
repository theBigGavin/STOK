# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Stock Trading Backtest Decision System - A multi-model voting system for stock trading decisions.

## Key Commands

- Backend: use Docker: `./scripts/start-dev.sh`
- Frontend: via pm2: `pm2 start pnpm --name STOK -- dev`
- Tests: `node api_test.js` for API testing
- Development: Use `./scripts/start-dev.sh` for one-click Docker environment

## Architecture Notes

- Backend uses FastAPI with async SQLAlchemy patterns - sync queries will block
- Database: PostgreSQL with asyncpg driver, Redis for caching and Celery tasks
- Models are plugin-based in `backend/src/ml_models/` - must inherit from `BaseBacktestModel`
- Decision engine uses weighted voting with configurable thresholds
- Frontend uses Nuxt 3 with TypeScript and Composition API (not Vue 2)

## Critical Patterns

- All models must implement `BaseBacktestModel` interface with `generate_signal()` method
- Model signals must return dict with `decision`, `confidence`, and `signal_strength` keys
- API responses follow strict format: `{"data": ..., "message": ..., "status": ...}`
- Database uses async patterns - sync operations will cause blocking
- Frontend uses Vue 3 Composition API exclusively - Options API deprecated

## Testing Requirements

- Backend tests require PostgreSQL test database - in-memory won't work
- API testing uses `api_test.js` with comprehensive endpoint validation
- Frontend testing can use chrome-devtools MCP for browser automation
- Model tests must include backtest validation with historical data

## Database Operations

- Migrations: SQL files in `data/migrations/` - not using Alembic
- Initialization: `init_database.sql` runs automatically in Docker
- Seed data: Manual insertion required - no automatic seeding
- Connection: Uses asyncpg with connection pooling

## Development Gotchas

- Backend runs on port 8099 in dev (mapped from container port 8000)
- Frontend uses pnpm, not npm or yarn
- Docker Compose uses separate files: `docker-compose.dev.yml` for development
- Model voting decisions cached in Redis - clear cache when debugging logic
- Celery worker not included in development setup by default
