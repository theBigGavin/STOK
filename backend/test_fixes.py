"""
STOK API修复测试脚本
用于验证API测试失败问题的修复
"""

import asyncio
import sys
import os
from datetime import date, timedelta

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_invalid_stock_symbol():
    """测试无效股票代码API"""
    print("=== 测试无效股票代码API ===")
    
    try:
        from src.api.stocks import get_stock
        from src.config.database import get_db_session
        from fastapi import HTTPException
        
        # 模拟请求无效股票代码
        symbol = "INVALID_SYMBOL_123"
        
        async with get_db_session() as session:
            try:
                result = await get_stock(symbol, session)
                print(f"❌ 测试失败: 应该返回404，但返回了: {result}")
                return False
            except HTTPException as e:
                if e.status_code == 404:
                    print(f"✅ 测试通过: 无效股票代码正确返回404 - {e.detail}")
                    return True
                else:
                    print(f"❌ 测试失败: 应该返回404，但返回了 {e.status_code} - {e.detail}")
                    return False
            except Exception as e:
                print(f"❌ 测试失败: 发生未预期错误 - {str(e)}")
                return False
                
    except Exception as e:
        print(f"❌ 测试环境错误: {str(e)}")
        return False

async def test_stock_data_query():
    """测试股票历史数据查询"""
    print("\n=== 测试股票历史数据查询 ===")
    
    try:
        from src.api.stocks import get_stock_data
        from src.config.database import get_db_session
        from fastapi import HTTPException
        
        # 测试参数
        symbol = "TEST_SYMBOL"  # 假设的测试股票
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        async with get_db_session() as session:
            try:
                result = await get_stock_data(symbol, start_date, end_date, False, 0, 100, session)
                print(f"✅ 测试通过: 股票数据查询成功 - 返回 {len(result.data.get('data', []))} 条记录")
                return True
            except HTTPException as e:
                if e.status_code == 404:
                    print(f"⚠️  测试部分通过: 股票不存在 (预期行为) - {e.detail}")
                    return True
                else:
                    print(f"❌ 测试失败: 股票数据查询返回 {e.status_code} - {e.detail}")
                    return False
            except Exception as e:
                print(f"❌ 测试失败: 发生未预期错误 - {str(e)}")
                return False
                
    except Exception as e:
        print(f"❌ 测试环境错误: {str(e)}")
        return False

async def test_decision_engine():
    """测试决策引擎API"""
    print("\n=== 测试决策引擎API ===")
    
    try:
        from src.api.decisions import generate_decision
        from src.config.database import get_db_session
        from src.models.stock_models import DecisionRequest
        from fastapi import HTTPException
        
        # 测试参数
        decision_request = DecisionRequest(
            symbol="TEST_SYMBOL",
            trade_date=date.today(),
            current_position=0.0
        )
        
        async with get_db_session() as session:
            try:
                result = await generate_decision(decision_request, session)
                print(f"❌ 测试失败: 应该返回错误，但返回了: {result}")
                return False
            except HTTPException as e:
                if e.status_code == 404:
                    print(f"⚠️  测试部分通过: 股票不存在 (预期行为) - {e.detail}")
                    return True
                elif e.status_code == 500:
                    # 检查错误信息是否包含有用的调试信息
                    if "决策生成失败" in e.detail:
                        print(f"✅ 测试通过: 决策引擎正确返回500错误 - {e.detail}")
                        return True
                    else:
                        print(f"❌ 测试失败: 决策引擎返回500但错误信息不明确 - {e.detail}")
                        return False
                else:
                    print(f"❌ 测试失败: 应该返回404或500，但返回了 {e.status_code} - {e.detail}")
                    return False
            except Exception as e:
                print(f"❌ 测试失败: 发生未预期错误 - {str(e)}")
                return False
                
    except Exception as e:
        print(f"❌ 测试环境错误: {str(e)}")
        return False

async def test_database_connection():
    """测试数据库连接"""
    print("\n=== 测试数据库连接 ===")
    
    try:
        from src.config.database import get_db_session
        
        async with get_db_session() as session:
            from sqlalchemy import text
            result = await session.execute(text("SELECT 1"))
            test_result = result.scalar()
            
            if test_result == 1:
                print("✅ 数据库连接测试通过")
                return True
            else:
                print(f"❌ 数据库连接测试失败: 返回 {test_result}")
                return False
                
    except Exception as e:
        print(f"❌ 数据库连接测试失败: {str(e)}")
        return False

async def test_decision_engine_initialization():
    """测试决策引擎初始化"""
    print("\n=== 测试决策引擎初始化 ===")
    
    try:
        from src.decision_engine.manager import decision_engine_manager
        
        # 检查模型管理器
        model_manager = decision_engine_manager.model_manager
        print(f"模型管理器初始化: {'成功' if model_manager else '失败'}")
        
        # 检查注册的模型数量
        model_count = len(model_manager.models)
        print(f"注册模型数量: {model_count}")
        
        # 检查模型注册表
        registry_count = len(model_manager.model_registry)
        print(f"模型注册表数量: {registry_count}")
        
        if model_count > 0 and registry_count > 0:
            print("✅ 决策引擎初始化测试通过")
            return True
        else:
            print("❌ 决策引擎初始化测试失败: 模型数量不足")
            return False
            
    except Exception as e:
        print(f"❌ 决策引擎初始化测试失败: {str(e)}")
        return False

async def run_all_tests():
    """运行所有测试"""
    print("开始STOK API修复测试...\n")
    
    tests = [
        test_database_connection,
        test_decision_engine_initialization,
        test_invalid_stock_symbol,
        test_stock_data_query,
        test_decision_engine
    ]
    
    results = []
    for test in tests:
        result = await test()
        results.append(result)
    
    print(f"\n=== 测试总结 ===")
    passed = sum(results)
    total = len(results)
    print(f"通过测试: {passed}/{total}")
    
    if passed == total:
        print("🎉 所有测试通过！API修复成功。")
    else:
        print("⚠️  部分测试失败，需要进一步调试。")
    
    return all(results)

if __name__ == "__main__":
    # 运行测试
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)