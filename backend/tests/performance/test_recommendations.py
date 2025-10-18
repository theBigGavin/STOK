"""
推荐API性能测试
测试推荐端点的性能和负载能力
"""

import pytest
import pytest_asyncio
import asyncio
import time
import statistics
from httpx import AsyncClient
from fastapi import FastAPI
import uuid
from datetime import datetime, timedelta

from src.main import app


class TestRecommendationsPerformance:
    """推荐API性能测试类"""

    @pytest_asyncio.fixture
    async def client(self):
        """创建测试客户端"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.mark.asyncio
    async def test_recommendations_response_time(self, client):
        """测试推荐API响应时间"""
        # 测试单次请求响应时间
        start_time = time.time()
        response = await client.get("/api/v1/decisions/recommendations?limit=10")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 2.0  # 响应时间应小于2秒
        
        print(f"单次请求响应时间: {response_time:.3f}秒")

    @pytest.mark.asyncio
    async def test_recommendations_concurrent_requests(self, client):
        """测试并发请求性能"""
        num_requests = 10
        tasks = []
        
        # 创建并发任务
        for i in range(num_requests):
            task = client.get(f"/api/v1/decisions/recommendations?limit=5&skip={i}")
            tasks.append(task)
        
        # 执行并发请求
        start_time = time.time()
        responses = await asyncio.gather(*tasks)
        end_time = time.time()
        
        total_time = end_time - start_time
        requests_per_second = num_requests / total_time
        
        # 验证所有请求都成功
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count == num_requests
        
        # 性能要求：至少支持5个并发请求/秒
        assert requests_per_second >= 5.0
        
        print(f"并发请求数: {num_requests}")
        print(f"总时间: {total_time:.3f}秒")
        print(f"请求/秒: {requests_per_second:.2f}")

    @pytest.mark.asyncio
    async def test_recommendations_memory_usage(self, client):
        """测试内存使用情况"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 执行多次请求
        for i in range(10):
            await client.get("/api/v1/decisions/recommendations?limit=20")
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 内存增长应小于50MB
        assert memory_increase < 50.0
        
        print(f"初始内存: {initial_memory:.2f}MB")
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")

    @pytest.mark.asyncio
    async def test_recommendations_throughput(self, client):
        """测试吞吐量"""
        num_requests = 50
        response_times = []
        
        # 执行多个连续请求
        for i in range(num_requests):
            start_time = time.time()
            response = await client.get("/api/v1/decisions/recommendations?limit=10")
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append(end_time - start_time)
        
        # 计算统计信息
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        throughput = num_requests / sum(response_times)
        
        # 性能要求
        assert avg_response_time < 1.0  # 平均响应时间小于1秒
        assert throughput >= 10.0  # 吞吐量至少10请求/秒
        
        print(f"请求数量: {num_requests}")
        print(f"平均响应时间: {avg_response_time:.3f}秒")
        print(f"最小响应时间: {min_response_time:.3f}秒")
        print(f"最大响应时间: {max_response_time:.3f}秒")
        print(f"吞吐量: {throughput:.2f} 请求/秒")

    @pytest.mark.asyncio
    async def test_recommendations_different_limits(self, client):
        """测试不同limit参数的性能"""
        limits = [1, 5, 10, 20, 50]
        response_times = {}
        
        for limit in limits:
            start_time = time.time()
            response = await client.get(f"/api/v1/decisions/recommendations?limit={limit}")
            end_time = time.time()
            
            assert response.status_code == 200
            response_time = end_time - start_time
            response_times[limit] = response_time
            
            print(f"Limit {limit}: {response_time:.3f}秒")
        
        # 验证响应时间随limit增加而合理增长
        for i in range(1, len(limits)):
            current_limit = limits[i]
            prev_limit = limits[i-1]
            
            current_time = response_times[current_limit]
            prev_time = response_times[prev_limit]
            
            # 响应时间增长不应超过线性比例
            time_ratio = current_time / prev_time if prev_time > 0 else 1.0
            limit_ratio = current_limit / prev_limit
            
            assert time_ratio <= limit_ratio * 2  # 允许2倍的增长缓冲

    @pytest.mark.asyncio
    async def test_recommendations_stress_test(self, client):
        """测试压力测试"""
        num_requests = 100
        batch_size = 10
        success_count = 0
        error_count = 0
        
        start_time = time.time()
        
        # 分批执行请求
        for batch in range(0, num_requests, batch_size):
            tasks = []
            for i in range(batch, min(batch + batch_size, num_requests)):
                task = client.get("/api/v1/decisions/recommendations?limit=5")
                tasks.append(task)
            
            try:
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                for response in responses:
                    if isinstance(response, Exception):
                        error_count += 1
                    elif response.status_code == 200:
                        success_count += 1
                    else:
                        error_count += 1
            except Exception as e:
                error_count += batch_size
        
        end_time = time.time()
        total_time = end_time - start_time
        
        success_rate = success_count / num_requests
        
        # 性能要求
        assert success_rate >= 0.95  # 95%成功率
        assert total_time < 30.0  # 总时间小于30秒
        
        print(f"压力测试结果:")
        print(f"总请求数: {num_requests}")
        print(f"成功数: {success_count}")
        print(f"失败数: {error_count}")
        print(f"成功率: {success_rate:.2%}")
        print(f"总时间: {total_time:.2f}秒")

    @pytest.mark.asyncio
    async def test_recommendations_caching_performance(self, client):
        """测试缓存性能"""
        # 第一次请求（可能未缓存）
        start_time_1 = time.time()
        response_1 = await client.get("/api/v1/decisions/recommendations?limit=10")
        end_time_1 = time.time()
        time_1 = end_time_1 - start_time_1
        
        # 第二次请求（应该从缓存中获取）
        start_time_2 = time.time()
        response_2 = await client.get("/api/v1/decisions/recommendations?limit=10")
        end_time_2 = time.time()
        time_2 = end_time_2 - start_time_2
        
        assert response_1.status_code == 200
        assert response_2.status_code == 200
        
        # 第二次请求应该更快（如果启用了缓存）
        # 注意：这里只是记录时间，不强制要求缓存，因为缓存可能未启用
        print(f"第一次请求时间: {time_1:.3f}秒")
        print(f"第二次请求时间: {time_2:.3f}秒")
        print(f"性能提升: {(time_1 - time_2) / time_1 * 100:.1f}%")

    @pytest.mark.asyncio
    async def test_recommendations_error_rate_under_load(self, client):
        """测试负载下的错误率"""
        num_requests = 50
        concurrent_requests = 5
        error_count = 0
        
        # 创建并发请求组
        for i in range(0, num_requests, concurrent_requests):
            tasks = []
            for j in range(concurrent_requests):
                task = client.get("/api/v1/decisions/recommendations?limit=10")
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for response in responses:
                if isinstance(response, Exception):
                    error_count += 1
                elif response.status_code != 200:
                    error_count += 1
        
        error_rate = error_count / num_requests
        
        # 错误率应小于5%
        assert error_rate < 0.05
        
        print(f"负载测试错误率: {error_rate:.2%}")

    @pytest.mark.asyncio
    async def test_recommendations_resource_utilization(self, client):
        """测试资源利用率"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        
        # 记录初始资源使用
        initial_cpu = process.cpu_percent()
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        # 执行负载测试
        num_requests = 20
        tasks = [client.get("/api/v1/decisions/recommendations?limit=10") 
                for _ in range(num_requests)]
        
        await asyncio.gather(*tasks)
        
        # 记录最终资源使用
        final_cpu = process.cpu_percent()
        final_memory = process.memory_info().rss / 1024 / 1024
        
        cpu_increase = final_cpu - initial_cpu
        memory_increase = final_memory - initial_memory
        
        # 资源使用应在合理范围内
        assert cpu_increase < 50.0  # CPU使用增长小于50%
        assert memory_increase < 100.0  # 内存增长小于100MB
        
        print(f"CPU使用增长: {cpu_increase:.1f}%")
        print(f"内存增长: {memory_increase:.2f}MB")

    @pytest.mark.asyncio
    async def test_recommendations_scalability(self, client):
        """测试可扩展性"""
        request_counts = [1, 5, 10, 20]
        response_times = []
        
        for count in request_counts:
            start_time = time.time()
            
            tasks = [client.get("/api/v1/decisions/recommendations?limit=5") 
                    for _ in range(count)]
            await asyncio.gather(*tasks)
            
            end_time = time.time()
            avg_time = (end_time - start_time) / count
            response_times.append(avg_time)
            
            print(f"并发数 {count}: 平均响应时间 {avg_time:.3f}秒")
        
        # 验证响应时间增长趋势
        # 随着并发数增加，平均响应时间增长应相对平缓
        for i in range(1, len(response_times)):
            growth_ratio = response_times[i] / response_times[0]
            expected_growth = 1.0 + (i * 0.2)  # 允许每级增长20%
            
            assert growth_ratio <= expected_growth

    @pytest.mark.asyncio
    async def test_recommendations_long_running_performance(self, client):
        """测试长时间运行性能"""
        duration = 30  # 秒
        start_time = time.time()
        request_count = 0
        error_count = 0
        
        while time.time() - start_time < duration:
            try:
                response = await client.get("/api/v1/decisions/recommendations?limit=5")
                if response.status_code == 200:
                    request_count += 1
                else:
                    error_count += 1
            except Exception:
                error_count += 1
            
            # 短暂休息以避免过度负载
            await asyncio.sleep(0.1)
        
        total_time = time.time() - start_time
        requests_per_second = request_count / total_time
        error_rate = error_count / (request_count + error_count) if request_count + error_count > 0 else 0
        
        # 性能要求
        assert requests_per_second >= 2.0  # 至少2请求/秒
        assert error_rate < 0.05  # 错误率小于5%
        
        print(f"长时间运行测试:")
        print(f"持续时间: {duration}秒")
        print(f"总请求数: {request_count}")
        print(f"错误数: {error_count}")
        print(f"错误率: {error_rate:.2%}")
        print(f"请求/秒: {requests_per_second:.2f}")