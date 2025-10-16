# Project Architecture Rules (Non-Obvious Only)

- Models are designed as plugins - new models can be added without modifying core decision engine
- Database schema supports multiple stock markets but data validation is market-specific
- Decision engine uses configurable voting thresholds - can be adjusted per stock or market condition
- Real-time data processing uses Celery with Redis for task distribution and result caching
- Frontend and backend communicate through standardized API - no direct database access from frontend
- Model weights are dynamic and can be adjusted based on historical performance
- Data pipeline supports both batch processing (historical) and streaming (real-time) modes
- Security model assumes trusted backend environment - frontend only displays decisions, doesn't execute trades
