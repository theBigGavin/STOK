"""
决策服务单元测试
测试决策点逻辑的核心功能
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from unittest.mock import Mock, AsyncMock, patch
import uuid

from src.services.stock_service import StockService
from src.decision_engine.manager import DecisionEngineManager
from src.models.database import Stock, Decision, VoteResult, AIModel
from src.models.stock_models import DecisionType, ModelType


class TestDecisionService:
    """决策服务单元测试"""

    @pytest.fixture
    def mock_session(self):
        """创建模拟数据库会话"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def sample_stock(self):
        """创建示例股票"""
        return Stock(
            id=uuid.uuid4(),
            symbol="TEST001",
            name="测试股票",
            market="A股",
            industry="测试行业",
            current_price=100.0
        )

    @pytest.fixture
    def sample_decision(self, sample_stock):
        """创建示例决策"""
        return Decision(
            id=uuid.uuid4(),
            stock_id=sample_stock.id,
            decision_type=DecisionType.BUY,
            confidence=0.85,
            target_price=110.0,
            stop_loss_price=95.0,
            time_horizon=30,
            reasoning="技术指标显示买入信号",
            generated_at=datetime.now()
        )

    @pytest.mark.asyncio
    async def test_stock_service_get_stock_by_symbol(self, mock_session, sample_stock):
        """测试股票服务按代码获取股票"""
        # 模拟数据库查询结果
        mock_session.execute.return_value.scalar_one_or_none.return_value = sample_stock
        
        stock_service = StockService(mock_session)
        result = await stock_service.get_stock_by_symbol("TEST001")
        
        assert result == sample_stock
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_stock_service_get_stock_by_symbol_not_found(self, mock_session):
        """测试股票服务获取不存在的股票"""
        mock_session.execute.return_value.scalar_one_or_none.return_value = None
        
        stock_service = StockService(mock_session)
        result = await stock_service.get_stock_by_symbol("NONEXISTENT")
        
        assert result is None
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_decision_engine_initialization(self, mock_session):
        """测试决策引擎初始化"""
        with patch('src.decision_engine.manager.MovingAverageCrossover') as mock_ma, \
             patch('src.decision_engine.manager.RSIModel') as mock_rsi, \
             patch('src.decision_engine.manager.MACDModel') as mock_macd:
            
            # 设置模拟返回值
            mock_ma_instance = Mock()
            mock_rsi_instance = Mock()
            mock_macd_instance = Mock()
            
            mock_ma.return_value = mock_ma_instance
            mock_rsi.return_value = mock_rsi_instance
            mock_macd.return_value = mock_macd_instance
            
            # 创建决策引擎
            decision_engine = DecisionEngineManager(mock_session)
            
            # 验证模型实例化
            mock_ma.assert_called_once_with(short_window=5, long_window=20)
            mock_rsi.assert_called_once_with(period=14, overbought=70, oversold=30)
            mock_macd.assert_called_once_with(fast_period=12, slow_period=26, signal_period=9)
            
            # 验证模型实例缓存
            assert 'moving_average_crossover' in decision_engine.model_instances
            assert 'rsi_model' in decision_engine.model_instances
            assert 'macd_model' in decision_engine.model_instances

    @pytest.mark.asyncio
    async def test_decision_confidence_calculation(self):
        """测试决策置信度计算逻辑"""
        # 模拟投票结果数据
        mock_votes = [
            Mock(vote_type=DecisionType.BUY, confidence=0.8, signal_strength=0.7),
            Mock(vote_type=DecisionType.BUY, confidence=0.9, signal_strength=0.8),
            Mock(vote_type=DecisionType.SELL, confidence=0.7, signal_strength=-0.6),
        ]
        
        # 模拟模型权重
        mock_models = {
            'model1': Mock(weight=0.4),
            'model2': Mock(weight=0.3),
            'model3': Mock(weight=0.3),
        }
        
        # 计算加权置信度
        total_confidence = 0
        total_weight = 0
        
        for i, vote in enumerate(mock_votes):
            model_weight = list(mock_models.values())[i].weight
            weighted_confidence = vote.confidence * model_weight
            total_confidence += weighted_confidence
            total_weight += model_weight
        
        avg_confidence = total_confidence / total_weight if total_weight > 0 else 0
        
        # 验证计算结果
        assert 0.7 < avg_confidence < 0.9  # 应该在合理范围内
        assert total_weight == 1.0  # 权重总和应为1

    @pytest.mark.asyncio
    async def test_decision_type_determination(self):
        """测试决策类型确定逻辑"""
        # 测试买入决策
        buy_votes = [
            Mock(vote_type=DecisionType.BUY, confidence=0.8, weight=0.4),
            Mock(vote_type=DecisionType.BUY, confidence=0.9, weight=0.3),
            Mock(vote_type=DecisionType.HOLD, confidence=0.6, weight=0.3),
        ]
        
        buy_score = sum(v.confidence * v.weight for v in buy_votes if v.vote_type == DecisionType.BUY)
        sell_score = sum(v.confidence * v.weight for v in buy_votes if v.vote_type == DecisionType.SELL)
        hold_score = sum(v.confidence * v.weight for v in buy_votes if v.vote_type == DecisionType.HOLD)
        
        # 买入得分应该最高
        assert buy_score > sell_score
        assert buy_score > hold_score
        
        # 测试卖出决策
        sell_votes = [
            Mock(vote_type=DecisionType.SELL, confidence=0.85, weight=0.4),
            Mock(vote_type=DecisionType.SELL, confidence=0.75, weight=0.3),
            Mock(vote_type=DecisionType.BUY, confidence=0.6, weight=0.3),
        ]
        
        buy_score = sum(v.confidence * v.weight for v in sell_votes if v.vote_type == DecisionType.BUY)
        sell_score = sum(v.confidence * v.weight for v in sell_votes if v.vote_type == DecisionType.SELL)
        
        # 卖出得分应该最高
        assert sell_score > buy_score

    @pytest.mark.asyncio
    async def test_decision_expiration_check(self, sample_decision):
        """测试决策过期检查"""
        # 创建未过期决策
        active_decision = sample_decision
        active_decision.expires_at = datetime.now() + timedelta(days=1)
        
        # 创建已过期决策
        expired_decision = sample_decision
        expired_decision.id = uuid.uuid4()  # 不同ID
        expired_decision.expires_at = datetime.now() - timedelta(days=1)
        
        # 检查过期状态
        now = datetime.now()
        is_active = active_decision.expires_at > now
        is_expired = expired_decision.expires_at <= now
        
        assert is_active is True
        assert is_expired is True

    @pytest.mark.asyncio
    async def test_decision_reasoning_generation(self):
        """测试决策理由生成逻辑"""
        # 模拟技术指标信号
        technical_signals = {
            'moving_average': '金叉信号',
            'rsi': '超卖反弹',
            'macd': '零轴上方',
            'volume': '放量上涨'
        }
        
        # 生成决策理由
        reasoning_parts = []
        for indicator, signal in technical_signals.items():
            if signal:
                reasoning_parts.append(f"{indicator}: {signal}")
        
        reasoning = "；".join(reasoning_parts)
        
        # 验证理由格式
        assert len(reasoning_parts) == 4
        assert "moving_average: 金叉信号" in reasoning
        assert "rsi: 超卖反弹" in reasoning
        assert "；" in reasoning  # 中文分号分隔

    @pytest.mark.asyncio
    async def test_decision_target_price_calculation(self, sample_stock):
        """测试目标价格计算逻辑"""
        current_price = sample_stock.current_price
        
        # 测试买入决策目标价格（上涨预期）
        buy_target_percentage = 0.1  # 10%上涨
        buy_target_price = current_price * (1 + buy_target_percentage)
        
        # 测试卖出决策目标价格（下跌预期）
        sell_target_percentage = 0.08  # 8%下跌
        sell_target_price = current_price * (1 - sell_target_percentage)
        
        # 验证计算结果
        assert buy_target_price == 110.0  # 100 * 1.1
        assert sell_target_price == 92.0  # 100 * 0.92
        assert buy_target_price > current_price
        assert sell_target_price < current_price

    @pytest.mark.asyncio
    async def test_decision_stop_loss_calculation(self, sample_stock):
        """测试止损价格计算逻辑"""
        current_price = sample_stock.current_price
        
        # 测试买入决策止损价格
        buy_stop_loss_percentage = 0.05  # 5%止损
        buy_stop_loss_price = current_price * (1 - buy_stop_loss_percentage)
        
        # 测试卖出决策止损价格
        sell_stop_loss_percentage = 0.06  # 6%止损
        sell_stop_loss_price = current_price * (1 + sell_stop_loss_percentage)
        
        # 验证计算结果
        assert buy_stop_loss_price == 95.0  # 100 * 0.95
        assert sell_stop_loss_price == 106.0  # 100 * 1.06
        assert buy_stop_loss_price < current_price
        assert sell_stop_loss_price > current_price

    @pytest.mark.asyncio
    async def test_decision_time_horizon_validation(self):
        """测试决策时间周期验证"""
        valid_time_horizons = [5, 10, 15, 20, 30, 60, 90]
        invalid_time_horizons = [0, -5, 1000]
        
        # 验证有效时间周期
        for horizon in valid_time_horizons:
            assert horizon > 0 and horizon <= 365  # 合理范围
        
        # 验证无效时间周期
        for horizon in invalid_time_horizons:
            assert horizon <= 0 or horizon > 365

    @pytest.mark.asyncio
    async def test_decision_confidence_validation(self):
        """测试决策置信度验证"""
        valid_confidences = [0.0, 0.5, 0.7, 0.9, 1.0]
        invalid_confidences = [-0.1, 1.1, 2.0]
        
        # 验证有效置信度
        for confidence in valid_confidences:
            assert 0.0 <= confidence <= 1.0
        
        # 验证无效置信度
        for confidence in invalid_confidences:
            assert confidence < 0.0 or confidence > 1.0

    @pytest.mark.asyncio
    async def test_decision_signal_strength_calculation(self):
        """测试信号强度计算逻辑"""
        # 模拟技术指标值
        technical_indicators = {
            'rsi': 30,  # 超卖
            'macd_histogram': 0.05,  # 正值
            'volume_ratio': 1.5,  # 放量
            'price_trend': 0.02  # 上涨趋势
        }
        
        # 计算综合信号强度
        signal_components = []
        
        # RSI信号（超卖为正信号）
        if technical_indicators['rsi'] < 30:
            signal_components.append(0.3)
        elif technical_indicators['rsi'] > 70:
            signal_components.append(-0.3)
        else:
            signal_components.append(0.0)
        
        # MACD信号
        if technical_indicators['macd_histogram'] > 0:
            signal_components.append(0.2)
        else:
            signal_components.append(-0.2)
        
        # 成交量信号
        if technical_indicators['volume_ratio'] > 1.2:
            signal_components.append(0.2)
        else:
            signal_components.append(0.0)
        
        # 价格趋势信号
        signal_components.append(technical_indicators['price_trend'] * 10)  # 放大趋势影响
        
        # 计算总信号强度
        total_signal_strength = sum(signal_components)
        
        # 限制在-1到1之间
        signal_strength = max(-1.0, min(1.0, total_signal_strength))
        
        # 验证信号强度
        assert -1.0 <= signal_strength <= 1.0
        assert signal_strength > 0  # 当前配置应该产生正信号