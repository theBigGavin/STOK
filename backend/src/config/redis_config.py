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