# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Stock Trading Backtest Decision System - A multi-model voting system for stock trading decisions.

## Key Commands

- Backend: `cd backend && python -m uvicorn main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Tests: `cd backend && pytest` or `cd frontend && npm test`
- Data updates: `cd backend && python scripts/update_stock_data.py`

## Architecture Notes

- Backend uses FastAPI with async/await patterns
- Database: PostgreSQL for relational data, Redis for caching
- Models are implemented as plugins in `backend/src/ml_models/`
- Decision engine uses weighted voting with configurable thresholds
- Frontend uses Vue 3 with TypeScript and Composition API

## Critical Patterns

- All models must implement `BaseBacktestModel` interface
- Data validation uses Pydantic models in `backend/src/models/`
- Feature engineering happens in `backend/src/data/feature_engineer.py`
- Decision aggregation uses weighted voting in `backend/src/decision_engine/`
- API responses follow standard format with `data`, `message`, `status` fields

## Testing Requirements

- Backend tests require PostgreSQL test database
- Model tests must include backtest validation
- Frontend tests use Vitest with Vue Test Utils
- Integration tests verify model voting logic

## Database Migrations

- Run migrations: `cd backend && alembic upgrade head`
- Create migration: `cd backend && alembic revision --autogenerate -m "description"`
- Seed data: `cd backend && python scripts/seed_data.py`
