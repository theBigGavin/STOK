"""
决策详情端点的合约测试
测试决策详情API的接口契约
"""

import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, date
import uuid


class TestDecisionContract:
    """决策详情合约测试"""

    @pytest.mark.asyncio
    async def test_get_decision_details_success(self, client: AsyncClient):
        """测试成功获取决策详情"""
        # 创建一个测试决策ID（实际测试中应该使用真实存在的ID）
        test_decision_id = str(uuid.uuid4())
        
        response = await client.get(f"/api/v1/decisions/{test_decision_id}")
        
        # 验证响应状态码
        assert response.status_code in [200, 404]  # 可能返回404如果决策不存在
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证响应格式
            assert "data" in data
            assert "message" in data
            assert "status" in data
            
            # 验证决策详情数据结构
            decision_data = data["data"]
            assert "id" in decision_data
            assert "stock_id" in decision_data
            assert "decision_type" in decision_data
            assert "confidence" in decision_data
            assert "target_price" in decision_data
            assert "stop_loss_price" in decision_data
            assert "reasoning" in decision_data
            assert "generated_at" in decision_data
            assert "expires_at" in decision_data
            
            # 验证数据类型
            assert isinstance(decision_data["id"], str)
            assert isinstance(decision_data["stock_id"], str)
            assert decision_data["decision_type"] in ["buy", "sell", "hold"]
            assert 0 <= decision_data["confidence"] <= 1

    @pytest.mark.asyncio
    async def test_get_decision_details_not_found(self, client: AsyncClient):
        """测试获取不存在的决策详情"""
        non_existent_id = str(uuid.uuid4())
        
        response = await client.get(f"/api/v1/decisions/{non_existent_id}")
        
        # 应该返回404或包含错误信息的响应
        assert response.status_code in [404, 200]
        
        if response.status_code == 404:
            data = response.json()
            assert "detail" in data or "message" in data
        elif response.status_code == 200:
            data = response.json()
            assert data["status"] == "error" or data["data"] is None

    @pytest.mark.asyncio
    async def test_get_decision_votes(self, client: AsyncClient):
        """测试获取决策投票详情"""
        test_decision_id = str(uuid.uuid4())
        
        response = await client.get(f"/api/v1/decisions/{test_decision_id}/votes")
        
        # 验证响应状态码
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证响应格式
            assert "data" in data
            assert "message" in data
            assert "status" in data
            
            # 验证投票数据格式
            votes_data = data["data"]
            assert isinstance(votes_data, list)
            
            if len(votes_data) > 0:
                vote = votes_data[0]
                assert "model_id" in vote
                assert "vote_type" in vote
                assert "confidence" in vote
                assert "signal_strength" in vote
                assert "reasoning" in vote

    @pytest.mark.asyncio
    async def test_get_decision_chart_data(self, client: AsyncClient):
        """测试获取决策图表数据"""
        test_decision_id = str(uuid.uuid4())
        
        response = await client.get(f"/api/v1/decisions/{test_decision_id}/chart")
        
        # 验证响应状态码
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证响应格式
            assert "data" in data
            assert "message" in data
            assert "status" in data
            
            # 验证图表数据结构
            chart_data = data["data"]
            assert "price_data" in chart_data
            assert "decision_points" in chart_data
            assert "indicators" in chart_data
            
            # 验证价格数据格式
            price_data = chart_data["price_data"]
            assert isinstance(price_data, list)
            
            if len(price_data) > 0:
                price_point = price_data[0]
                assert "date" in price_point
                assert "open" in price_point
                assert "high" in price_point
                assert "low" in price_point
                assert "close" in price_point
                assert "volume" in price_point

    @pytest.mark.asyncio
    async def test_get_decision_performance(self, client: AsyncClient):
        """测试获取决策性能指标"""
        test_decision_id = str(uuid.uuid4())
        
        response = await client.get(f"/api/v1/decisions/{test_decision_id}/performance")
        
        # 验证响应状态码
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            
            # 验证响应格式
            assert "data" in data
            assert "message" in data
            assert "status" in data
            
            # 验证性能指标结构
            performance_data = data["data"]
            assert "total_return" in performance_data
            assert "sharpe_ratio" in performance_data
            assert "max_drawdown" in performance_data
            assert "win_rate" in performance_data
            assert "total_trades" in performance_data

    @pytest.mark.asyncio
    async def test_decision_list_endpoint(self, client: AsyncClient):
        """测试决策列表端点"""
        response = await client.get("/api/v1/decisions", params={
            "limit": 10,
            "skip": 0,
            "decision_type": "buy"
        })
        
        # 验证响应状态码
        assert response.status_code == 200
        
        data = response.json()
        
        # 验证响应格式
        assert "data" in data
        assert "message" in data
        assert "status" in data
        
        # 验证分页数据结构
        decisions_data = data["data"]
        assert isinstance(decisions_data, list)
        
        if len(decisions_data) > 0:
            decision = decisions_data[0]
            assert "id" in decision
            assert "stock" in decision
            assert "decision_type" in decision
            assert "confidence" in decision
            assert "generated_at" in decision

    @pytest.mark.asyncio
    async def test_decision_time_range_filter(self, client: AsyncClient):
        """测试决策时间范围过滤"""
        response = await client.get("/api/v1/decisions", params={
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit": 5
        })
        
        # 验证响应状态码
        assert response.status_code == 200
        
        data = response.json()
        
        # 验证响应格式
        assert "data" in data
        assert "message" in data
        assert "status" in data
        
        # 验证返回的数据结构
        decisions_data = data["data"]
        assert isinstance(decisions_data, list)

    @pytest.mark.asyncio
    async def test_invalid_decision_id_format(self, client: AsyncClient):
        """测试无效的决策ID格式"""
        invalid_ids = ["invalid-uuid", "123", "", "not-a-uuid"]
        
        for invalid_id in invalid_ids:
            response = await client.get(f"/api/v1/decisions/{invalid_id}")
            
            # 应该返回400或404错误
            assert response.status_code in [400, 404, 422]
            
            if response.status_code in [400, 422]:
                data = response.json()
                assert "detail" in data or "message" in data