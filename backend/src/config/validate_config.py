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
            from .database import db_config
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
            from .redis_config import redis_config
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
    validator = ConfigValidator()
    
    # 获取当前环境
    environment = os.getenv("ENVIRONMENT", "development")
    
    success = await validator.run_all_validations(environment)
    
    if not success:
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())