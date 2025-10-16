# Project Coding Rules (Non-Obvious Only)

- All backtest models must inherit from `BaseBacktestModel` in `backend/src/ml_models/base.py`
- Model signals must return dict with `decision`, `confidence`, and `signal_strength` keys
- Database queries use async SQLAlchemy patterns - sync queries will block the event loop
- Feature engineering must be done through `FeatureEngineer` class in `backend/src/data/feature_engineer.py`
- Decision aggregation uses weighted voting in `backend/src/decision_engine/voting.py`
- API responses must follow standard format: `{"data": ..., "message": ..., "status": ...}`
- Stock data validation uses custom Pydantic models in `backend/src/models/stock_models.py`
- Celery tasks for data updates must be defined in `backend/src/services/tasks.py`
- Frontend components use Composition API with TypeScript - Options API is deprecated
- Vue store uses Pinia with strict typing - mutations must be defined in actions
