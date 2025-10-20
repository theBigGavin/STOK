"""
宪法合规性检查：验证基础设施配置符合宪法标准
"""

import os
import logging
from typing import Dict, Any, List
from .database import db_config
from .redis_config import redis_config

logger = logging.getLogger(__name__)

class ConstitutionValidator:
    """宪法合规性验证器"""
    
    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_infrastructure_config(self) -> Dict[str, Any]:
        """验证基础设施配置"""
        logger.info("开始基础设施宪法合规性检查")
        
        # 重置计数器
        self.checks_passed = 0
        self.checks_failed = 0
        self.errors.clear()
        self.warnings.clear()
        
        # 执行所有检查
        self._check_database_config()
        self._check_redis_config()
        self._check_environment_variables()
        self._check_security_config()
        self._check_performance_config()
        
        # 生成报告
        return self._generate_report()
    
    def _check_database_config(self):
        """检查数据库配置"""
        try:
            # 检查数据库连接
            if not db_config.database_url:
                self._add_error("DATABASE_URL 环境变量未设置")
            else:
                self.checks_passed += 1
                logger.info("✓ 数据库连接配置检查通过")
            
            # 检查连接池配置
            if db_config.pool_size < 5:
                self._add_warning("数据库连接池大小建议至少为5")
            else:
                self.checks_passed += 1
            
            # 检查异步配置
            if "asyncpg" not in db_config.database_url:
                self._add_error("数据库连接必须使用 asyncpg 驱动")
            else:
                self.checks_passed += 1
            
        except Exception as e:
            self._add_error(f"数据库配置检查失败: {str(e)}")
    
    def _check_redis_config(self):
        """检查 Redis 配置"""
        try:
            # 检查 Redis 连接
            if not redis_config.redis_url:
                self._add_error("REDIS_URL 环境变量未设置")
            else:
                self.checks_passed += 1
                logger.info("✓ Redis 连接配置检查通过")
            
            # 检查连接池配置
            if redis_config.pool_size < 10:
                self._add_warning("Redis 连接池大小建议至少为10")
            else:
                self.checks_passed += 1
            
        except Exception as e:
            self._add_error(f"Redis 配置检查失败: {str(e)}")
    
    def _check_environment_variables(self):
        """检查环境变量配置"""
        required_vars = [
            "DATABASE_URL",
            "REDIS_URL", 
            "SECRET_KEY",
            "ENVIRONMENT"
        ]
        
        optional_vars = [
            "CELERY_BROKER_URL",
            "CELERY_RESULT_BACKEND",
            "STOCK_DATA_API_KEY"
        ]
        
        # 检查必需环境变量
        for var in required_vars:
            if not os.getenv(var):
                self._add_error(f"必需环境变量 {var} 未设置")
            else:
                self.checks_passed += 1
        
        # 检查可选环境变量
        for var in optional_vars:
            if not os.getenv(var):
                self._add_warning(f"可选环境变量 {var} 未设置")
            else:
                self.checks_passed += 1
        
        # 检查开发环境配置
        if os.getenv("ENVIRONMENT") == "development":
            if os.getenv("DEBUG") != "True":
                self._add_warning("开发环境应启用 DEBUG 模式")
            else:
                self.checks_passed += 1
        
        logger.info("✓ 环境变量配置检查完成")
    
    def _check_security_config(self):
        """检查安全配置"""
        try:
            # 检查密钥配置
            secret_key = os.getenv("SECRET_KEY")
            if not secret_key:
                self._add_error("SECRET_KEY 环境变量未设置")
            elif secret_key == "dev-secret-key-change-in-production":
                self._add_warning("生产环境必须修改默认密钥")
            else:
                self.checks_passed += 1
            
            # 检查 CORS 配置
            cors_origins = os.getenv("CORS_ORIGINS")
            if not cors_origins:
                self._add_warning("CORS_ORIGINS 环境变量未设置")
            else:
                self.checks_passed += 1
            
            logger.info("✓ 安全配置检查完成")
            
        except Exception as e:
            self._add_error(f"安全配置检查失败: {str(e)}")
    
    def _check_performance_config(self):
        """检查性能配置"""
        try:
            # 检查数据库性能配置
            if db_config.pool_size < 10:
                self._add_warning("数据库连接池大小建议设置为10或更高")
            else:
                self.checks_passed += 1
            
            if db_config.max_overflow < 20:
                self._add_warning("数据库最大溢出连接建议设置为20或更高")
            else:
                self.checks_passed += 1
            
            # 检查 Redis 性能配置
            if redis_config.pool_size < 20:
                self._add_warning("Redis 连接池大小建议设置为20或更高")
            else:
                self.checks_passed += 1
            
            logger.info("✓ 性能配置检查完成")
            
        except Exception as e:
            self._add_error(f"性能配置检查失败: {str(e)}")
    
    def _add_error(self, message: str):
        """添加错误信息"""
        self.errors.append(message)
        self.checks_failed += 1
        logger.error(f"✗ {message}")
    
    def _add_warning(self, message: str):
        """添加警告信息"""
        self.warnings.append(message)
        logger.warning(f"⚠ {message}")
    
    def _generate_report(self) -> Dict[str, Any]:
        """生成合规性报告"""
        total_checks = self.checks_passed + self.checks_failed
        success_rate = (self.checks_passed / total_checks * 100) if total_checks > 0 else 0
        
        report = {
            "status": "PASS" if len(self.errors) == 0 else "FAIL",
            "summary": {
                "total_checks": total_checks,
                "checks_passed": self.checks_passed,
                "checks_failed": self.checks_failed,
                "success_rate": round(success_rate, 2)
            },
            "errors": self.errors,
            "warnings": self.warnings,
            "recommendations": self._generate_recommendations()
        }
        
        logger.info(f"宪法合规性检查完成: {report['status']}")
        logger.info(f"检查结果: {self.checks_passed} 通过, {self.checks_failed} 失败")
        
        return report
    
    def _generate_recommendations(self) -> List[str]:
        """生成改进建议"""
        recommendations = []
        
        if self.checks_failed > 0:
            recommendations.append("修复所有错误配置以确保系统正常运行")
        
        if self.warnings:
            recommendations.append("考虑处理警告信息以优化系统配置")
        
        # 特定建议
        if not os.getenv("CELERY_BROKER_URL"):
            recommendations.append("配置 Celery Broker URL 以启用异步任务处理")
        
        if not os.getenv("STOCK_DATA_API_KEY"):
            recommendations.append("配置股票数据 API 密钥以启用数据获取功能")
        
        if os.getenv("ENVIRONMENT") == "production" and os.getenv("DEBUG") == "True":
            recommendations.append("生产环境应禁用 DEBUG 模式")
        
        return recommendations

# 全局验证器实例
validator = ConstitutionValidator()

def validate_infrastructure_compliance():
    """验证基础设施合规性"""
    return validator.validate_infrastructure_config()

if __name__ == "__main__":
    # 命令行执行
    import json
    report = validate_infrastructure_compliance()
    print(json.dumps(report, indent=2, ensure_ascii=False))