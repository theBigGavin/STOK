#!/usr/bin/env python3
"""
核心后端服务验证脚本
验证所有核心后端服务模块的导入和基本功能
"""

import os
import sys
import uuid
from dotenv import load_dotenv

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv('.env.development')

def test_imports():
    """测试核心模块导入"""
    print("🔍 测试核心模块导入...")
    
    try:
        # 测试基础模型导入
        from src.ml_models.base import BaseBacktestModel
        print("✅ BaseBacktestModel 导入成功")
        
        # 测试技术指标模型导入
        from src.ml_models.technical_models import (
            MovingAverageCrossover, RSIModel, MACDModel, BollingerBandsModel
        )
        print("✅ MovingAverageCrossover 导入成功")
        print("✅ RSIModel 导入成功")
        print("✅ MACDModel 导入成功")
        print("✅ BollingerBandsModel 导入成功")
        
        return True
    except Exception as e:
        print(f"❌ 测试 test_imports 异常: {e}")
        return False

def test_model_instantiation():
    """测试模型实例化"""
    print("🔍 测试模型实例化...")
    
    try:
        # 导入模型类
        from src.ml_models.technical_models import (
            MovingAverageCrossover, RSIModel, MACDModel, BollingerBandsModel
        )
        from src.models.stock_models import ModelType
        
        # 实例化技术指标模型
        ma_model = MovingAverageCrossover(
            model_id=uuid.uuid4(),
            name="测试移动平均线模型",
            model_type=ModelType.TECHNICAL,
            short_window=10,
            long_window=30
        )
        rsi_model = RSIModel(
            model_id=uuid.uuid4(),
            name="测试RSI模型",
            model_type=ModelType.TECHNICAL,
            period=14,
            overbought=70,
            oversold=30
        )
        macd_model = MACDModel(
            model_id=uuid.uuid4(),
            name="测试MACD模型",
            model_type=ModelType.TECHNICAL,
            fast_period=12,
            slow_period=26,
            signal_period=9
        )
        bb_model = BollingerBandsModel(
            model_id=uuid.uuid4(),
            name="测试布林带模型",
            model_type=ModelType.TECHNICAL,
            window=20,
            num_std=2
        )
        
        print("✅ 所有技术指标模型实例化成功")
        return True
    except Exception as e:
        print(f"❌ 模型实例化失败: {e}")
        return False

def test_model_methods():
    """测试模型方法"""
    print("🔍 测试模型方法...")
    
    try:
        # 导入模型类
        from src.ml_models.technical_models import MovingAverageCrossover, RSIModel
        from src.models.stock_models import ModelType
        
        # 创建测试数据
        test_data = [
            {'date': '2024-01-01', 'close': 100.0},
            {'date': '2024-01-02', 'close': 102.0},
            {'date': '2024-01-03', 'close': 101.5},
            {'date': '2024-01-04', 'close': 103.0},
            {'date': '2024-01-05', 'close': 104.5},
            {'date': '2024-01-06', 'close': 106.0},
            {'date': '2024-01-07', 'close': 105.5},
            {'date': '2024-01-08', 'close': 107.0},
            {'date': '2024-01-09', 'close': 108.5},
            {'date': '2024-01-10', 'close': 109.0},
        ]
        
        # 测试移动平均交叉模型
        ma_model = MovingAverageCrossover(
            model_id=uuid.uuid4(),
            name="测试移动平均线模型",
            model_type=ModelType.TECHNICAL,
            short_window=3,
            long_window=5
        )
        signal = ma_model.generate_signal(test_data)
        print(f"✅ 移动平均交叉模型信号: {signal}")
        
        # 测试 RSI 模型
        rsi_model = RSIModel(
            model_id=uuid.uuid4(),
            name="测试RSI模型",
            model_type=ModelType.TECHNICAL,
            period=5,
            overbought=70,
            oversold=30
        )
        signal = rsi_model.generate_signal(test_data)
        print(f"✅ RSI 模型信号: {signal}")
        
        return True
    except Exception as e:
        print(f"❌ 模型方法测试失败: {e}")
        return False

def test_service_classes():
    """测试服务类"""
    print("🔍 测试服务类...")
    
    try:
        # 测试服务类导入和实例化
        from src.services.stock_service import StockService
        from src.services.backtest_service import BacktestService
        
        print("✅ 服务类导入成功")
        return True
    except Exception as e:
        print(f"❌ 服务类测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始核心后端服务验证...\n")
    
    # 运行测试
    tests = [
        test_imports,
        test_model_instantiation,
        test_model_methods,
        test_service_classes
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        if test_func():
            passed += 1
    
    print(f"\n📊 测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 所有核心后端服务验证通过！")
    else:
        print("⚠️ 部分测试失败，需要检查实现")

if __name__ == "__main__":
    main()