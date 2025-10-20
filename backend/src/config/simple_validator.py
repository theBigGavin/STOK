"""
简化的宪法合规性检查 - 避免数据库连接问题
"""

import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def validate_infrastructure_simple() -> Dict[str, Any]:
    """简化的基础设施合规性检查"""
    checks_passed = 0
    checks_failed = 0
    errors: List[str] = []
    warnings: List[str] = []
    
    logger.info("开始简化的基础设施宪法合规性检查")
    
    # 检查必需环境变量
    required_vars = [
        "DATABASE_URL",
        "REDIS_URL", 
        "SECRET_KEY",
        "ENVIRONMENT"
    ]
    
    for var in required_vars:
        if not os.getenv(var):
            errors.append(f"必需环境变量 {var} 未设置")
            checks_failed += 1
        else:
            checks_passed += 1
    
    # 检查可选环境变量
    optional_vars = [
        "CELERY_BROKER_URL",
        "CELERY_RESULT_BACKEND",
        "STOCK_DATA_API_KEY"
    ]
    
    for var in optional_vars:
        if not os.getenv(var):
            warnings.append(f"可选环境变量 {var} 未设置")
        else:
            checks_passed += 1
    
    # 检查开发环境配置
    if os.getenv("ENVIRONMENT") == "development":
        if os.getenv("DEBUG") != "True":
            warnings.append("开发环境应启用 DEBUG 模式")
        else:
            checks_passed += 1
    
    # 检查安全配置
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        errors.append("SECRET_KEY 环境变量未设置")
        checks_failed += 1
    elif secret_key == "dev-secret-key-change-in-production":
        warnings.append("生产环境必须修改默认密钥")
    else:
        checks_passed += 1
    
    # 检查数据库配置
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if "asyncpg" not in database_url:
            errors.append("数据库连接必须使用 asyncpg 驱动")
            checks_failed += 1
        else:
            checks_passed += 1
    
    # 检查 Redis 配置
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        errors.append("REDIS_URL 环境变量未设置")
        checks_failed += 1
    else:
        checks_passed += 1
    
    # 生成报告
    total_checks = checks_passed + checks_failed
    success_rate = (checks_passed / total_checks * 100) if total_checks > 0 else 0
    
    report = {
        "status": "PASS" if len(errors) == 0 else "FAIL",
        "summary": {
            "total_checks": total_checks,
            "checks_passed": checks_passed,
            "checks_failed": checks_failed,
            "success_rate": round(success_rate, 2)
        },
        "errors": errors,
        "warnings": warnings,
        "recommendations": [
            "修复所有错误配置以确保系统正常运行",
            "考虑处理警告信息以优化系统配置"
        ]
    }
    
    logger.info(f"简化的宪法合规性检查完成: {report['status']}")
    logger.info(f"检查结果: {checks_passed} 通过, {checks_failed} 失败")
    
    return report

if __name__ == "__main__":
    import json
    from dotenv import load_dotenv
    
    # 加载环境变量
    load_dotenv('.env.development')
    
    # 运行检查
    report = validate_infrastructure_simple()
    print(json.dumps(report, indent=2, ensure_ascii=False))