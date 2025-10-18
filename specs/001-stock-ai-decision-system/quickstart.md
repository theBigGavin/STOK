# 快速入门指南: 股票 AI 策略回测决策系统

**Feature**: 001-stock-ai-decision-system  
**Date**: 2025-10-18  
**Status**: Draft

## 系统概述

股票 AI 策略回测决策系统是一个基于多个 AI 模型的股票交易决策平台，通过多模型投票机制提供股票推荐和买卖决策点，帮助投资者提高投资成功率并降低风险。

## 快速开始

### 1. 环境要求

**系统要求**:

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (前端开发)
- Python 3.9+ (后端开发)

**硬件要求**:

- 内存: 8GB+ (推荐 16GB)
- 存储: 10GB+ 可用空间
- 网络: 稳定的互联网连接

### 2. 一键启动开发环境

```bash
# 克隆项目
git clone <repository-url>
cd STOK2

# 启动开发环境
./scripts/start-dev.sh
```

这个脚本会自动:

- 启动 PostgreSQL 数据库
- 启动 Redis 缓存和消息队列
- 启动后端 FastAPI 服务
- 启动前端 Nuxt 开发服务器

### 3. 访问系统

**前端应用**: http://localhost:3000  
**后端 API**: http://localhost:8099  
**API 文档**: http://localhost:8099/docs

### 4. 初始配置

#### 数据库初始化

```bash
# 运行数据库迁移
./scripts/run_migrations.sh

# 导入测试数据 (可选)
psql -h localhost -U postgres -d stock_db -f data/migrations/seed_test_data.sql
```

#### 环境变量配置

复制环境变量模板并配置:

```bash
# 后端配置
cp backend/.env.example backend/.env.development

# 前端配置
cp nuxtfrontend/.env.example nuxtfrontend/.env
```

### 5. 核心功能体验

#### 获取股票推荐

```bash
# 使用 curl 测试 API
curl "http://localhost:8099/api/v1/decisions/recommendations?limit=5"
```

响应示例:

```json
{
  "data": {
    "recommendations": [
      {
        "id": "uuid",
        "stock": {
          "symbol": "000001",
          "name": "平安银行",
          "industry": "银行"
        },
        "decision_type": "buy",
        "confidence": 0.85,
        "target_price": 15.2,
        "reasoning": "多模型一致看好，技术面和基本面共振"
      }
    ]
  },
  "message": "成功获取推荐",
  "status": "success"
}
```

#### 查看决策详情

```bash
curl "http://localhost:8099/api/v1/decisions/{decision_id}"
```

#### 执行回测分析

```bash
curl -X POST "http://localhost:8099/api/v1/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "000001",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "initial_capital": 100000
  }'
```

### 6. 开发工作流

#### 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 运行测试
pytest tests/
```

#### 前端开发

```bash
# 进入前端目录
cd nuxtfrontend

# 安装依赖
pnpm install

# 运行开发服务器
pnpm dev

# 运行测试
pnpm test
```

### 7. 数据流说明

#### 实时决策流程

1. **数据获取**: 从数据源获取实时股票数据
2. **特征工程**: 计算技术指标和基本面指标
3. **模型推理**: 多个 AI 模型并行生成信号
4. **投票聚合**: 基于权重聚合模型投票结果
5. **决策生成**: 生成最终决策和置信度

#### 回测流程

1. **历史数据加载**: 加载指定时间段的股票数据
2. **模拟交易**: 按照决策规则执行模拟交易
3. **性能计算**: 计算收益率、夏普比率等指标
4. **结果存储**: 保存回测结果供分析使用

### 8. 关键配置

#### 模型权重配置

在 `backend/src/config/model_weights.py` 中配置:

```python
MODEL_WEIGHTS = {
    "technical_model": 0.4,
    "fundamental_model": 0.3,
    "machine_learning_model": 0.3
}
```

#### 决策阈值配置

在 `backend/src/config/decision_thresholds.py` 中配置:

```python
DECISION_THRESHOLDS = {
    "buy_confidence": 0.7,
    "sell_confidence": 0.6,
    "hold_confidence": 0.5
}
```

### 9. 监控和调试

#### 系统监控

- **API 监控**: http://localhost:8099/health
- **数据库监控**: 使用 pgAdmin 或 psql
- **Redis 监控**: 使用 redis-cli

#### 日志查看

```bash
# 查看后端日志
docker logs stok-backend

# 查看前端日志
cd nuxtfrontend && pnpm dev
```

### 10. 故障排除

#### 常见问题

**数据库连接失败**:

- 检查 PostgreSQL 服务是否运行
- 验证数据库连接配置

**Redis 连接失败**:

- 检查 Redis 服务是否运行
- 验证 Redis 配置

**API 响应慢**:

- 检查数据库查询性能
- 验证缓存配置
- 检查网络连接

#### 性能优化建议

1. **数据库优化**:

   - 为常用查询字段添加索引
   - 使用连接池管理数据库连接

2. **缓存策略**:

   - 缓存频繁访问的股票数据
   - 使用 Redis 缓存模型计算结果

3. **异步处理**:
   - 使用 Celery 处理耗时任务
   - 异步处理数据更新和模型训练

### 11. 下一步

完成快速入门后，您可以:

1. **探索功能**: 通过前端界面体验所有功能
2. **查看文档**: 阅读详细的 API 文档和数据模型
3. **定制开发**: 根据需求添加新的 AI 模型
4. **性能测试**: 使用测试数据进行系统压力测试
5. **部署上线**: 参考部署指南进行生产环境部署

如需更多帮助，请参考:

- [API 文档](contracts/openapi.yaml)
- [数据模型](data-model.md)
- [技术研究](research.md)
- [实现计划](plan.md)
