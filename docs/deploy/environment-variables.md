# 环境变量配置说明

## 概述

本文档说明股票回测决策系统的环境变量配置，包括本地开发和 Docker 容器环境的配置方式。

## 环境变量文件

### 1. 本地开发环境 (`.env.local`)

**路径**: `backend/.env.local`
**用途**: 本地 Python 虚拟环境开发使用
**特点**: 使用 `localhost` 地址连接服务

```bash
# 数据库配置 - 使用localhost
DATABASE_URL=postgresql+asyncpg://stock_user:stock_pass@localhost:5432/stock_system
REDIS_URL=redis://localhost:6380/0
```

### 2. Docker 开发环境 (`.env.docker`)

**路径**: `backend/.env.docker`
**用途**: Docker 容器环境使用
**特点**: 使用容器服务名连接

```bash
# 数据库配置 - 使用容器服务名
DATABASE_URL=postgresql+asyncpg://stock_user:stock_pass@postgres:5432/stock_system
REDIS_URL=redis://redis:6379/0
```

### 3. 环境变量示例 (`.env.example`)

**路径**: `backend/.env.example`
**用途**: 提供环境变量模板，新开发者参考使用

## 环境变量加载机制

### 本地开发环境加载

```bash
# 手动加载环境变量
cd backend/src
source ../venv/bin/activate
export $(grep -v '^#' ../.env.local | xargs)
python -m uvicorn main:app --reload
```

### Docker 环境加载

Docker Compose 通过 `env_file` 配置自动加载环境变量：

```yaml
backend:
  env_file:
    - ./backend/.env.docker # 自动加载所有环境变量
  environment:
    - DATABASE_URL=postgresql+asyncpg://stock_user:stock_pass@postgres:5432/stock_system
    - REDIS_URL=redis://redis:6379/0
```

## 关键环境变量说明

### 数据库配置

```bash
DATABASE_URL=postgresql+asyncpg://用户名:密码@主机:端口/数据库名
DATABASE_TEST_URL=postgresql+asyncpg://用户名:密码@主机:端口/测试数据库名
```

### Redis 配置

```bash
REDIS_URL=redis://主机:端口/数据库编号
CELERY_BROKER_URL=redis://主机:端口/数据库编号
CELERY_RESULT_BACKEND=redis://主机:端口/数据库编号
```

### 应用配置

```bash
SECRET_KEY=应用密钥
DEBUG=True/False
ENVIRONMENT=development/production
CORS_ORIGINS=允许的跨域域名
```

### 决策引擎配置

```bash
DECISION_THRESHOLD=0.6      # 决策阈值
MIN_CONFIDENCE=0.6          # 最小置信度
MAX_MODELS=10               # 最大模型数量
```

### 日志配置

```bash
LOG_LEVEL=DEBUG/INFO/WARNING/ERROR
LOG_FORMAT=json/text
```

## 环境变量优先级

1. **Docker 环境变量** (最高优先级)
2. **env_file 配置** (中等优先级)
3. **代码默认值** (最低优先级)

## 配置最佳实践

### 1. 安全配置

- 生产环境使用强密码
- 定期轮换密钥
- 不要提交敏感信息到版本控制

### 2. 环境隔离

- 开发、测试、生产环境使用不同配置
- 使用不同的数据库实例
- 配置不同的日志级别

### 3. 故障排除

```bash
# 检查环境变量是否加载
docker-compose -f docker-compose.dev.yml exec backend env | grep DATABASE

# 检查配置文件
docker-compose -f docker-compose.dev.yml exec backend cat /app/.env.docker
```

## 常见问题

### Q: Docker 容器无法连接数据库

**原因**: 环境变量中的主机名配置错误
**解决**: 确保使用容器服务名而非 localhost

### Q: 环境变量未生效

**原因**: 环境变量文件路径错误或格式问题
**解决**: 检查 env_file 路径和环境变量格式

### Q: 配置冲突

**原因**: 多个环境变量来源冲突
**解决**: 明确环境变量优先级，移除重复配置

## 迁移注意事项

当从本地开发迁移到 Docker 环境时：

1. 复制 `.env.local` 到 `.env.docker`
2. 修改数据库和 Redis 的主机名为容器服务名
3. 确保所有路径配置正确
4. 测试环境变量加载
