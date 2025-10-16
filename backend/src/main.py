"""
股票回测决策系统 - 主应用入口
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any

from backend.src.config.database import engine
from backend.src.models.database import Base
from backend.src.models.stock_models import APIResponse
from backend.src.api import stocks, models, decisions, backtest, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时创建数据库表
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("数据库表创建成功")
    except Exception as e:
        print(f"数据库表创建失败: {e}")
    
    yield
    
    # 关闭时清理资源
    await engine.dispose()


# 创建FastAPI应用
app = FastAPI(
    title="股票回测决策系统",
    description="基于多模型投票机制的股票交易决策系统",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", ["http://localhost:3000"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, prefix="/api/v1", tags=["系统状态"])
app.include_router(stocks.router, prefix="/api/v1", tags=["股票数据"])
app.include_router(models.router, prefix="/api/v1", tags=["模型管理"])
app.include_router(decisions.router, prefix="/api/v1", tags=["决策引擎"])
app.include_router(backtest.router, prefix="/api/v1", tags=["回测分析"])


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            data=None,
            message=exc.detail,
            status="error"
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """通用异常处理"""
    return JSONResponse(
        status_code=500,
        content=APIResponse(
            data=None,
            message="服务器内部错误",
            status="error"
        ).model_dump()
    )


@app.get("/")
async def root():
    """根路径"""
    return APIResponse(
        data={
            "name": "股票回测决策系统",
            "version": "1.0.0",
            "description": "基于多模型投票机制的股票交易决策系统"
        },
        message="欢迎使用股票回测决策系统",
        status="success"
    )


@app.get("/api/v1")
async def api_root():
    """API根路径"""
    return APIResponse(
        data={
            "endpoints": {
                "health": "/api/v1/health",
                "stocks": "/api/v1/stocks",
                "models": "/api/v1/models",
                "decisions": "/api/v1/decisions",
                "backtest": "/api/v1/backtest"
            }
        },
        message="API服务运行正常",
        status="success"
    )


if __name__ == "__main__":
    import uvicorn
    
    # 开发环境运行
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )