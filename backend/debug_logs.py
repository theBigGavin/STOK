"""
调试日志工具 - 用于捕获和分析API错误
"""

import logging
import traceback
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import Request, HTTPException
from sqlalchemy.exc import SQLAlchemyError

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('debug_api.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("stok_debug")

class DebugLogger:
    """调试日志记录器"""
    
    @staticmethod
    def log_api_request(request: Request, symbol: Optional[str] = None):
        """记录API请求"""
        logger.info(f"API Request: {request.method} {request.url} - Symbol: {symbol}")
    
    @staticmethod
    def log_api_response(status_code: int, message: str, data: Optional[Any] = None):
        """记录API响应"""
        logger.info(f"API Response: {status_code} - {message}")
        if data:
            logger.debug(f"Response Data: {data}")
    
    @staticmethod
    def log_database_error(operation: str, error: Exception, symbol: Optional[str] = None):
        """记录数据库错误"""
        logger.error(f"Database Error in {operation} - Symbol: {symbol} - Error: {str(error)}")
        logger.debug(f"Traceback: {traceback.format_exc()}")
    
    @staticmethod
    def log_decision_engine_error(operation: str, error: Exception, symbol: Optional[str] = None):
        """记录决策引擎错误"""
        logger.error(f"Decision Engine Error in {operation} - Symbol: {symbol} - Error: {str(error)}")
        logger.debug(f"Traceback: {traceback.format_exc()}")
    
    @staticmethod
    def log_model_error(model_name: str, error: Exception, symbol: Optional[str] = None):
        """记录模型错误"""
        logger.error(f"Model Error in {model_name} - Symbol: {symbol} - Error: {str(error)}")
        logger.debug(f"Traceback: {traceback.format_exc()}")
    
    @staticmethod
    def log_performance_issue(operation: str, duration: float, symbol: Optional[str] = None):
        """记录性能问题"""
        if duration > 5.0:  # 超过5秒认为是性能问题
            logger.warning(f"Performance Issue in {operation} - Duration: {duration:.2f}s - Symbol: {symbol}")

# 中间件函数
async def debug_middleware(request: Request, call_next):
    """调试中间件"""
    start_time = datetime.now()
    
    try:
        response = await call_next(request)
        duration = (datetime.now() - start_time).total_seconds()
        
        # 记录性能问题
        if duration > 5.0:
            DebugLogger.log_performance_issue(
                f"{request.method} {request.url}", 
                duration
            )
        
        return response
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 捕获未处理的异常
        duration = (datetime.now() - start_time).total_seconds()
        logger.critical(f"Unhandled Exception in {request.method} {request.url} - Duration: {duration:.2f}s")
        logger.critical(f"Exception: {str(e)}")
        logger.critical(f"Traceback: {traceback.format_exc()}")
        
        # 返回500错误
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# 数据库连接测试
async def test_database_connection():
    """测试数据库连接"""
    try:
        from src.config.database import get_db_session
        async with get_db_session() as session:
            # 执行简单的查询测试连接
            from sqlalchemy import text
            result = await session.execute(text("SELECT 1"))
            test_result = result.scalar()
            logger.info(f"Database connection test: {test_result}")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

# 决策引擎初始化测试
async def test_decision_engine():
    """测试决策引擎初始化"""
    try:
        from src.decision_engine.manager import decision_engine_manager
        from src.ml_models.base import ModelManager
        
        # 检查模型管理器
        model_manager = decision_engine_manager.model_manager
        logger.info(f"Model Manager initialized: {model_manager is not None}")
        logger.info(f"Registered models: {len(model_manager.models)}")
        
        # 检查决策引擎
        decision_engine = decision_engine_manager.decision_engine
        logger.info(f"Decision Engine initialized: {decision_engine is not None}")
        
        return True
    except Exception as e:
        logger.error(f"Decision Engine initialization failed: {str(e)}")
        return False

if __name__ == "__main__":
    # 运行测试
    import asyncio
    
    async def run_tests():
        logger.info("Starting STOK Debug Tests...")
        
        # 测试数据库连接
        db_ok = await test_database_connection()
        logger.info(f"Database test: {'PASS' if db_ok else 'FAIL'}")
        
        # 测试决策引擎
        de_ok = await test_decision_engine()
        logger.info(f"Decision Engine test: {'PASS' if de_ok else 'FAIL'}")
        
        logger.info("STOK Debug Tests completed")
    
    asyncio.run(run_tests())