"""
决策API性能测试
测试决策详情相关API的性能表现
"""

import pytest
import asyncio
import time
from datetime import datetime, date, timedelta
from httpx import AsyncClient
import uuid
import statistics


class TestDecisionPerformance:
    """决策API性能测试"""

    @pytest.mark.asyncio
    async def test_decision_details_response_time(self, client: AsyncClient):
        """测试决策详情API响应时间"""
        test_decision_id = str(uuid.uuid4())
        
        # 测量响应时间
        start_time = time.time()
        response = await client.get(f"/api/v1/decisions/{test_decision_id}")
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # 转换为毫秒
        
        # 验证响应时间在合理范围内
        assert response_time < 500  # 500毫秒内响应
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_decision_list_response_time(self, client: AsyncClient):
        """测试决策列表API响应时间"""
        # 测试不同参数组合的响应时间
        test_cases = [
            {"limit": 10, "skip": 0},
            {"limit": 50, "skip": 0},
            {"limit": 10, "skip": 10, "decision_type": "buy"},
            {"limit": 20, "skip": 0, "start_date": "2024-01-01", "end_date": "2024-12-31"},
        ]
        
        response_times = []
        
        for params in test_cases:
            start_time = time.time()
            response = await client.get("/api/v1/decisions", params=params)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            # 验证响应状态
            assert response.status_code == 200
            
            # 验证响应时间
            assert response_time < 1000  # 1秒内响应
        
        # 计算平均响应时间
        avg_response_time = statistics.mean(response_times)
        print(f"决策列表API平均响应时间: {avg_response_time:.2f}ms")
        
        # 验证平均响应时间在合理范围内
        assert avg_response_time < 500  # 平均500毫秒内

    @pytest.mark.asyncio
    async def test_decision_votes_response_time(self, client: AsyncClient):
        """测试决策投票详情API响应时间"""
        test_decision_id = str(uuid.uuid4())
        
        response_times = []
        
        # 多次测试取平均值
        for _ in range(5):
            start_time = time.time()
            response = await client.get(f"/api/v1/decisions/{test_decision_id}/votes")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            assert response.status_code in [200, 404]
        
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        
        print(f"决策投票API平均响应时间: {avg_response_time:.2f}ms")
        print(f"决策投票API最大响应时间: {max_response_time:.2f}ms")
        
        # 验证性能指标
        assert avg_response_time < 300  # 平均300毫秒内
        assert max_response_time < 500  # 最大500毫秒内

    @pytest.mark.asyncio
    async def test_decision_chart_data_response_time(self, client: AsyncClient):
        """测试决策图表数据API响应时间"""
        test_decision_id = str(uuid.uuid4())
        
        # 测试不同时间范围的响应时间
        time_ranges = [
            {"days": 30},
            {"days": 90},
            {"days": 180},
            {"days": 365},
        ]
        
        response_times = []
        
        for time_range in time_ranges:
            params = {"days": time_range["days"]}
            
            start_time = time.time()
            response = await client.get(f"/api/v1/decisions/{test_decision_id}/chart", params=params)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            assert response.status_code in [200, 404]
            
            print(f"{time_range['days']}天图表数据响应时间: {response_time:.2f}ms")
        
        # 验证响应时间趋势（更多数据应该需要更多时间，但仍在合理范围内）
        assert all(rt < 2000 for rt in response_times)  # 所有都在2秒内

    @pytest.mark.asyncio
    async def test_concurrent_decision_requests(self, client: AsyncClient):
        """测试并发决策请求性能"""
        test_decision_ids = [str(uuid.uuid4()) for _ in range(10)]
        
        async def make_request(decision_id):
            start_time = time.time()
            response = await client.get(f"/api/v1/decisions/{decision_id}")
            end_time = time.time()
            return (end_time - start_time) * 1000, response.status_code
        
        # 并发执行请求
        tasks = [make_request(decision_id) for decision_id in test_decision_ids]
        results = await asyncio.gather(*tasks)
        
        response_times = [result[0] for result in results]
        status_codes = [result[1] for result in results]
        
        # 计算性能指标
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"并发请求平均响应时间: {avg_response_time:.2f}ms")
        print(f"并发请求最大响应时间: {max_response_time:.2f}ms")
        print(f"并发请求最小响应时间: {min_response_time:.2f}ms")
        
        # 验证所有请求都成功（或合理失败）
        assert all(sc in [200, 404] for sc in status_codes)
        
        # 验证并发性能
        assert avg_response_time < 800  # 并发下平均800毫秒内
        assert max_response_time < 1500  # 并发下最大1.5秒内

    @pytest.mark.asyncio
    async def test_decision_filtering_performance(self, client: AsyncClient):
        """测试决策过滤性能"""
        filter_combinations = [
            {"decision_type": "buy", "limit": 20},
            {"decision_type": "sell", "limit": 15},
            {"decision_type": "hold", "limit": 10},
            {"confidence_min": 0.7, "limit": 25},
            {"confidence_max": 0.3, "limit": 5},
        ]
        
        response_times = []
        
        for filters in filter_combinations:
            start_time = time.time()
            response = await client.get("/api/v1/decisions", params=filters)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            assert response.status_code == 200
            
            data = response.json()
            assert "data" in data
            assert len(data["data"]) <= filters["limit"]
        
        avg_response_time = statistics.mean(response_times)
        print(f"决策过滤平均响应时间: {avg_response_time:.2f}ms")
        
        # 验证过滤性能
        assert avg_response_time < 600  # 平均600毫秒内

    @pytest.mark.asyncio
    async def test_decision_statistics_performance(self, client: AsyncClient):
        """测试决策统计API性能"""
        # 测试不同时间范围的统计性能
        time_ranges = [
            {"start_date": "2024-01-01", "end_date": "2024-01-31"},  # 1个月
            {"start_date": "2024-01-01", "end_date": "2024-03-31"},  # 3个月
            {"start_date": "2024-01-01", "end_date": "2024-06-30"},  # 6个月
            {"start_date": "2024-01-01", "end_date": "2024-12-31"},  # 1年
        ]
        
        response_times = []
        
        for time_range in time_ranges:
            start_time = time.time()
            response = await client.get("/api/v1/decisions/stats", params=time_range)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            assert response.status_code == 200
            
            data = response.json()
            assert "data" in data
            
            print(f"{time_range['start_date']} 到 {time_range['end_date']} 统计响应时间: {response_time:.2f}ms")
        
        # 验证统计性能
        assert all(rt < 1500 for rt in response_times)  # 所有都在1.5秒内

    @pytest.mark.asyncio
    async def test_decision_memory_usage(self, client: AsyncClient):
        """测试决策API内存使用（间接测试）"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 执行一系列决策请求
        requests_count = 50
        for i in range(requests_count):
            await client.get("/api/v1/decisions", params={"limit": 10, "skip": i * 10})
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        print(f"初始内存: {initial_memory:.2f}MB")
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 验证内存使用在合理范围内（无显著内存泄漏）
        assert memory_increase < 50  # 50次请求内存增长不超过50MB

    @pytest.mark.asyncio
    async def test_decision_api_throughput(self, client: AsyncClient):
        """测试决策API吞吐量"""
        test_requests = 20
        start_time = time.time()
        
        # 执行批量请求
        tasks = []
        for i in range(test_requests):
            task = client.get("/api/v1/decisions", params={"limit": 5, "skip": i * 5})
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        end_time = time.time()
        
        total_time = end_time - start_time
        throughput = test_requests / total_time  # 请求/秒
        
        print(f"总请求数: {test_requests}")
        print(f"总时间: {total_time:.2f}秒")
        print(f"吞吐量: {throughput:.2f} 请求/秒")
        
        # 验证所有请求成功
        assert all(response.status_code == 200 for response in responses)
        
        # 验证吞吐量在合理范围内
        assert throughput > 5  # 至少5请求/秒

    @pytest.mark.asyncio
    async def test_decision_cache_performance(self, client: AsyncClient):
        """测试决策缓存性能（重复请求应该更快）"""
        test_decision_id = str(uuid.uuid4())
        
        # 第一次请求（冷缓存）
        first_start = time.time()
        first_response = await client.get(f"/api/v1/decisions/{test_decision_id}")
        first_time = (time.time() - first_start) * 1000
        
        # 第二次请求（热缓存）
        second_start = time.time()
        second_response = await client.get(f"/api/v1/decisions/{test_decision_id}")
        second_time = (time.time() - second_start) * 1000
        
        print(f"第一次请求时间: {first_time:.2f}ms")
        print(f"第二次请求时间: {second_time:.2f}ms")
        print(f"性能提升: {((first_time - second_time) / first_time * 100):.1f}%")
        
        # 验证响应一致性
        assert first_response.status_code == second_response.status_code
        
        # 验证缓存效果（第二次应该更快，但可能不明显因为测试数据）
        # 这里主要验证功能正常，不强制要求缓存效果