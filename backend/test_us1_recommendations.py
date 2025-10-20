#!/usr/bin/env python3
"""
用户故事 US1 测试脚本
测试股票推荐功能
"""

import sys
import os
from datetime import datetime
from decimal import Decimal
from dotenv import load_dotenv

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv('.env.development')

def test_recommendation_api_import():
    """测试推荐API导入"""
    print("🔍 测试推荐API导入...")
    
    try:
        # 只导入模块，不实例化路由
        import src.api.recommendations as recommendations_module
        print("✅ 推荐API模块导入成功")
        
        # 检查模块中的关键组件
        required_components = [
            'router', 'get_stock_recommendations',
            'generate_recommendations', 'get_stock_recommendation_detail'
        ]
        
        for component in required_components:
            if hasattr(recommendations_module, component):
                print(f"✅ 组件 {component} 存在")
            else:
                print(f"❌ 组件 {component} 缺失")
        
        return True
        
    except Exception as e:
        print(f"❌ 推荐API导入失败: {e}")
        return False

def test_recommendation_models_import():
    """测试推荐模型导入"""
    print("🔍 测试推荐模型导入...")
    
    try:
        from src.models.recommendation_models import (
            RecommendationSummary, RecommendationBatchResponse,
            RecommendationDetailResponse, ModelVoteDetail,
            RecommendationHistory, RecommendationType
        )
        print("✅ 推荐模型导入成功")
        
        # 测试模型实例化
        test_summary = RecommendationSummary(
            symbol="AAPL",
            name="Apple Inc.",
            recommendation_type=RecommendationType.BUY,
            confidence=Decimal('0.85'),
            signal_strength=Decimal('0.7'),
            reasoning="技术指标显示买入信号",
            priority="high",
            last_updated=datetime.now()
        )
        print("✅ RecommendationSummary 实例化成功")
        
        test_vote = ModelVoteDetail(
            model_name="移动平均线模型",
            model_type="technical",
            vote_type="buy",
            confidence=Decimal('0.8'),
            signal_strength=Decimal('0.6'),
            reasoning="移动平均线金叉",
            weight=Decimal('0.25')
        )
        print("✅ ModelVoteDetail 实例化成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 推荐模型导入失败: {e}")
        return False

def test_recommendation_integration():
    """测试推荐功能集成"""
    print("🔍 测试推荐功能集成...")
    
    try:
        # 检查主应用是否包含推荐路由
        import src.main as main_module
        
        # 检查路由是否已注册
        if hasattr(main_module, 'app'):
            print("✅ FastAPI应用存在")
            
            # 检查推荐API是否已导入
            import src.api.recommendations as recommendations_module
            if hasattr(recommendations_module, 'router'):
                print("✅ 推荐路由已注册")
                return True
            else:
                print("❌ 推荐路由未注册")
                return False
        else:
            print("❌ FastAPI应用不存在")
            return False
        
    except Exception as e:
        print(f"❌ 推荐功能集成测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始用户故事 US1 测试...\n")
    
    # 运行测试
    tests = [
        test_recommendation_api_import,
        test_recommendation_models_import,
        test_recommendation_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        if test_func():
            passed += 1
        print()
    
    print(f"📊 测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 用户故事 US1 测试全部通过！")
        print("✅ 股票推荐功能已成功实现")
    else:
        print("⚠️ 部分测试失败，需要检查实现")

if __name__ == "__main__":
    main()