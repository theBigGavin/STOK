"""
API 认证和授权中间件
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """认证中间件 - 验证 API 请求"""
    
    async def dispatch(self, request: Request, call_next):
        # 跳过健康检查和其他不需要认证的端点
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # 检查 API 密钥
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return JSONResponse(
                status_code=401,
                content={
                    "status": "error",
                    "message": "缺少 API 密钥",
                    "data": None
                }
            )
        
        # 这里可以添加更复杂的认证逻辑
        # 例如验证 API 密钥的有效性、权限等
        if not self.validate_api_key(api_key):
            return JSONResponse(
                status_code=403,
                content={
                    "status": "error",
                    "message": "无效的 API 密钥",
                    "data": None
                }
            )
        
        response = await call_next(request)
        return response
    
    def validate_api_key(self, api_key: str) -> bool:
        """验证 API 密钥"""
        # 在实际生产环境中，这里应该查询数据库或外部服务
        # 这里使用简单的验证逻辑
        return api_key.startswith("dev_") or api_key.startswith("prod_")

class LoggingMiddleware(BaseHTTPMiddleware):
    """日志中间件 - 记录请求和响应"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 记录请求信息
        logger.info(f"请求开始: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"请求处理错误: {str(e)}")
            raise
        
        process_time = time.time() - start_time
        
        # 记录响应信息
        logger.info(
            f"请求完成: {request.method} {request.url.path} "
            f"状态码: {response.status_code} 耗时: {process_time:.4f}s"
        )
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        return response

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """错误处理中间件 - 统一处理异常"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            # FastAPI 的 HTTP 异常
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "status": "error",
                    "message": e.detail,
                    "data": None
                }
            )
        except Exception as e:
            # 其他未处理异常
            logger.error(f"未处理异常: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "服务器内部错误",
                    "data": None
                }
            )

def setup_cors_middleware(app):
    """设置 CORS 中间件"""
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def setup_middleware(app):
    """设置所有中间件"""
    # CORS 中间件
    setup_cors_middleware(app)
    
    # 其他中间件
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(ErrorHandlingMiddleware)
    # 在开发环境中暂时禁用认证中间件
    # app.add_middleware(AuthenticationMiddleware)