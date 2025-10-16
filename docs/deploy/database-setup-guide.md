# 股票回测决策系统 - 数据库环境搭建指南

## 1. 概述

本文档详细说明股票回测决策系统的数据库环境搭建流程，包括开发、测试和生产环境的数据库配置、迁移脚本、测试数据准备等。

## 2. 环境要求

### 2.1 软件要求

- **数据库**: PostgreSQL 13+
- **缓存**: Redis 6+
- **迁移工具**: Alembic 1.12+
- **Python**: 3.9+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 2.2 硬件要求

| 环境 | CPU     | 内存  | 存储   |
| ---- | ------- | ----- | ------ |
| 开发 | 2 核心  | 4GB   | 20GB   |
| 测试 | 4 核心  | 8GB   | 50GB   |
| 生产 | 8 核心+ | 16GB+ | 100GB+ |

## 3. 数据库架构

### 3.1 核心数据表

系统包含以下核心数据表：

1. **stocks** - 股票基本信息
2. **stock_daily_data** - 股票日线数据
3. **backtest_models** - 回测模型配置
4. **model_decisions** - 模型决策记录
5. **final_decisions** - 综合决策结果
6. **model_performance** - 模型性能指标

### 3.2 数据库关系图

```mermaid
erDiagram
    stocks ||--o{ stock_daily_data : "包含"
    stocks ||--o{ model_decisions : "生成"
    stocks ||--o{ final_decisions : "聚合"
    backtest_models ||--o{ model_decisions : "产生"
    backtest_models ||--o{ model_performance : "评估"
```

## 4. 环境搭建步骤

### 4.1 开发环境搭建

#### 4.1.1 使用 Docker Compose

```bash
# 启动数据库服务
docker-compose up -d postgres redis

# 验证服务状态
docker-compose ps

# 检查数据库连接
docker-compose exec postgres psql -U stock_user -d stock_system -c "SELECT version();"
```

#### 4.1.2 环境变量配置

创建 `.env` 文件：

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system
DATABASE_TEST_URL=postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system_test

# Redis Configuration
REDIS_URL=redis://localhost:6380/0

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6380/0
CELERY_RESULT_BACKEND=redis://localhost:6380/0

# Application Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ENVIRONMENT=development
```

### 4.2 数据库初始化

#### 4.2.1 直接 SQL 初始化

由于 Python 依赖兼容性问题，采用直接 SQL 方式初始化：

```bash
# 创建数据库表结构
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/init_database.sql

# 插入测试数据
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/seed_test_data.sql
```

#### 4.2.2 初始化脚本结构

```
data/
├── migrations/
│   ├── init_database.sql          # 表结构和索引创建
│   ├── seed_test_data.sql         # 测试数据插入
│   └── versions/                  # Alembic 迁移文件（暂不使用）
└── seeds/
    └── run_seeds.py               # Python 种子脚本（暂不使用）
```

#### 4.2.3 环境验证

```bash
# 运行健康检查
./scripts/simple_health_check.sh
```

### 4.3 测试数据准备

#### 4.3.1 种子数据内容

1. **股票数据**: 包含沪深 300 成分股基本信息
2. **模型数据**: 预配置技术分析、机器学习模型
3. **历史数据**: 最近一年的模拟日线数据
4. **性能数据**: 模型回测性能指标

#### 4.3.2 数据验证

```bash
# 运行数据验证脚本
python scripts/validate_data.py

# 检查数据完整性
python scripts/check_data_integrity.py
```

## 5. 数据库配置优化

### 5.1 PostgreSQL 配置

```sql
-- 连接池配置
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET work_mem = '16MB';

-- 性能优化
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- 重启生效
SELECT pg_reload_conf();
```

### 5.2 索引优化

```sql
-- 时序数据索引
CREATE INDEX CONCURRENTLY idx_daily_data_stock_date
ON stock_daily_data(stock_id, trade_date DESC);

-- 决策数据索引
CREATE INDEX CONCURRENTLY idx_model_decisions_stock_date
ON model_decisions(stock_id, trade_date DESC);

-- JSONB 字段索引
CREATE INDEX CONCURRENTLY idx_models_parameters
ON backtest_models USING GIN(parameters);
```

## 6. 监控和维护

### 6.1 健康检查

```bash
# 数据库健康检查
docker-compose exec postgres pg_isready -U stock_user -d stock_system

# Redis 健康检查
docker-compose exec redis redis-cli ping

# 应用健康检查
curl http://localhost:8000/health
```

### 6.2 备份策略

```bash
# 数据库备份
docker-compose exec postgres pg_dump -U stock_user stock_system > backup_$(date +%Y%m%d).sql

# Redis 备份
docker-compose exec redis redis-cli SAVE
```

## 7. 故障排除

### 7.1 常见问题

1. **Python 依赖问题**: Python 3.13 与 asyncpg、pandas 等包不兼容

   - **解决方案**: 使用直接 SQL 方式初始化数据库

2. **SQL 语法错误**: 复杂查询在 PostgreSQL 中执行失败

   - **解决方案**: 使用 CTE 和显式类型转换

3. **容器文件访问**: Docker 容器无法访问某些文件路径

   - **解决方案**: 将 SQL 文件放在 `data/migrations/` 目录

4. **连接失败**: 检查环境变量和网络配置
5. **性能问题**: 优化索引和查询语句
6. **数据不一致**: 运行数据完整性检查

### 7.2 日志查看

```bash
# 查看数据库日志
docker-compose logs postgres

# 查看 Redis 日志
docker-compose logs redis

# 查看健康检查结果
./scripts/simple_health_check.sh
```

### 7.3 快速恢复

如果遇到严重问题，可以重新初始化数据库：

```bash
# 删除并重建数据库容器
docker-compose down postgres
docker-compose up -d postgres

# 重新初始化
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/init_database.sql
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/seed_test_data.sql
```

## 8. 下一步

完成数据库环境搭建后，继续：

1. 配置应用服务连接
2. 运行数据验证测试
3. 部署前端应用
4. 配置监控告警

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**维护者**: 数据库团队
