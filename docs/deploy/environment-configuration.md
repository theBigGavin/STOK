# 环境变量和数据库连接配置文档

## 1. 环境变量配置

### 1.1 开发环境配置 (.env.development)

```bash
# ============================================
# 数据库配置
# ============================================

# 主数据库连接
DATABASE_URL=postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system

# 测试数据库连接
DATABASE_TEST_URL=postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system_test

# ============================================
# Redis 配置
# ============================================

# Redis 连接
REDIS_URL=redis://localhost:6380/0

# ============================================
# Celery 配置
# ============================================

# Celery Broker
CELERY_BROKER_URL=redis://localhost:6380/0

# Celery 结果后端
CELERY_RESULT_BACKEND=redis://localhost:6380/0

# ============================================
# 股票数据 API 配置
# ============================================

# 股票数据 API 密钥
STOCK_DATA_API_KEY=dev_api_key_123456

# 股票数据 API 基础 URL
STOCK_DATA_BASE_URL=https://api-dev.stockdata.com/v1

# ============================================
# 应用配置
# ============================================

# 应用密钥
SECRET_KEY=dev-secret-key-change-in-production

# 调试模式
DEBUG=True

# 环境标识
ENVIRONMENT=development

# ============================================
# CORS 配置
# ============================================

# 允许的跨域源
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]

# ============================================
# 模型配置
# ============================================

# 决策阈值
DECISION_THRESHOLD=0.6

# 最小置信度
MIN_CONFIDENCE=0.6

# 最大模型数量
MAX_MODELS=10

# ============================================
# 日志配置
# ============================================

# 日志级别
LOG_LEVEL=DEBUG

# 日志格式
LOG_FORMAT=json

# ============================================
# 监控配置
# ============================================

# Prometheus 多进程目录
PROMETHEUS_MULTIPROC_DIR=/tmp
```

### 1.2 生产环境配置 (.env.production)

```bash
# ============================================
# 数据库配置
# ============================================

# 主数据库连接（使用环境变量注入）
DATABASE_URL=${PRODUCTION_DATABASE_URL}

# ============================================
# Redis 配置
# ============================================

# Redis 连接（集群模式）
REDIS_URL=${PRODUCTION_REDIS_URL}

# Redis 密码
REDIS_PASSWORD=${REDIS_PASSWORD}

# ============================================
# Celery 配置
# ============================================

# Celery Broker
CELERY_BROKER_URL=${PRODUCTION_REDIS_URL}/0

# Celery 结果后端
CELERY_RESULT_BACKEND=${PRODUCTION_REDIS_URL}/0

# ============================================
# 股票数据 API 配置
# ============================================

# 股票数据 API 密钥
STOCK_DATA_API_KEY=${PRODUCTION_STOCK_API_KEY}

# 股票数据 API 基础 URL
STOCK_DATA_BASE_URL=https://api.stockdata.com/v1

# ============================================
# 应用配置
# ============================================

# 应用密钥（必须设置）
SECRET_KEY=${PRODUCTION_SECRET_KEY}

# 调试模式
DEBUG=False

# 环境标识
ENVIRONMENT=production

# ============================================
# CORS 配置
# ============================================

# 允许的跨域源
CORS_ORIGINS=["https://stock-trading.example.com"]

# ============================================
# 模型配置
# ============================================

# 决策阈值
DECISION_THRESHOLD=0.7

# 最小置信度
MIN_CONFIDENCE=0.7

# 最大模型数量
MAX_MODELS=15

# ============================================
# 日志配置
# ============================================

# 日志级别
LOG_LEVEL=INFO

# 日志格式
LOG_FORMAT=json

# ============================================
# 监控配置
# ============================================

# Prometheus 多进程目录
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus

# ============================================
# 性能配置
# ============================================

# 数据库连接池大小
DB_POOL_SIZE=20

# 数据库最大溢出
DB_MAX_OVERFLOW=30

# Redis 连接池大小
REDIS_POOL_SIZE=50
```

## 2. 数据库连接配置

### 2.1 数据库配置类 (database.py)

```python
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
```

### 2.2 Redis 配置类 (redis_config.py)

```python
"""
Redis 连接配置
"""

import os
import redis.asyncio as redis
from typing import Optional

class RedisConfig:
    """Redis 配置类"""

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6380/0")
        self.redis_password = os.getenv("REDIS_PASSWORD")
        self.pool_size = int(os.getenv("REDIS_POOL_SIZE", "20"))
        self.health_check_interval = 30  # 健康检查间隔（秒）

    def create_connection_pool(self):
        """创建 Redis 连接池"""
        connection_kwargs = {
            "decode_responses": True,
            "health_check_interval": self.health_check_interval,
            "max_connections": self.pool_size,
        }

        if self.redis_password:
            connection_kwargs["password"] = self.redis_password

        return redis.ConnectionPool.from_url(
            self.redis_url,
            **connection_kwargs
        )

    async def get_redis_client(self) -> redis.Redis:
        """获取 Redis 客户端"""
        pool = self.create_connection_pool()
        return redis.Redis(connection_pool=pool)

    async def test_connection(self) -> bool:
        """测试 Redis 连接"""
        try:
            client = await self.get_redis_client()
            await client.ping()
            await client.close()
            return True
        except Exception:
            return False

# 全局 Redis 配置实例
redis_config = RedisConfig()

# 获取 Redis 客户端的依赖函数
async def get_redis() -> redis.Redis:
    """获取 Redis 客户端实例"""
    return await redis_config.get_redis_client()
```

## 3. 配置管理

### 3.1 配置验证脚本 (validate_config.py)

```python
#!/usr/bin/env python3
"""
环境配置验证脚本
"""

import os
import asyncio
import logging
from typing import Dict, List

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigValidator:
    """配置验证器"""

    def __init__(self):
        self.required_vars = {
            "development": [
                "DATABASE_URL",
                "REDIS_URL",
                "SECRET_KEY",
                "STOCK_DATA_API_KEY"
            ],
            "production": [
                "DATABASE_URL",
                "REDIS_URL",
                "SECRET_KEY",
                "STOCK_DATA_API_KEY"
            ]
        }

    def validate_required_vars(self, environment: str) -> List[str]:
        """验证必需的环境变量"""
        missing_vars = []

        for var in self.required_vars.get(environment, []):
            if not os.getenv(var):
                missing_vars.append(var)

        return missing_vars

    def validate_database_url(self) -> bool:
        """验证数据库 URL 格式"""
        db_url = os.getenv("DATABASE_URL", "")
        return db_url.startswith("postgresql+asyncpg://")

    def validate_redis_url(self) -> bool:
        """验证 Redis URL 格式"""
        redis_url = os.getenv("REDIS_URL", "")
        return redis_url.startswith("redis://")

    async def validate_database_connection(self):
        """验证数据库连接"""
        try:
            from backend.src.config.database import db_config
            engine = db_config.create_engine()

            async with engine.connect() as conn:
                result = await conn.execute("SELECT 1")
                await conn.close()

            logger.info("数据库连接验证成功")
            return True
        except Exception as e:
            logger.error(f"数据库连接验证失败: {e}")
            return False

    async def validate_redis_connection(self):
        """验证 Redis 连接"""
        try:
            from backend.src.config.redis_config import redis_config
            success = await redis_config.test_connection()

            if success:
                logger.info("Redis 连接验证成功")
            else:
                logger.error("Redis 连接验证失败")

            return success
        except Exception as e:
            logger.error(f"Redis 连接验证失败: {e}")
            return False

    async def run_all_validations(self, environment: str):
        """运行所有验证"""
        logger.info(f"开始验证 {environment} 环境配置...")

        # 验证必需变量
        missing_vars = self.validate_required_vars(environment)
        if missing_vars:
            logger.error(f"缺少必需的环境变量: {', '.join(missing_vars)}")
            return False

        # 验证 URL 格式
        if not self.validate_database_url():
            logger.error("数据库 URL 格式不正确")
            return False

        if not self.validate_redis_url():
            logger.error("Redis URL 格式不正确")
            return False

        # 验证连接
        db_success = await self.validate_database_connection()
        redis_success = await self.validate_redis_connection()

        if db_success and redis_success:
            logger.info("所有配置验证通过")
            return True
        else:
            logger.error("配置验证失败")
            return False

async def main():
    """主函数"""
    environment = os.getenv("ENVIRONMENT", "development")
    validator = ConfigValidator()

    success = await validator.run_all_validations(environment)
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
```

### 3.2 环境切换脚本 (switch_environment.sh)

```bash
#!/bin/bash

# 环境切换脚本

set -e

ENV_FILE=".env"

usage() {
    echo "用法: $0 {development|production|test}"
    exit 1
}

# 检查参数
if [ $# -ne 1 ]; then
    usage
fi

ENVIRONMENT=$1

case $ENVIRONMENT in
    development)
        SOURCE_FILE=".env.development"
        ;;
    production)
        SOURCE_FILE=".env.production"
        ;;
    test)
        SOURCE_FILE=".env.test"
        ;;
    *)
        usage
        ;;
esac

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "错误: 环境文件 $SOURCE_FILE 不存在"
    exit 1
fi

# 备份当前环境文件
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup"
    echo "已备份当前环境文件"
fi

# 切换环境
cp "$SOURCE_FILE" "$ENV_FILE"
echo "已切换到 $ENVIRONMENT 环境"

# 验证配置
echo "验证环境配置..."
python scripts/validate_config.py

echo "环境切换完成"
```

## 4. 部署说明

### 4.1 开发环境部署

1. 复制开发环境配置：

   ```bash
   cp .env.development .env
   ```

2. 启动数据库服务：

   ```bash
   docker-compose up -d postgres redis
   ```

3. 验证环境配置：
   ```bash
   python scripts/validate_config.py
   ```

### 4.2 生产环境部署

1. 设置环境变量：

   ```bash
   export PRODUCTION_DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/db"
   export PRODUCTION_SECRET_KEY="your-secret-key"
   # ... 其他环境变量
   ```

2. 使用生产环境配置：

   ```bash
   ./scripts/switch_environment.sh production
   ```

3. 部署应用服务

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**维护者**: 运维团队
