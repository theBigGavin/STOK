"""
回测计算服务
实现股票回测计算和性能指标计算功能
"""

import asyncio
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from src.models.database import Stock, StockPrice, Decision, BacktestResult, AIModel, TradeRecord
from src.models.stock_models import DecisionType, BacktestRequest, BacktestResultResponse
from src.ml_models.base import BaseBacktestModel
from src.decision_engine.manager import DecisionEngineManager


class BacktestService:
    """回测计算服务"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.decision_engine = DecisionEngineManager(session)

    async def get_stock_price_data(self, stock_id: str, start_date: date, end_date: date) -> pd.DataFrame:
        """获取股票价格数据"""
        result = await self.session.execute(
            select(StockPrice).where(
                and_(
                    StockPrice.stock_id == stock_id,
                    StockPrice.date >= start_date,
                    StockPrice.date <= end_date
                )
            ).order_by(StockPrice.date)
        )
        prices = result.scalars().all()
        
        # 转换为DataFrame
        price_data = []
        for price in prices:
            price_data.append({
                'date': price.date,
                'open': float(price.open_price) if price.open_price else 0,
                'high': float(price.high_price) if price.high_price else 0,
                'low': float(price.low_price) if price.low_price else 0,
                'close': float(price.close_price) if price.close_price else 0,
                'volume': price.volume or 0,
                'adjusted_close': float(price.adjusted_close) if price.adjusted_close else float(price.close_price) if price.close_price else 0
            })
        
        return pd.DataFrame(price_data).set_index('date')

    async def calculate_technical_indicators(self, price_data: pd.DataFrame) -> pd.DataFrame:
        """计算技术指标"""
        df = price_data.copy()
        
        # 移动平均线
        df['sma_5'] = df['close'].rolling(window=5).mean()
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_60'] = df['close'].rolling(window=60).mean()
        
        # RSI
        df['rsi'] = self._calculate_rsi(df['close'])
        
        # MACD
        df['macd'], df['macd_signal'], df['macd_histogram'] = self._calculate_macd(df['close'])
        
        # 布林带
        df['bb_upper'], df['bb_middle'], df['bb_lower'] = self._calculate_bollinger_bands(df['close'])
        
        # 成交量指标
        df['volume_sma'] = df['volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']
        
        return df

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """计算RSI指标"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """计算MACD指标"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        macd_histogram = macd - macd_signal
        return macd, macd_signal, macd_histogram

    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20, std: int = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """计算布林带"""
        sma = prices.rolling(window=period).mean()
        rolling_std = prices.rolling(window=period).std()
        upper_band = sma + (rolling_std * std)
        lower_band = sma - (rolling_std * std)
        return upper_band, sma, lower_band

    async def simulate_trading(self, price_data: pd.DataFrame, initial_capital: float = 100000) -> Dict[str, Any]:
        """模拟交易执行"""
        df = price_data.copy()
        capital = initial_capital
        position = 0
        trades = []
        portfolio_value = []
        
        # 简单的移动平均线策略
        df['signal'] = 0
        df.loc[df['sma_5'] > df['sma_20'], 'signal'] = 1  # 买入信号
        df.loc[df['sma_5'] < df['sma_20'], 'signal'] = -1  # 卖出信号
        
        for i, row in df.iterrows():
            current_price = row['close']
            
            # 买入信号且没有持仓
            if row['signal'] == 1 and position == 0:
                # 计算可买数量
                quantity = int(capital / current_price)
                if quantity > 0:
                    cost = quantity * current_price
                    position = quantity
                    capital -= cost
                    
                    trades.append({
                        'date': i,
                        'type': 'buy',
                        'price': current_price,
                        'quantity': quantity,
                        'value': cost
                    })
            
            # 卖出信号且有持仓
            elif row['signal'] == -1 and position > 0:
                revenue = position * current_price
                capital += revenue
                
                trades.append({
                    'date': i,
                    'type': 'sell',
                    'price': current_price,
                    'quantity': position,
                    'value': revenue
                })
                position = 0
            
            # 计算当前投资组合价值
            current_value = capital + (position * current_price)
            portfolio_value.append({
                'date': i,
                'value': current_value
            })
        
        # 计算性能指标
        portfolio_df = pd.DataFrame(portfolio_value).set_index('date')
        returns = portfolio_df['value'].pct_change().dropna()
        
        performance = {
            'initial_capital': initial_capital,
            'final_value': portfolio_df['value'].iloc[-1] if len(portfolio_df) > 0 else initial_capital,
            'total_return': (portfolio_df['value'].iloc[-1] - initial_capital) / initial_capital if len(portfolio_df) > 0 else 0,
            'total_trades': len(trades),
            'winning_trades': 0,  # 简化计算
            'losing_trades': 0,   # 简化计算
            'max_drawdown': self._calculate_max_drawdown(portfolio_df['value']),
            'sharpe_ratio': self._calculate_sharpe_ratio(returns),
            'annual_return': self._calculate_annual_return(returns),
            'trades': trades,
            'portfolio_value': portfolio_value
        }
        
        return performance

    def _calculate_max_drawdown(self, portfolio_values: pd.Series) -> float:
        """计算最大回撤"""
        if len(portfolio_values) == 0:
            return 0
        
        peak = portfolio_values.expanding().max()
        drawdown = (portfolio_values - peak) / peak
        return drawdown.min()

    def _calculate_sharpe_ratio(self, returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """计算夏普比率"""
        if len(returns) == 0 or returns.std() == 0:
            return 0
        
        excess_returns = returns - (risk_free_rate / 252)  # 年化无风险利率
        return (excess_returns.mean() * 252) / (returns.std() * np.sqrt(252))

    def _calculate_annual_return(self, returns: pd.Series) -> float:
        """计算年化收益率"""
        if len(returns) == 0:
            return 0
        
        cumulative_return = (1 + returns).prod() - 1
        trading_days = len(returns)
        years = trading_days / 252  # 假设252个交易日
        return (1 + cumulative_return) ** (1 / years) - 1 if years > 0 else 0

    async def run_backtest(self, backtest_request: BacktestRequest) -> BacktestResultResponse:
        """执行回测"""
        # 获取股票
        stock_result = await self.session.execute(
            select(Stock).where(Stock.symbol == backtest_request.symbol)
        )
        stock = stock_result.scalar_one_or_none()
        
        if not stock:
            raise ValueError(f"股票 {backtest_request.symbol} 不存在")
        
        # 获取价格数据
        price_data = await self.get_stock_price_data(
            stock.id, 
            backtest_request.start_date, 
            backtest_request.end_date
        )
        
        if len(price_data) == 0:
            raise ValueError(f"在指定时间范围内没有找到 {backtest_request.symbol} 的价格数据")
        
        # 计算技术指标
        enhanced_data = await self.calculate_technical_indicators(price_data)
        
        # 模拟交易
        performance = await self.simulate_trading(enhanced_data, float(backtest_request.initial_capital))
        
        # 创建回测结果
        backtest_result = BacktestResult(
            stock_id=stock.id,
            model_id=None,  # 使用默认模型
            start_date=backtest_request.start_date,
            end_date=backtest_request.end_date,
            total_return=performance['total_return'],
            annual_return=performance['annual_return'],
            sharpe_ratio=performance['sharpe_ratio'],
            max_drawdown=performance['max_drawdown'],
            win_rate=performance['winning_trades'] / performance['total_trades'] if performance['total_trades'] > 0 else 0,
            profit_factor=1.0,  # 简化计算
            total_trades=performance['total_trades'],
            avg_trade_return=0.0  # 简化计算
        )
        
        self.session.add(backtest_result)
        await self.session.commit()
        
        # 转换为响应模型
        return BacktestResultResponse(
            id=backtest_result.id,
            stock_id=backtest_result.stock_id,
            model_id=backtest_result.model_id,
            start_date=backtest_result.start_date,
            end_date=backtest_result.end_date,
            total_return=backtest_result.total_return,
            annual_return=backtest_result.annual_return,
            sharpe_ratio=backtest_result.sharpe_ratio,
            max_drawdown=backtest_result.max_drawdown,
            win_rate=backtest_result.win_rate,
            profit_factor=backtest_result.profit_factor,
            total_trades=backtest_result.total_trades,
            avg_trade_return=backtest_result.avg_trade_return,
            created_at=backtest_result.created_at
        )

    async def get_decision_performance(self, decision_id: str) -> Dict[str, Any]:
        """获取决策性能指标"""
        # 获取决策信息
        decision_result = await self.session.execute(
            select(Decision).where(Decision.id == decision_id)
        )
        decision = decision_result.scalar_one_or_none()
        
        if not decision:
            raise ValueError(f"决策 {decision_id} 不存在")
        
        # 获取股票价格数据（决策生成前后一段时间）
        start_date = decision.generated_at.date() - timedelta(days=30)
        end_date = decision.generated_at.date() + timedelta(days=30)
        
        price_data = await self.get_stock_price_data(decision.stock_id, start_date, end_date)
        
        if len(price_data) == 0:
            return {
                'decision_id': decision_id,
                'performance_available': False,
                'message': '没有足够的价格数据计算性能指标'
            }
        
        # 计算决策点前后的表现
        decision_date = decision.generated_at.date()
        pre_decision_data = price_data[price_data.index < decision_date]
        post_decision_data = price_data[price_data.index >= decision_date]
        
        if len(pre_decision_data) == 0 or len(post_decision_data) == 0:
            return {
                'decision_id': decision_id,
                'performance_available': False,
                'message': '决策日期前后没有足够的价格数据'
            }
        
        # 计算收益率
        pre_return = (pre_decision_data['close'].iloc[-1] - pre_decision_data['close'].iloc[0]) / pre_decision_data['close'].iloc[0] if len(pre_decision_data) > 1 else 0
        post_return = (post_decision_data['close'].iloc[-1] - post_decision_data['close'].iloc[0]) / post_decision_data['close'].iloc[0] if len(post_decision_data) > 1 else 0
        
        return {
            'decision_id': decision_id,
            'performance_available': True,
            'pre_decision_return': pre_return,
            'post_decision_return': post_return,
            'decision_accuracy': 1.0 if (decision.decision_type == 'buy' and post_return > 0) or 
                                      (decision.decision_type == 'sell' and post_return < 0) else 0.0,
            'confidence_vs_accuracy': decision.confidence if (decision.decision_type == 'buy' and post_return > 0) or 
                                                           (decision.decision_type == 'sell' and post_return < 0) else 1 - decision.confidence
        }

    async def get_backtest_history(self, stock_id: str, limit: int = 10) -> List[BacktestResultResponse]:
        """获取回测历史记录"""
        result = await self.session.execute(
            select(BacktestResult).where(BacktestResult.stock_id == stock_id)
            .order_by(BacktestResult.created_at.desc())
            .limit(limit)
        )
        backtest_results = result.scalars().all()
        
        return [
            BacktestResultResponse(
                id=br.id,
                stock_id=br.stock_id,
                model_id=br.model_id,
                start_date=br.start_date,
                end_date=br.end_date,
                total_return=br.total_return,
                annual_return=br.annual_return,
                sharpe_ratio=br.sharpe_ratio,
                max_drawdown=br.max_drawdown,
                win_rate=br.win_rate,
                profit_factor=br.profit_factor,
                total_trades=br.total_trades,
                avg_trade_return=br.avg_trade_return,
                created_at=br.created_at
            )
            for br in backtest_results
        ]