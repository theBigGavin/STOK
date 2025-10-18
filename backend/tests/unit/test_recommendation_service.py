"""
推荐服务单元测试
测试推荐逻辑的核心功能
"""

import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timedelta
import pandas as pd

from src.services.stock_service import StockService
from src.decision_engine.manager import DecisionEngine
from src.decision_engine.voting import VotingEngine
from src.models.database import Stock, AIModel, Decision, VoteResult
from src.models.stock_models import DecisionType, ModelType
from src.ml_models.base import BaseBacktestModel


class TestRecommendationService:
    """推荐服务单元测试类"""

    @pytest_asyncio.fixture
    async def mock_db_session(self):
        """创建模拟数据库会话"""
        session = AsyncMock(spec=AsyncSession)
        return session

    @pytest_asyncio.fixture
    async def test_stocks(self):
        """创建测试股票数据"""
        return [
            Stock(
                id=uuid.uuid4(),
                symbol="000001",
                name="平安银行",
                market="A股",
                industry="银行",
                current_price=15.20,
                price_change=0.25,
                price_change_percent=1.67,
                volume=50000000,
                market_cap=300000000000,
                pe_ratio=8.5,
                pb_ratio=0.9,
                dividend_yield=3.2
            ),
            Stock(
                id=uuid.uuid4(),
                symbol="000002",
                name="万科A",
                market="A股",
                industry="房地产",
                current_price=18.50,
                price_change=-0.15,
                price_change_percent=-0.80,
                volume=30000000,
                market_cap=200000000000,
                pe_ratio=6.8,
                pb_ratio=0.7,
                dividend_yield=4.1
            )
        ]

    @pytest_asyncio.fixture
    async def test_models(self):
        """创建测试AI模型"""
        return [
            AIModel(
                id=uuid.uuid4(),
                name="技术分析模型",
                model_type=ModelType.TECHNICAL,
                description="基于技术指标的模型",
                weight=0.4,
                is_active=True,
                performance_score=0.75
            ),
            AIModel(
                id=uuid.uuid4(),
                name="基本面分析模型",
                model_type=ModelType.FUNDAMENTAL,
                description="基于基本面指标的模型",
                weight=0.3,
                is_active=True,
                performance_score=0.68
            )
        ]

    @pytest_asyncio.fixture
    async def test_decisions(self, test_stocks):
        """创建测试决策"""
        return [
            Decision(
                id=uuid.uuid4(),
                stock_id=test_stocks[0].id,
                decision_type=DecisionType.BUY,
                confidence=0.85,
                target_price=16.50,
                stop_loss_price=14.00,
                time_horizon=30,
                reasoning="技术面和基本面共振，多模型一致看好",
                generated_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=7)
            ),
            Decision(
                id=uuid.uuid4(),
                stock_id=test_stocks[1].id,
                decision_type=DecisionType.HOLD,
                confidence=0.65,
                target_price=19.00,
                stop_loss_price=17.00,
                time_horizon=45,
                reasoning="基本面稳健但技术面偏弱，建议观望",
                generated_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=7)
            )
        ]

    @pytest.mark.asyncio
    async def test_stock_service_get_active_stocks(self, mock_db_session, test_stocks):
        """测试获取活跃股票"""
        # 模拟数据库查询
        mock_db_session.execute.return_value = Mock()
        mock_db_session.execute.return_value.scalars.return_value.all.return_value = test_stocks
        
        service = StockService(mock_db_session)
        stocks = await service.get_active_stocks(limit=10)
        
        assert len(stocks) == len(test_stocks)
        assert stocks[0].symbol == "000001"
        assert stocks[1].symbol == "000002"

    @pytest.mark.asyncio
    async def test_stock_service_get_stocks_by_symbols(self, mock_db_session, test_stocks):
        """测试根据股票代码获取股票"""
        symbols = ["000001", "000002"]
        
        # 模拟数据库查询
        mock_db_session.execute.return_value = Mock()
        mock_db_session.execute.return_value.scalars.return_value.all.return_value = test_stocks
        
        service = StockService(mock_db_session)
        stocks = await service.get_stocks_by_symbols(symbols)
        
        assert len(stocks) == len(test_stocks)
        for stock in stocks:
            assert stock.symbol in symbols

    @pytest.mark.asyncio
    async def test_decision_engine_generate_recommendations(self, mock_db_session, test_stocks, test_models):
        """测试决策引擎生成推荐"""
        # 模拟模型管理器
        mock_model_manager = Mock()
        mock_model_manager.models = {
            test_models[0].id: Mock(spec=BaseBacktestModel),
            test_models[1].id: Mock(spec=BaseBacktestModel)
        }
        
        # 模拟模型信号
        mock_model_manager.run_models_on_data.return_value = {
            test_models[0].id: {
                'model_name': '技术分析模型',
                'signal': {
                    'decision': DecisionType.BUY,
                    'confidence': 0.88,
                    'signal_strength': 0.8,
                    'reasoning': '技术指标显示强势突破'
                },
                'success': True
            },
            test_models[1].id: {
                'model_name': '基本面分析模型',
                'signal': {
                    'decision': DecisionType.BUY,
                    'confidence': 0.82,
                    'signal_strength': 0.7,
                    'reasoning': '基本面数据优秀，估值合理'
                },
                'success': True
            }
        }
        
        # 模拟投票引擎
        mock_voting_engine = Mock(spec=VotingEngine)
        mock_voting_engine.aggregate_votes.return_value = {
            'decision_type': DecisionType.BUY,
            'confidence': 0.85,
            'vote_summary': {'buy': 2, 'sell': 0, 'hold': 0},
            'reasoning': '多模型一致看好'
        }
        
        engine = DecisionEngine(mock_db_session, mock_model_manager, mock_voting_engine)
        
        # 生成推荐
        recommendations = await engine.generate_recommendations(test_stocks, limit=5)
        
        assert len(recommendations) <= 5
        for recommendation in recommendations:
            assert 'stock' in recommendation
            assert 'decision_type' in recommendation
            assert 'confidence' in recommendation
            assert 0 <= recommendation['confidence'] <= 1

    @pytest.mark.asyncio
    async def test_voting_engine_aggregate_votes(self):
        """测试投票引擎聚合投票"""
        voting_engine = VotingEngine()
        
        # 模拟投票数据
        votes = [
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型1',
                'vote_type': DecisionType.BUY,
                'confidence': 0.88,
                'signal_strength': 0.8,
                'weight': 0.4
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型2',
                'vote_type': DecisionType.BUY,
                'confidence': 0.82,
                'signal_strength': 0.7,
                'weight': 0.3
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型3',
                'vote_type': DecisionType.HOLD,
                'confidence': 0.65,
                'signal_strength': 0.3,
                'weight': 0.3
            }
        ]
        
        result = voting_engine.aggregate_votes(votes)
        
        assert 'decision_type' in result
        assert 'confidence' in result
        assert 'vote_summary' in result
        assert 'reasoning' in result
        
        assert result['confidence'] >= 0
        assert result['confidence'] <= 1
        assert isinstance(result['vote_summary'], dict)

    @pytest.mark.asyncio
    async def test_voting_engine_weighted_voting(self):
        """测试加权投票机制"""
        voting_engine = VotingEngine()
        
        # 测试不同权重的投票
        votes = [
            {
                'model_id': uuid.uuid4(),
                'model_name': '高权重模型',
                'vote_type': DecisionType.BUY,
                'confidence': 0.9,
                'signal_strength': 0.9,
                'weight': 0.7  # 高权重
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '低权重模型',
                'vote_type': DecisionType.SELL,
                'confidence': 0.8,
                'signal_strength': 0.8,
                'weight': 0.3  # 低权重
            }
        ]
        
        result = voting_engine.aggregate_votes(votes)
        
        # 高权重模型的投票应该主导决策
        assert result['decision_type'] == DecisionType.BUY
        assert result['confidence'] > 0.5

    @pytest.mark.asyncio
    async def test_decision_engine_filter_expired_decisions(self, mock_db_session, test_decisions):
        """测试过滤过期决策"""
        # 创建一个过期的决策
        expired_decision = Decision(
            id=uuid.uuid4(),
            stock_id=uuid.uuid4(),
            decision_type=DecisionType.BUY,
            confidence=0.8,
            generated_at=datetime.now() - timedelta(days=10),
            expires_at=datetime.now() - timedelta(days=3)  # 已过期
        )
        
        all_decisions = test_decisions + [expired_decision]
        
        # 模拟数据库查询
        mock_db_session.execute.return_value = Mock()
        mock_db_session.execute.return_value.scalars.return_value.all.return_value = all_decisions
        
        engine = DecisionEngine(mock_db_session, Mock(), Mock())
        valid_decisions = await engine.get_valid_decisions()
        
        # 应该只返回未过期的决策
        assert len(valid_decisions) == len(test_decisions)
        for decision in valid_decisions:
            assert decision.expires_at is None or decision.expires_at > datetime.now()

    @pytest.mark.asyncio
    async def test_recommendation_confidence_calculation(self):
        """测试推荐置信度计算"""
        voting_engine = VotingEngine()
        
        # 测试高置信度情况
        high_confidence_votes = [
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型1',
                'vote_type': DecisionType.BUY,
                'confidence': 0.95,
                'signal_strength': 0.9,
                'weight': 0.5
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型2',
                'vote_type': DecisionType.BUY,
                'confidence': 0.92,
                'signal_strength': 0.85,
                'weight': 0.5
            }
        ]
        
        high_result = voting_engine.aggregate_votes(high_confidence_votes)
        assert high_result['confidence'] > 0.9
        
        # 测试低置信度情况
        low_confidence_votes = [
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型1',
                'vote_type': DecisionType.BUY,
                'confidence': 0.55,
                'signal_strength': 0.4,
                'weight': 0.5
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '模型2',
                'vote_type': DecisionType.SELL,
                'confidence': 0.52,
                'signal_strength': 0.3,
                'weight': 0.5
            }
        ]
        
        low_result = voting_engine.aggregate_votes(low_confidence_votes)
        assert low_result['confidence'] < 0.6

    @pytest.mark.asyncio
    async def test_recommendation_reasoning_generation(self):
        """测试推荐理由生成"""
        voting_engine = VotingEngine()
        
        votes = [
            {
                'model_id': uuid.uuid4(),
                'model_name': '技术模型',
                'vote_type': DecisionType.BUY,
                'confidence': 0.88,
                'signal_strength': 0.8,
                'weight': 0.4,
                'reasoning': '技术指标显示强势突破'
            },
            {
                'model_id': uuid.uuid4(),
                'model_name': '基本面模型',
                'vote_type': DecisionType.BUY,
                'confidence': 0.82,
                'signal_strength': 0.7,
                'weight': 0.3,
                'reasoning': '基本面数据优秀，估值合理'
            }
        ]
        
        result = voting_engine.aggregate_votes(votes)
        
        assert 'reasoning' in result
        assert result['reasoning'] is not None
        assert len(result['reasoning']) > 0

    @pytest.mark.asyncio
    async def test_error_handling_in_recommendation_generation(self, mock_db_session):
        """测试推荐生成中的错误处理"""
        # 模拟数据库错误
        mock_db_session.execute.side_effect = Exception("Database error")
        
        engine = DecisionEngine(mock_db_session, Mock(), Mock())
        
        # 应该优雅地处理错误
        with pytest.raises(Exception):
            await engine.generate_recommendations([], limit=5)