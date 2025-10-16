"""
机器学习模型基类
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import pandas as pd

from backend.src.models.stock_models import (
    DecisionType, ModelSignal, ModelType
)


class BaseBacktestModel(ABC):
    """回测模型基类"""

    def __init__(self, model_id: int, name: str, description: str = ""):
        self.model_id = model_id
        self.name = name
        self.description = description
        self.model_type: ModelType = ModelType.TECHNICAL
        self.parameters: Dict[str, Any] = {}
        self.is_trained: bool = False
        self.performance_metrics: Dict[str, float] = {}
        self.created_at: datetime = datetime.now()

    @abstractmethod
    def generate_signal(self, data: pd.DataFrame) -> ModelSignal:
        """生成交易信号"""
        pass

    @abstractmethod
    def validate_parameters(self) -> bool:
        """验证模型参数"""
        pass

    def backtest(self, data: pd.DataFrame, initial_capital: float = 100000) -> Dict[str, Any]:
        """执行回测"""
        # 基础回测逻辑，子类可以重写
        signals = []
        positions = []
        capital = initial_capital
        current_position = 0
        
        for i in range(len(data)):
            current_data = data.iloc[:i+1]
            signal = self.generate_signal(current_data)
            signals.append(signal)
            
            # 简单的交易逻辑
            if signal.decision == DecisionType.BUY and current_position == 0:
                # 买入
                shares = capital // data.iloc[i]['close_price']
                if shares > 0:
                    current_position = shares
                    capital -= shares * data.iloc[i]['close_price']
            elif signal.decision == DecisionType.SELL and current_position > 0:
                # 卖出
                capital += current_position * data.iloc[i]['close_price']
                current_position = 0
            
            positions.append({
                'date': data.iloc[i]['trade_date'],
                'position': current_position,
                'capital': capital + (current_position * data.iloc[i]['close_price'] if current_position > 0 else 0)
            })
        
        # 计算回测指标
        final_value = capital + (current_position * data.iloc[-1]['close_price'] if current_position > 0 else 0)
        total_return = (final_value - initial_capital) / initial_capital
        
        return {
            'total_return': total_return,
            'final_value': final_value,
            'signals': signals,
            'positions': positions,
            'trades': self._extract_trades(positions, data)
        }

    def _extract_trades(self, positions: list, data: pd.DataFrame) -> list:
        """从仓位历史中提取交易记录"""
        trades = []
        prev_position = 0
        
        for i, pos in enumerate(positions):
            current_position = pos['position']
            
            if current_position > prev_position:
                # 买入
                trades.append({
                    'type': 'BUY',
                    'date': data.iloc[i]['trade_date'],
                    'price': data.iloc[i]['close_price'],
                    'shares': current_position - prev_position,
                    'value': (current_position - prev_position) * data.iloc[i]['close_price']
                })
            elif current_position < prev_position:
                # 卖出
                trades.append({
                    'type': 'SELL',
                    'date': data.iloc[i]['trade_date'],
                    'price': data.iloc[i]['close_price'],
                    'shares': prev_position - current_position,
                    'value': (prev_position - current_position) * data.iloc[i]['close_price']
                })
            
            prev_position = current_position
        
        return trades

    def update_performance(self, metrics: Dict[str, float]):
        """更新性能指标"""
        self.performance_metrics.update(metrics)

    def get_info(self) -> Dict[str, Any]:
        """获取模型信息"""
        return {
            'model_id': self.model_id,
            'name': self.name,
            'description': self.description,
            'model_type': self.model_type,
            'parameters': self.parameters,
            'is_trained': self.is_trained,
            'performance_metrics': self.performance_metrics,
            'created_at': self.created_at
        }


class ModelManager:
    """模型管理器"""

    def __init__(self):
        self.models: Dict[int, BaseBacktestModel] = {}
        self.model_registry = self._initialize_model_registry()

    def _initialize_model_registry(self) -> Dict[str, Any]:
        """初始化模型注册表"""
        return {
            'moving_average_crossover': None,  # 将在具体实现中设置
            'rsi_model': None,
            'macd_model': None
        }

    def register_model(self, model_id: int, model_type: str, **kwargs) -> BaseBacktestModel:
        """注册新模型"""
        model_class = self.model_registry.get(model_type)
        if not model_class:
            raise ValueError(f"未知的模型类型: {model_type}")
        
        model = model_class(model_id, **kwargs)
        
        if not model.validate_parameters():
            raise ValueError("模型参数验证失败")
        
        self.models[model_id] = model
        return model

    def get_model(self, model_id: int) -> Optional[BaseBacktestModel]:
        """获取模型"""
        return self.models.get(model_id)

    def remove_model(self, model_id: int):
        """移除模型"""
        if model_id in self.models:
            del self.models[model_id]

    def run_models_on_data(self, data: pd.DataFrame) -> Dict[int, Dict[str, Any]]:
        """在所有模型上运行数据"""
        results = {}
        for model_id, model in self.models.items():
            try:
                signal = model.generate_signal(data)
                results[model_id] = {
                    'model_name': model.name,
                    'signal': signal.model_dump() if hasattr(signal, 'model_dump') else signal,
                    'success': True
                }
            except Exception as e:
                results[model_id] = {
                    'model_name': model.name,
                    'error': str(e),
                    'success': False
                }
        return results

    def get_all_models_info(self) -> list:
        """获取所有模型信息"""
        return [model.get_info() for model in self.models.values()]