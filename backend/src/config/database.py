"""
数据库连接配置
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
from typing import AsyncGenerator

class DatabaseConfig:
    """数据库配置类"""

    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        self.test_database_url = os.getenv("DATABASE_TEST_URL")
        self.environment = os.getenv("ENVIRONMENT", "development")

        # 连接池配置
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_recycle = 3600  # 1小时

        if not self.database_url:
            raise ValueError("DATABASE_URL 环境变量未设置")

    def get_engine_kwargs(self):
        """获取引擎参数"""
        kwargs = {
            "echo": self.environment == "development",
            "future": True,
        }

        # 测试环境不使用连接池
        if self.environment == "test":
            kwargs["poolclass"] = NullPool
        else:
            kwargs.update({
                "pool_size": self.pool_size,
                "max_overflow": self.max_overflow,
                "pool_recycle": self.pool_recycle,
                "pool_pre_ping": True,  # 连接前检查
            })

        return kwargs

    def create_engine(self):
        """创建数据库引擎"""
        return create_async_engine(
            self.database_url,
            **self.get_engine_kwargs()
        )

    def create_test_engine(self):
        """创建测试数据库引擎"""
        if not self.test_database_url:
            raise ValueError("DATABASE_TEST_URL 环境变量未设置")

        return create_async_engine(
            self.test_database_url,
            poolclass=NullPool,  # 测试环境不使用连接池
            echo=False,
            future=True
        )

# 全局数据库配置实例
db_config = DatabaseConfig()

# 创建主数据库引擎和会话工厂
engine = db_config.create_engine()
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 创建测试数据库引擎和会话工厂
test_engine = None
if db_config.test_database_url:
    test_engine = db_config.create_test_engine()
    TestAsyncSessionLocal = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的上下文管理器"""
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()

@asynccontextmanager
async def get_test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """获取测试数据库会话的上下文管理器"""
    if not test_engine:
        raise RuntimeError("测试数据库未配置")

    session = TestAsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()