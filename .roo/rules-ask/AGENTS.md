# Project Documentation Rules (Non-Obvious Only)

- "backend/src/ml_models/" contains plugin-based model implementations, not ML training code
- Decision engine uses weighted voting with configurable thresholds in `backend/src/decision_engine/config.py`
- Stock data sources are abstracted - actual data providers are configured in environment variables
- Model weights are stored in database but can be overridden by runtime configuration
- Frontend uses Vue 3 Composition API exclusively - Options API components will not work
- Real-time updates use Server-Sent Events (SSE) not WebSockets for stock price streaming
- Database migrations use Alembic but custom scripts are in `data/migrations/` for data seeding
- Testing requires separate PostgreSQL instance - in-memory databases won't work for all tests
