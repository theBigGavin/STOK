"""
推荐用户旅程集成测试
测试完整的推荐功能用户旅程
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timedelta

from src.main import app
from src.models.database import Stock, AIModel, Decision, VoteResult
from src.models.stock_models import APIResponse, DecisionType, ModelType


class TestRecommendationsIntegration:
    """推荐用户旅程集成测试类"""

    @pytest_asyncio.fixture
    async def client(self):
        """创建测试客户端"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest_asyncio.fixture
    async def test_data(self, db_session: AsyncSession):
        """创建测试数据"""
        # 创建测试股票
        stock1 = Stock(
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
        )
        
        stock2 = Stock(
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

        # 创建测试AI模型
        model1 = AIModel(
            id=uuid.uuid4(),
            name="技术分析模型",
            model_type=ModelType.TECHNICAL,
            description="基于技术指标的模型",
            weight=0.4,
            is_active=True,
            performance_score=0.75
        )
        
        model2 = AIModel(
            id=uuid.uuid4(),
            name="基本面分析模型", 
            model_type=ModelType.FUNDAMENTAL,
            description="基于基本面指标的模型",
            weight=0.3,
            is_active=True,
            performance_score=0.68
        )

        # 创建测试决策
        decision1 = Decision(
            id=uuid.uuid4(),
            stock_id=stock1.id,
            decision_type=DecisionType.BUY,
            confidence=0.85,
            target_price=16.50,
            stop_loss_price=14.00,
            time_horizon=30,
            reasoning="技术面和基本面共振，多模型一致看好",
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )
        
        decision2 = Decision(
            id=uuid.uuid4(),
            stock_id=stock2.id,
            decision_type=DecisionType.HOLD,
            confidence=0.65,
            target_price=19.00,
            stop_loss_price=17.00,
            time_horizon=45,
            reasoning="基本面稳健但技术面偏弱，建议观望",
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )

        # 创建投票结果
        vote1_1 = VoteResult(
            id=uuid.uuid4(),
            decision_id=decision1.id,
            model_id=model1.id,
            vote_type=DecisionType.BUY,
            confidence=0.88,
            signal_strength=0.8,
            reasoning="技术指标显示强势突破"
        )
        
        vote1_2 = VoteResult(
            id=uuid.uuid4(),
            decision_id=decision1.id,
            model_id=model2.id,
            vote_type=DecisionType.BUY,
            confidence=0.82,
            signal_strength=0.7,
            reasoning="基本面数据优秀，估值合理"
        )
        
        vote2_1 = VoteResult(
            id=uuid.uuid4(),
            decision_id=decision2.id,
            model_id=model1.id,
            vote_type=DecisionType.HOLD,
            confidence=0.60,
            signal_strength=0.3,
            reasoning="技术面震荡，方向不明"
        )
        
        vote2_2 = VoteResult(
            id=uuid.uuid4(),
            decision_id=decision2.id,
            model_id=model2.id,
            vote_type=DecisionType.HOLD,
            confidence=0.70,
            signal_strength=0.4,
            reasoning="基本面稳健但缺乏催化剂"
        )

        # 添加到数据库
        db_session.add_all([
            stock1, stock2, model1, model2, 
            decision1, decision2, vote1_1, vote1_2, vote2_1, vote2_2
        ])
        await db_session.commit()

        return {
            "stocks": [stock1, stock2],
            "models": [model1, model2],
            "decisions": [decision1, decision2],
            "votes": [vote1_1, vote1_2, vote2_1, vote2_2]
        }

    @pytest.mark.asyncio
    async def test_recommendations_full_workflow(self, client, test_data):
        """测试完整的推荐工作流"""
        # 1. 获取推荐列表
        response = await client.get("/api/v1/decisions/recommendations?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert "recommendations" in data["data"]
        
        recommendations = data["data"]["recommendations"]
        assert len(recommendations) > 0
        
        # 2. 验证推荐项格式
        for recommendation in recommendations:
            assert "id" in recommendation
            assert "stock" in recommendation
            assert "decision_type" in recommendation
            assert "confidence" in recommendation
            
            stock = recommendation["stock"]
            assert "symbol" in stock
            assert "name" in stock
            assert "market" in stock
            
            # 验证决策类型
            assert recommendation["decision_type"] in ["buy", "sell", "hold"]
            
            # 验证置信度范围
            assert 0 <= recommendation["confidence"] <= 1

    @pytest.mark.asyncio
    async def test_recommendations_with_symbols_filter(self, client, test_data):
        """测试带股票代码过滤的推荐"""
        test_stock = test_data["stocks"][0]
        
        response = await client.get(
            f"/api/v1/decisions/recommendations?symbols={test_stock.symbol}&limit=5"
        )
        assert response.status_code == 200
        
        data = response.json()
        recommendations = data["data"]["recommendations"]
        
        # 验证返回的推荐包含指定股票
        if recommendations:
            symbols = [rec["stock"]["symbol"] for rec in recommendations]
            assert test_stock.symbol in symbols

    @pytest.mark.asyncio
    async def test_recommendations_limit_functionality(self, client, test_data):
        """测试limit参数功能"""
        # 测试不同limit值
        for limit in [1, 3, 5]:
            response = await client.get(f"/api/v1/decisions/recommendations?limit={limit}")
            assert response.status_code == 200
            
            data = response.json()
            recommendations = data["data"]["recommendations"]
            assert len(recommendations) <= limit

    @pytest.mark.asyncio
    async def test_recommendations_decision_details(self, client, test_data):
        """测试推荐决策详情"""
        # 获取推荐列表
        response = await client.get("/api/v1/decisions/recommendations?limit=1")
        assert response.status_code == 200
        
        data = response.json()
        recommendations = data["data"]["recommendations"]
        
        if recommendations:
            recommendation = recommendations[0]
            
            # 验证决策详情格式
            assert "target_price" in recommendation or recommendation["target_price"] is None
            assert "stop_loss_price" in recommendation or recommendation["stop_loss_price"] is None
            assert "time_horizon" in recommendation or recommendation["time_horizon"] is None
            assert "reasoning" in recommendation or recommendation["reasoning"] is None

    @pytest.mark.asyncio
    async def test_recommendations_error_handling(self, client):
        """测试错误处理"""
        # 测试无效limit
        response = await client.get("/api/v1/decisions/recommendations?limit=0")
        assert response.status_code in [400, 422]
        
        # 测试无效symbols
        response = await client.get("/api/v1/decisions/recommendations?symbols=INVALID")
        assert response.status_code in [200, 400, 404]  # 可能返回空列表或错误

    @pytest.mark.asyncio
    async def test_recommendations_performance(self, client, test_data):
        """测试推荐性能"""
        import time
        
        start_time = time.time()
        response = await client.get("/api/v1/decisions/recommendations?limit=10")
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 5.0  # 响应时间应小于5秒

    @pytest.mark.asyncio
    async def test_recommendations_data_consistency(self, client, test_data):
        """测试数据一致性"""
        # 多次请求应该返回一致的结果（在短时间内）
        responses = []
        for _ in range(3):
            response = await client.get("/api/v1/decisions/recommendations?limit=5")
            assert response.status_code == 200
            responses.append(response.json())
        
        # 验证基本结构一致性
        for response in responses:
            assert "data" in response
            assert "recommendations" in response["data"]
            assert isinstance(response["data"]["recommendations"], list)

    @pytest.mark.asyncio
    async def test_recommendations_empty_case(self, client):
        """测试空数据情况"""
        # 当没有数据时应该返回空列表而不是错误
        response = await client.get("/api/v1/decisions/recommendations?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert "recommendations" in data["data"]
        assert isinstance(data["data"]["recommendations"], list)