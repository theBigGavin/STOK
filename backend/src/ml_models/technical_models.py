"""
技术指标模型实现 - 根据数据模型文档更新
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from decimal import Decimal

from src.ml_models.base import BaseBacktestModel
from src.models.stock_models import DecisionType


class MovingAverageCrossover(BaseBacktestModel):
    """移动平均线交叉模型"""

    def __init__(self, short_window: int = 5, long_window: int = 20):
        super().__init__()
        self.short_window = short_window
        self.long_window = long_window

    def generate_signal(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成交易信号"""
        if len(data) < self.long_window:
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal('0.3'),
                'signal_strength': Decimal('0.2'),
                'reasoning': "数据不足，无法计算移动平均线"
            }

        # 转换为DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # 计算移动平均线
        sma_short = df['close'].rolling(window=self.short_window).mean()
        sma_long = df['close'].rolling(window=self.long_window).mean()

        # 获取最新值
        current_short = sma_short.iloc[-1]
        current_long = sma_long.iloc[-1]
        prev_short = sma_short.iloc[-2] if len(df) > 1 else current_short
        prev_long = sma_long.iloc[-2] if len(df) > 1 else current_long

        # 生成交叉信号
        if (current_short > current_long and prev_short <= prev_long):
            # 金叉 - 买入信号
            signal_strength = min((current_short - current_long) / current_long * 10, 1.0)
            return {
                'decision': DecisionType.BUY,
                'confidence': Decimal('0.7'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"移动平均线金叉 (短:{self.short_window}日, 长:{self.long_window}日)",
                'target_price': Decimal(str(current_short * 1.05)),  # 目标价格：短期均线上方5%
                'stop_loss_price': Decimal(str(current_long * 0.95))  # 止损价格：长期均线下方5%
            }
        elif (current_short < current_long and prev_short >= prev_long):
            # 死叉 - 卖出信号
            signal_strength = min((current_long - current_short) / current_short * 10, 1.0)
            return {
                'decision': DecisionType.SELL,
                'confidence': Decimal('0.7'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"移动平均线死叉 (短:{self.short_window}日, 长:{self.long_window}日)",
                'target_price': Decimal(str(current_long * 0.95)),  # 目标价格：长期均线下方5%
                'stop_loss_price': Decimal(str(current_short * 1.05))  # 止损价格：短期均线上方5%
            }
        else:
            # 无交叉 - 观望
            distance = abs(current_short - current_long) / current_long
            confidence = max(0.3, 1.0 - distance * 2)
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal(str(confidence)),
                'signal_strength': Decimal('0.3'),
                'reasoning': "移动平均线无交叉信号"
            }


class RSIModel(BaseBacktestModel):
    """RSI模型"""

    def __init__(self, period: int = 14, overbought: int = 70, oversold: int = 30):
        super().__init__()
        self.period = period
        self.overbought = overbought
        self.oversold = oversold

    def _calculate_rsi(self, df: pd.DataFrame) -> pd.Series:
        """计算RSI指标"""
        close_prices = df['close']
        delta = close_prices.diff()
        
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.rolling(window=self.period).mean()
        avg_loss = loss.rolling(window=self.period).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi

    def generate_signal(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成交易信号"""
        if len(data) < self.period + 1:
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal('0.3'),
                'signal_strength': Decimal('0.2'),
                'reasoning': "数据不足，无法计算RSI"
            }

        # 转换为DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        rsi = self._calculate_rsi(df)
        current_rsi = rsi.iloc[-1]

        if pd.isna(current_rsi):
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal('0.3'),
                'signal_strength': Decimal('0.2'),
                'reasoning': "RSI计算失败"
            }

        # 生成RSI信号
        if current_rsi < self.oversold:
            # 超卖 - 买入信号
            oversold_level = (self.oversold - current_rsi) / self.oversold
            signal_strength = min(oversold_level * 2, 1.0)
            current_price = df['close'].iloc[-1]
            return {
                'decision': DecisionType.BUY,
                'confidence': Decimal('0.8'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"RSI超卖 (当前:{current_rsi:.1f}, 阈值:{self.oversold})",
                'target_price': Decimal(str(current_price * 1.08)),  # 目标价格：上涨8%
                'stop_loss_price': Decimal(str(current_price * 0.92))  # 止损价格：下跌8%
            }
        elif current_rsi > self.overbought:
            # 超买 - 卖出信号
            overbought_level = (current_rsi - self.overbought) / (100 - self.overbought)
            signal_strength = min(overbought_level * 2, 1.0)
            current_price = df['close'].iloc[-1]
            return {
                'decision': DecisionType.SELL,
                'confidence': Decimal('0.8'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"RSI超买 (当前:{current_rsi:.1f}, 阈值:{self.overbought})",
                'target_price': Decimal(str(current_price * 0.92)),  # 目标价格：下跌8%
                'stop_loss_price': Decimal(str(current_price * 1.08))  # 止损价格：上涨8%
            }
        else:
            # 正常区间 - 观望
            distance_to_oversold = abs(current_rsi - self.oversold) / self.oversold
            distance_to_overbought = abs(current_rsi - self.overbought) / (100 - self.overbought)
            min_distance = min(distance_to_oversold, distance_to_overbought)
            confidence = max(0.4, 1.0 - min_distance)
            
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal(str(confidence)),
                'signal_strength': Decimal('0.4'),
                'reasoning': f"RSI正常区间 (当前:{current_rsi:.1f})"
            }


class MACDModel(BaseBacktestModel):
    """MACD模型"""

    def __init__(self, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        super().__init__()
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period

    def _calculate_macd(self, df: pd.DataFrame) -> tuple:
        """计算MACD指标"""
        close_prices = df['close']
        
        ema_fast = close_prices.ewm(span=self.fast_period).mean()
        ema_slow = close_prices.ewm(span=self.slow_period).mean()
        
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=self.signal_period).mean()
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram

    def generate_signal(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成交易信号"""
        if len(data) < self.slow_period + self.signal_period:
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal('0.3'),
                'signal_strength': Decimal('0.2'),
                'reasoning': "数据不足，无法计算MACD"
            }

        # 转换为DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        macd_line, signal_line, histogram = self._calculate_macd(df)

        # 获取最新值
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        current_histogram = histogram.iloc[-1]
        
        prev_macd = macd_line.iloc[-2] if len(df) > 1 else current_macd
        prev_signal = signal_line.iloc[-2] if len(df) > 1 else current_signal

        # 生成MACD信号
        if (current_macd > current_signal and prev_macd <= prev_signal):
            # 金叉 - 买入信号
            signal_strength = min(abs(current_histogram) * 10, 1.0)
            current_price = df['close'].iloc[-1]
            return {
                'decision': DecisionType.BUY,
                'confidence': Decimal('0.7'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"MACD金叉 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})",
                'target_price': Decimal(str(current_price * 1.06)),  # 目标价格：上涨6%
                'stop_loss_price': Decimal(str(current_price * 0.94))  # 止损价格：下跌6%
            }
        elif (current_macd < current_signal and prev_macd >= prev_signal):
            # 死叉 - 卖出信号
            signal_strength = min(abs(current_histogram) * 10, 1.0)
            current_price = df['close'].iloc[-1]
            return {
                'decision': DecisionType.SELL,
                'confidence': Decimal('0.7'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"MACD死叉 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})",
                'target_price': Decimal(str(current_price * 0.94)),  # 目标价格：下跌6%
                'stop_loss_price': Decimal(str(current_price * 1.06))  # 止损价格：上涨6%
            }
        else:
            # 无交叉 - 观望
            distance = abs(current_macd - current_signal)
            confidence = max(0.4, 1.0 - distance * 10)
            
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal(str(confidence)),
                'signal_strength': Decimal('0.3'),
                'reasoning': f"MACD无交叉信号 (MACD:{current_macd:.3f}, 信号:{current_signal:.3f})"
            }


class BollingerBandsModel(BaseBacktestModel):
    """布林带模型"""

    def __init__(self, period: int = 20, std_dev: int = 2):
        super().__init__()
        self.period = period
        self.std_dev = std_dev

    def _calculate_bollinger_bands(self, df: pd.DataFrame) -> tuple:
        """计算布林带"""
        close_prices = df['close']
        
        middle_band = close_prices.rolling(window=self.period).mean()
        std = close_prices.rolling(window=self.period).std()
        
        upper_band = middle_band + (std * self.std_dev)
        lower_band = middle_band - (std * self.std_dev)
        
        return upper_band, middle_band, lower_band

    def generate_signal(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成交易信号"""
        if len(data) < self.period:
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal('0.3'),
                'signal_strength': Decimal('0.2'),
                'reasoning': "数据不足，无法计算布林带"
            }

        # 转换为DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        upper_band, middle_band, lower_band = self._calculate_bollinger_bands(df)

        current_price = df['close'].iloc[-1]
        current_upper = upper_band.iloc[-1]
        current_lower = lower_band.iloc[-1]

        # 生成布林带信号
        if current_price <= current_lower:
            # 价格触及下轨 - 买入信号
            signal_strength = min((current_lower - current_price) / current_price * 20, 1.0)
            return {
                'decision': DecisionType.BUY,
                'confidence': Decimal('0.75'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"价格触及布林带下轨 (价格:{current_price:.2f}, 下轨:{current_lower:.2f})",
                'target_price': Decimal(str(middle_band.iloc[-1])),  # 目标价格：中轨
                'stop_loss_price': Decimal(str(current_lower * 0.98))  # 止损价格：下轨下方2%
            }
        elif current_price >= current_upper:
            # 价格触及上轨 - 卖出信号
            signal_strength = min((current_price - current_upper) / current_upper * 20, 1.0)
            return {
                'decision': DecisionType.SELL,
                'confidence': Decimal('0.75'),
                'signal_strength': Decimal(str(signal_strength)),
                'reasoning': f"价格触及布林带上轨 (价格:{current_price:.2f}, 上轨:{current_upper:.2f})",
                'target_price': Decimal(str(middle_band.iloc[-1])),  # 目标价格：中轨
                'stop_loss_price': Decimal(str(current_upper * 1.02))  # 止损价格：上轨上方2%
            }
        else:
            # 价格在通道内 - 观望
            distance_to_upper = (current_upper - current_price) / current_price
            distance_to_lower = (current_price - current_lower) / current_price
            min_distance = min(distance_to_upper, distance_to_lower)
            confidence = max(0.4, 1.0 - min_distance * 5)
            
            return {
                'decision': DecisionType.HOLD,
                'confidence': Decimal(str(confidence)),
                'signal_strength': Decimal('0.3'),
                'reasoning': f"价格在布林带通道内 (价格:{current_price:.2f})"
            }