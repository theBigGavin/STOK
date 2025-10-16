"""
系统健康检查API
"""

import os
import psutil
from datetime import datetime
from fastapi import APIRouter, Depends
from typing import Dict, Any

from backend.src.models.stock_models import APIResponse
from backend.src.config.database import get_db_session
from backend.src.config.redis_config import get_redis
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

router = APIRouter()


async def check_database_health(session: AsyncSession) -> Dict[str, Any]:
    """检查数据库健康状态"""
    try:
        result = await session.execute("SELECT 1")
        return {"status": "healthy", "message": "数据库连接正常"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"数据库连接失败: {str(e)}"}


async def check_redis_health(redis_client: Redis) -> Dict[str, Any]:
    """检查Redis健康状态"""
    try:
        await redis_client.ping()
        return {"status": "healthy", "message": "Redis连接正常"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Redis连接失败: {str(e)}"}


def get_system_metrics() -> Dict[str, Any]:
    """获取系统指标"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": round(cpu_percent, 2),
            "memory_percent": round(memory.percent, 2),
            "memory_used_gb": round(memory.used / (1024 ** 3), 2),
            "memory_total_gb": round(memory.total / (1024 ** 3), 2),
            "disk_usage_percent": round(disk.percent, 2),
            "disk_used_gb": round(disk.used / (1024 ** 3), 2),
            "disk_total_gb": round(disk.total / (1024 ** 3), 2)
        }
    except Exception as e:
        return {
            "cpu_percent": None,
            "memory_percent": None,
            "memory_used_gb": None,
            "memory_total_gb": None,
            "disk_usage_percent": None,
            "disk_used_gb": None,
            "disk_total_gb": None,
            "error": str(e)
        }


@router.get("/health", response_model=APIResponse)
async def health_check(
    session: AsyncSession = Depends(get_db_session),
    redis_client: Redis = Depends(get_redis)
):
    """系统健康检查"""
    
    # 检查各组件健康状态
    db_health = await check_database_health(session)
    redis_health = await check_redis_health(redis_client)
    
    # 获取系统指标
    system_metrics = get_system_metrics()
    
    # 确定整体状态
    components_healthy = all([
        db_health["status"] == "healthy",
        redis_health["status"] == "healthy"
    ])
    
    overall_status = "healthy" if components_healthy else "unhealthy"
    
    return APIResponse(
        data={
            "status": overall_status,
            "timestamp": datetime.now(),
            "components": {
                "database": db_health,
                "redis": redis_health
            },
            "system": system_metrics
        },
        message="系统健康检查完成",
        status="success"
    )


@router.get("/health/database", response_model=APIResponse)
async def database_health_check(session: AsyncSession = Depends(get_db_session)):
    """数据库健康检查"""
    health_status = await check_database_health(session)
    
    return APIResponse(
        data=health_status,
        message="数据库健康检查完成",
        status="success"
    )


@router.get("/health/redis", response_model=APIResponse)
async def redis_health_check(redis_client: Redis = Depends(get_redis)):
    """Redis健康检查"""
    health_status = await check_redis_health(redis_client)
    
    return APIResponse(
        data=health_status,
        message="Redis健康检查完成",
        status="success"
    )


@router.get("/metrics", response_model=APIResponse)
async def system_metrics():
    """系统指标"""
    metrics = get_system_metrics()
    
    return APIResponse(
        data=metrics,
        message="系统指标获取成功",
        status="success"
    )


@router.get("/info", response_model=APIResponse)
async def system_info():
    """系统信息"""
    return APIResponse(
        data={
            "name": "股票回测决策系统",
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "python_version": os.sys.version,
            "startup_time": datetime.now()
        },
        message="系统信息获取成功",
        status="success"
    )