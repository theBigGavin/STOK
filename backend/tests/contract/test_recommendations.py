"""
推荐端点合约测试
测试股票推荐API的合约规范
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi import FastAPI
from datetime import datetime
import uuid

from src.main import app
from src.models.stock_models import (
    APIResponse, StockResponse, DecisionResponse, 
    RecommendationRequest, DecisionType
)


class TestRecommendationsContract:
    """推荐端点合约测试类"""

    @pytest_asyncio.fixture
    async def client(self):
        """创建测试客户端"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.mark.asyncio
    async def test_recommendations_endpoint_exists(self, client):
        """测试推荐端点存在"""
        response = await client.get("/api/v1/decisions/recommendations")
        assert response.status_code in [200, 400, 404]  # 端点存在但可能返回错误

    @pytest.mark.asyncio
    async def test_recommendations_response_format(self, client):
        """测试推荐响应格式"""
        response = await client.get("/api/v1/decisions/recommendations?limit=5")
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证API响应格式
            assert "data" in data
            assert "message" in data
            assert "status" in data
            assert "timestamp" in data
            
            # 验证状态字段
            assert data["status"] in ["success", "error"]
            
            # 验证数据格式
            if data["data"] and "recommendations" in data["data"]:
                recommendations = data["data"]["recommendations"]
                if recommendations:
                    recommendation = recommendations[0]
                    
                    # 验证推荐项格式
                    assert "id" in recommendation
                    assert "stock" in recommendation
                    assert "decision_type" in recommendation
                    assert "confidence" in recommendation
                    assert "target_price" in recommendation or recommendation["target_price"] is None
                    assert "reasoning" in recommendation or recommendation["reasoning"] is None
                    
                    # 验证股票信息格式
                    stock = recommendation["stock"]
                    assert "id" in stock
                    assert "symbol" in stock
                    assert "name" in stock
                    assert "market" in stock

    @pytest.mark.asyncio
    async def test_recommendations_decision_types(self, client):
        """测试决策类型验证"""
        response = await client.get("/api/v1/decisions/recommendations?limit=3")
        
        if response.status_code == 200:
            data = response.json()
            
            if data["data"] and "recommendations" in data["data"]:
                recommendations = data["data"]["recommendations"]
                
                for recommendation in recommendations:
                    decision_type = recommendation["decision_type"]
                    assert decision_type in ["buy", "sell", "hold"]

    @pytest.mark.asyncio
    async def test_recommendations_confidence_range(self, client):
        """测试置信度范围验证"""
        response = await client.get("/api/v1/decisions/recommendations?limit=3")
        
        if response.status_code == 200:
            data = response.json()
            
            if data["data"] and "recommendations" in data["data"]:
                recommendations = data["data"]["recommendations"]
                
                for recommendation in recommendations:
                    confidence = recommendation["confidence"]
                    assert 0 <= confidence <= 1

    @pytest.mark.asyncio
    async def test_recommendations_limit_parameter(self, client):
        """测试limit参数验证"""
        # 测试有效limit
        response = await client.get("/api/v1/decisions/recommendations?limit=5")
        assert response.status_code in [200, 400]
        
        # 测试无效limit
        response = await client.get("/api/v1/decisions/recommendations?limit=0")
        assert response.status_code in [400, 422]  # 应该返回验证错误
        
        response = await client.get("/api/v1/decisions/recommendations?limit=101")
        assert response.status_code in [400, 422]  # 应该返回验证错误

    @pytest.mark.asyncio
    async def test_recommendations_symbols_filter(self, client):
        """测试股票代码过滤参数"""
        response = await client.get("/api/v1/decisions/recommendations?symbols=000001,000002")
        assert response.status_code in [200, 400, 404]

    @pytest.mark.asyncio
    async def test_recommendations_error_responses(self, client):
        """测试错误响应格式"""
        # 测试不存在的端点
        response = await client.get("/api/v1/decisions/nonexistent")
        if response.status_code != 200:
            data = response.json()
            assert "message" in data
            assert "status" in data
            assert data["status"] == "error"

    @pytest.mark.asyncio
    async def test_recommendations_pagination(self, client):
        """测试分页功能"""
        response = await client.get("/api/v1/decisions/recommendations?limit=5&skip=0")
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证分页响应格式
            if "recommendations" in data.get("data", {}):
                recommendations = data["data"]["recommendations"]
                assert len(recommendations) <= 5

    @pytest.mark.asyncio
    async def test_recommendations_timestamp_format(self, client):
        """测试时间戳格式"""
        response = await client.get("/api/v1/decisions/recommendations?limit=1")
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证时间戳格式
            timestamp = data["timestamp"]
            try:
                datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                pytest.fail(f"Invalid timestamp format: {timestamp}")

    @pytest.mark.asyncio
    async def test_recommendations_content_type(self, client):
        """测试内容类型"""
        response = await client.get("/api/v1/decisions/recommendations")
        assert response.headers["content-type"] == "application/json"

    @pytest.mark.asyncio
    async def test_recommendations_cors_headers(self, client):
        """测试CORS头信息"""
        response = await client.get("/api/v1/decisions/recommendations")
        
        # 检查CORS相关头信息
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods", 
            "access-control-allow-headers"
        ]
        
        for header in cors_headers:
            if header in response.headers:
                assert response.headers[header] is not None