"""
测试配置和夹具
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.config.database import Base, get_db_session
from src.config.redis_config import get_redis
import redis.asyncio as redis
import os
import uuid
from typing import AsyncGenerator, Generator

# 测试数据库配置
TEST_DATABASE_URL = os.getenv(
    "DATABASE_TEST_URL", 
    "postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system_test"
)

# 测试 Redis 配置
TEST_REDIS_URL = os.getenv("REDIS_TEST_URL", "redis://localhost:6381/0")

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """创建事件循环夹具"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """创建测试数据库引擎"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,  # 测试环境使用静态连接池
        echo=False,
        future=True
    )
    
    # 创建所有表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # 清理表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """创建测试数据库会话"""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session

@pytest.fixture
async def test_redis() -> AsyncGenerator[redis.Redis, None]:
    """创建测试 Redis 客户端"""
    client = redis.from_url(TEST_REDIS_URL, decode_responses=True)
    
    # 清空测试数据库
    await client.flushdb()
    
    yield client
    
    await client.close()

@pytest.fixture
def test_client(test_engine, test_redis) -> Generator[TestClient, None, None]:
    """创建测试客户端"""
    
    async def override_get_db_session():
        """覆盖数据库会话依赖"""
        async_session = sessionmaker(
            test_engine, class_=AsyncSession, expire_on_commit=False
        )
        async with async_session() as session:
            yield session
    
    async def override_get_redis():
        """覆盖 Redis 依赖"""
        yield test_redis
    
    # 覆盖依赖
    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_redis] = override_get_redis
    
    with TestClient(app) as client:
        yield client
    
    # 清理覆盖
    app.dependency_overrides.clear()

@pytest.fixture
async def sample_stock_data(test_session):
    """创建示例股票数据"""
    from src.models.database import Stock
    
    stocks = [
        Stock(
            symbol="TEST001",
            name="测试股票A",
            industry="测试",
            market="TEST",
            current_price=50.0,
            price_change=0.5,
            price_change_percent=1.0,
            volume=1000000,
            market_cap=50000000.0,
            pe_ratio=15.0,
            pb_ratio=2.0,
            dividend_yield=2.0
        ),
        Stock(
            symbol="TEST002", 
            name="测试股票B",
            industry="测试",
            market="TEST",
            current_price=75.0,
            price_change=-0.75,
            price_change_percent=-1.0,
            volume=1500000,
            market_cap=75000000.0,
            pe_ratio=20.0,
            pb_ratio=2.5,
            dividend_yield=1.5
        )
    ]
    
    test_session.add_all(stocks)
    await test_session.commit()
    
    return stocks

@pytest.fixture
async def sample_ai_model_data(test_session):
    """创建示例 AI 模型数据"""
    from src.models.database import AIModel
    
    models = [
        AIModel(
            name="移动平均线策略",
            model_type="technical",
            description="基于双移动平均线的趋势跟踪策略",
            weight=0.30,
            is_active=True,
            performance_score=0.75
        ),
        AIModel(
            name="RSI策略",
            model_type="technical", 
            description="基于相对强弱指数的超买超卖策略",
            weight=0.25,
            is_active=True,
            performance_score=0.68
        )
    ]
    
    test_session.add_all(models)
    await test_session.commit()
    
    return models

@pytest.fixture
async def sample_decision_data(test_session, sample_stock_data, sample_ai_model_data):
    """创建示例决策数据"""
    from src.models.database import Decision, VoteResult
    
    # 创建决策
    decision = Decision(
        stock_id=sample_stock_data[0].id,
        decision_type="buy",
        confidence=0.75,
        target_price=55.0,
        stop_loss_price=45.0,
        time_horizon=30,
        reasoning="基于技术分析和基本面分析的综合判断"
    )
    
    test_session.add(decision)
    await test_session.commit()
    
    # 创建投票结果
    vote_results = []
    for model in sample_ai_model_data:
        vote_result = VoteResult(
            decision_id=decision.id,
            model_id=model.id,
            vote_type="buy",
            confidence=0.70 + (model.weight * 0.1),  # 基于权重调整置信度
            signal_strength=0.65,
            reasoning="模型基于历史数据和特征工程生成信号"
        )
        vote_results.append(vote_result)
    
    test_session.add_all(vote_results)
    await test_session.commit()
    
    return {
        "decision": decision,
        "vote_results": vote_results
    }

@pytest.fixture
def mock_stock_service():
    """模拟股票服务"""
    class MockStockService:
        async def get_stock_by_symbol(self, symbol: str):
            return {
                "symbol": symbol,
                "name": f"测试股票 {symbol}",
                "current_price": 50.0,
                "price_change": 0.5,
                "price_change_percent": 1.0
            }
        
        async def get_stock_list(self, page: int = 1, page_size: int = 10):
            return {
                "stocks": [
                    {
                        "symbol": "TEST001",
                        "name": "测试股票A",
                        "current_price": 50.0,
                        "price_change": 0.5
                    },
                    {
                        "symbol": "TEST002", 
                        "name": "测试股票B",
                        "current_price": 75.0,
                        "price_change": -0.75
                    }
                ],
                "total": 2,
                "page": page,
                "page_size": page_size
            }
    
    return MockStockService()

@pytest.fixture
def mock_decision_service():
    """模拟决策服务"""
    class MockDecisionService:
        async def get_decisions(self, stock_symbol: str = None, page: int = 1, page_size: int = 10):
            return {
                "decisions": [
                    {
                        "id": str(uuid.uuid4()),
                        "stock_symbol": stock_symbol or "TEST001",
                        "decision_type": "buy",
                        "confidence": 0.75,
                        "target_price": 55.0,
                        "reasoning": "基于技术分析"
                    }
                ],
                "total": 1,
                "page": page,
                "page_size": page_size
            }
    
    return MockDecisionService()

# 测试配置
def pytest_configure(config):
    """Pytest 配置"""
    config.addinivalue_line(
        "markers", "slow: 标记为慢速测试（需要外部依赖）"
    )
    config.addinivalue_line(
        "markers", "integration: 标记为集成测试"
    )
    config.addinivalue_line(
        "markers", "performance: 标记为性能测试"
    )

def pytest_collection_modifyitems(config, items):
    """修改测试项"""
    for item in items:
        # 为所有测试添加 asyncio 标记
        if "asyncio" not in item.keywords:
            item.add_marker(pytest.mark.asyncio)