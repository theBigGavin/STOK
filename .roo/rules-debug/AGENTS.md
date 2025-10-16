# Project Debug Rules (Non-Obvious Only)

- Model voting decisions are cached in Redis - clear cache when debugging decision logic
- Celery task logs are separate from FastAPI logs - check both for complete debugging
- Database connection pooling uses asyncpg - sync debugging tools may not work
- Stock data validation fails silently if Pydantic models don't match database schema
- Frontend web components run in isolated context - browser dev tools may not show all errors
- Decision engine uses weighted voting - individual model failures may not affect final decision
- Real-time data updates use WebSocket connections - network issues cause silent failures
- Backtest models require historical data - missing data causes runtime errors without warnings
