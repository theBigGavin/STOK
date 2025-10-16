"""
技术指标模型实现
"""

import pandas as pd
import numpy as np
from typing import Dict, Any

from backend.src.ml_models.base import BaseBacktestModel
from backend.src.models.stock_models import (
    DecisionType, ModelSignal, ModelType
)


class MovingAverageCrossover(BaseBacktestModel):
    """移动平均线交叉模型"""

    def __init__(self, model_id: int, short_window: int = 5, long_window: int = 20):
        super().__init__(model_id, "移动平均线交叉模型", "基于短期和长期移动平均线交叉的交易策略")
        self.model_type = ModelType.TECHNICAL
        self.short_window = short_window
        self.long_window = long_window
        self.parameters = {
            'short_window': short_window,
            'long_window': long_window
        }

    def validate_parameters(self) -> bool:
        """验证模型参数"""
        return (self.short_window > 0 and 
                self.long_window > 0 and 
                self.short_window < self.long_window)

    def generate_signal(self, data: pd.DataFrame) -> ModelSignal:
        """生成交易信号"""
        if len(data) < self.long_window:
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=0.3,
                signal_strength=0.2,
                reasoning="数据不足，无法计算移动平均线"
            )

        # 计算移动平均线
        sma_short = data['close_price'].rolling(window=self.short_window).mean()
        sma_long = data['close_price'].rolling(window=self.long_window).mean()

        # 获取最新值
        current_short = sma_short.iloc[-1]
        current_long = sma_long.iloc[-1]
        prev_short = sma_short.iloc[-2] if len(data) > 1 else current_short
        prev_long = sma_long.iloc[-2] if len(data) > 1 else current_long

        # 生成交叉信号
        if (current_short > current_long and prev_short <= prev_long):
            # 金叉 - 买入信号
            signal_strength = min((current_short - current_long) / current_long * 10, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.BUY,
                confidence=0.7,
                signal_strength=signal_strength,
                reasoning=f"移动平均线金叉 (短:{self.short_window}日, 长:{self.long_window}日)"
            )
        elif (current_short < current_long and prev_short >= prev_long):
            # 死叉 - 卖出信号
            signal_strength = min((current_long - current_short) / current_short * 10, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.SELL,
                confidence=0.7,
                signal_strength=signal_strength,
                reasoning=f"移动平均线死叉 (短:{self.short_window}日, 长:{self.long_window}日)"
            )
        else:
            # 无交叉 - 观望
            distance = abs(current_short - current_long) / current_long
            confidence = max(0.3, 1.0 - distance * 2)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=confidence,
                signal_strength=0.3,
                reasoning="移动平均线无交叉信号"
            )


class RSIModel(BaseBacktestModel):
    """RSI模型"""

    def __init__(self, model_id: int, period: int = 14, overbought: int = 70, oversold: int = 30):
        super().__init__(model_id, "RSI模型", "基于相对强弱指数的超买超卖交易策略")
        self.model_type = ModelType.TECHNICAL
        self.period = period
        self.overbought = overbought
        self.oversold = oversold
        self.parameters = {
            'period': period,
            'overbought': overbought,
            'oversold': oversold
        }

    def validate_parameters(self) -> bool:
        """验证模型参数"""
        return (self.period > 0 and 
                self.oversold < self.overbought and
                0 < self.oversold < 100 and
                0 < self.overbought < 100)

    def _calculate_rsi(self, data: pd.DataFrame) -> pd.Series:
        """计算RSI指标"""
        close_prices = data['close_price']
        delta = close_prices.diff()
        
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.rolling(window=self.period).mean()
        avg_loss = loss.rolling(window=self.period).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi

    def generate_signal(self, data: pd.DataFrame) -> ModelSignal:
        """生成交易信号"""
        if len(data) < self.period + 1:
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=0.3,
                signal_strength=0.2,
                reasoning="数据不足，无法计算RSI"
            )

        rsi = self._calculate_rsi(data)
        current_rsi = rsi.iloc[-1]

        if pd.isna(current_rsi):
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=0.3,
                signal_strength=0.2,
                reasoning="RSI计算失败"
            )

        # 生成RSI信号
        if current_rsi < self.oversold:
            # 超卖 - 买入信号
            oversold_level = (self.oversold - current_rsi) / self.oversold
            signal_strength = min(oversold_level * 2, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.BUY,
                confidence=0.8,
                signal_strength=signal_strength,
                reasoning=f"RSI超卖 (当前:{current_rsi:.1f}, 阈值:{self.oversold})"
            )
        elif current_rsi > self.overbought:
            # 超买 - 卖出信号
            overbought_level = (current_rsi - self.overbought) / (100 - self.overbought)
            signal_strength = min(overbought_level * 2, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.SELL,
                confidence=0.8,
                signal_strength=signal_strength,
                reasoning=f"RSI超买 (当前:{current_rsi:.1f}, 阈值:{self.overbought})"
            )
        else:
            # 正常区间 - 观望
            distance_to_oversold = abs(current_rsi - self.oversold) / self.oversold
            distance_to_overbought = abs(current_rsi - self.overbought) / (100 - self.overbought)
            min_distance = min(distance_to_oversold, distance_to_overbought)
            confidence = max(0.4, 1.0 - min_distance)
            
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=confidence,
                signal_strength=0.4,
                reasoning=f"RSI正常区间 (当前:{current_rsi:.1f})"
            )


class MACDModel(BaseBacktestModel):
    """MACD模型"""

    def __init__(self, model_id: int, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        super().__init__(model_id, "MACD模型", "基于MACD指标的金叉死叉交易策略")
        self.model_type = ModelType.TECHNICAL
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
        self.parameters = {
            'fast_period': fast_period,
            'slow_period': slow_period,
            'signal_period': signal_period
        }

    def validate_parameters(self) -> bool:
        """验证模型参数"""
        return (self.fast_period > 0 and 
                self.slow_period > self.fast_period and
                self.signal_period > 0)

    def _calculate_macd(self, data: pd.DataFrame) -> tuple:
        """计算MACD指标"""
        close_prices = data['close_price']
        
        ema_fast = close_prices.ewm(span=self.fast_period).mean()
        ema_slow = close_prices.ewm(span=self.slow_period).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=self.signal_period).mean()
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram

    def generate_signal(self, data: pd.DataFrame) -> ModelSignal:
        """生成交易信号"""
        if len(data) < self.slow_period + self.signal_period:
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=0.3,
                signal_strength=0.2,
                reasoning="数据不足，无法计算MACD"
            )

        macd_line, signal_line, histogram = self._calculate_macd(data)

        # 获取最新值
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        current_histogram = histogram.iloc[-1]
        
        prev_macd = macd_line.iloc[-2] if len(data) > 1 else current_macd
        prev_signal = signal_line.iloc[-2] if len(data) > 1 else current_signal

        # 生成MACD信号
        if (current_macd > current_signal and prev_macd <= prev_signal):
            # 金叉 - 买入信号
            signal_strength = min(abs(current_histogram) * 10, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.BUY,
                confidence=0.7,
                signal_strength=signal_strength,
                reasoning=f"MACD金叉 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})"
            )
        elif (current_macd < current_signal and prev_macd >= prev_signal):
            # 死叉 - 卖出信号
            signal_strength = min(abs(current_histogram) * 10, 1.0)
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.SELL,
                confidence=0.7,
                signal_strength=signal_strength,
                reasoning=f"MACD死叉 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})"
            )
        else:
            # 无交叉 - 观望
            distance = abs(current_macd - current_signal)
            confidence = max(0.4, 1.0 - distance * 10)
            
            return ModelSignal(
                model_id=self.model_id,
                decision=DecisionType.HOLD,
                confidence=confidence,
                signal_strength=0.3,
                reasoning=f"MACD无交叉信号 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})"
            )