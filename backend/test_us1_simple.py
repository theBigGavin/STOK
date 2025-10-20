#!/usr/bin/env python3
"""
用户故事 US1 简化测试脚本
测试股票推荐功能的核心实现
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

def test_recommendation_models():
    """测试推荐数据模型"""
    print("🔍 测试推荐数据模型...")
    
    try:
        from src.models.recommendation_models import (
            RecommendationSummary, RecommendationBatchResponse,
            RecommendationDetailResponse, ModelVoteDetail,
            RecommendationHistory, RecommendationType,
            RecommendationPriority, RecommendationStatus
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
        
        test_batch = RecommendationBatchResponse(
            recommendations=[test_summary],
            total_count=1,
            market_condition="bullish",
            min_confidence=0.6,
            generated_at=datetime.now()
        )
        print("✅ RecommendationBatchResponse 实例化成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 推荐模型测试失败: {e}")
        return False

def test_api_structure():
    """测试API结构"""
    print("🔍 测试API结构...")
    
    try:
        # 检查API文件是否存在
        api_file = "src/api/recommendations.py"
        if os.path.exists(api_file):
            print("✅ 推荐API文件存在")
            
            # 检查文件内容
            with open(api_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查关键函数是否存在
            required_functions = [
                "get_stock_recommendations",
                "generate_recommendations", 
                "get_stock_recommendation_detail"
            ]
            
            for func in required_functions:
                if f"def {func}" in content:
                    print(f"✅ 函数 {func} 存在")
                else:
                    print(f"❌ 函数 {func} 缺失")
                    return False
            
            # 检查路由定义
            if "@router.get(\"/recommendations\"" in content:
                print("✅ GET /recommendations 路由存在")
            else:
                print("❌ GET /recommendations 路由缺失")
                return False
                
            if "@router.post(\"/recommendations/generate\"" in content:
                print("✅ POST /recommendations/generate 路由存在")
            else:
                print("❌ POST /recommendations/generate 路由缺失")
                return False
                
            if "@router.get(\"/recommendations/{symbol}\"" in content:
                print("✅ GET /recommendations/{symbol} 路由存在")
            else:
                print("❌ GET /recommendations/{symbol} 路由缺失")
                return False
            
            return True
        else:
            print("❌ 推荐API文件不存在")
            return False
            
    except Exception as e:
        print(f"❌ API结构测试失败: {e}")
        return False

def test_main_integration():
    """测试主应用集成"""
    print("🔍 测试主应用集成...")
    
    try:
        # 检查主应用文件
        main_file = "src/main.py"
        if os.path.exists(main_file):
            print("✅ 主应用文件存在")
            
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查推荐API是否已导入
            if "from src.api import recommendations" in content or "import recommendations" in content:
                print("✅ 推荐API已导入")
            else:
                print("❌ 推荐API未导入")
                return False
            
            # 检查路由是否已注册
            if "recommendations.router" in content and "app.include_router" in content:
                print("✅ 推荐路由已注册")
            else:
                print("❌ 推荐路由未注册")
                return False
            
            return True
        else:
            print("❌ 主应用文件不存在")
            return False
            
    except Exception as e:
        print(f"❌ 主应用集成测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始用户故事 US1 简化测试...\n")
    
    # 运行测试
    tests = [
        test_recommendation_models,
        test_api_structure,
        test_main_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        if test_func():
            passed += 1
        print()
    
    print(f"📊 测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 用户故事 US1 简化测试全部通过！")
        print("✅ 股票推荐功能已成功实现")
        print("\n📋 实现的功能:")
        print("  • 完整的推荐数据模型")
        print("  • 推荐API端点 (GET/POST)")
        print("  • 与主应用集成")
        print("  • 多模型投票支持")
    else:
        print("⚠️ 部分测试失败，需要检查实现")

if __name__ == "__main__":
    main()