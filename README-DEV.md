# 股票回测决策系统 - 开发环境快速启动指南

## 🚀 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 一键启动开发环境

```bash
# 给启动脚本执行权限（首次运行）
chmod +x scripts/start-dev.sh

# 一键启动所有服务
./scripts/start-dev.sh
```

### 服务访问地址

- **Backend API**: http://localhost:8099
- **API 文档**: http://localhost:8099/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6380

## 📋 开发环境包含的服务

### 1. Backend API (FastAPI)

- 端口: 8000
- 特性: 自动热重载、Swagger 文档
- 路径: `backend/src/`

### 2. PostgreSQL 数据库

- 端口: 5432
- 数据库: stock_system
- 用户: stock_user / stock_pass
- 自动初始化表结构和测试数据

### 3. Redis 缓存

- 端口: 6380
- 用于: 缓存、会话管理

## 🔧 常用开发命令

### 启动/停止服务

```bash
# 启动服务
./scripts/start-dev.sh

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

### 数据库操作

```bash
# 进入PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U stock_user -d stock_system

# 查看表结构
\dt

# 查询数据
SELECT * FROM stocks LIMIT 5;
```

### 代码开发

```bash
# 进入backend容器
docker-compose -f docker-compose.dev.yml exec backend bash

# 运行测试
pytest

# 安装新依赖
pip install <package>
# 然后更新 requirements.txt
```

## 🗂️ 项目结构

```
STOK/
├── backend/                 # 后端代码
│   ├── src/                # 源代码
│   │   ├── api/            # API路由
│   │   ├── config/         # 配置管理
│   │   ├── decision_engine/ # 决策引擎
│   │   ├── ml_models/      # 机器学习模型
│   │   ├── models/         # 数据模型
│   │   └── services/       # 业务服务
│   ├── Dockerfile          # 容器配置
│   └── requirements.txt    # Python依赖
├── data/                   # 数据库迁移和种子数据
├── docs/                   # 文档
├── scripts/                # 工具脚本
│   └── start-dev.sh        # 一键启动脚本
└── docker-compose.dev.yml  # 开发环境配置
```

## 🎯 核心功能

### API 接口

- ✅ 健康检查
- ✅ 股票数据管理
- ✅ 模型管理
- ✅ 决策引擎
- ✅ 回测分析

### 决策引擎

- ✅ 多模型投票机制
- ✅ 技术指标模型（MA、RSI、MACD）
- ✅ 加权投票决策
- ✅ 实时决策生成

### 数据管理

- ✅ 股票基本信息
- ✅ 日线数据
- ✅ 模型决策记录
- ✅ 性能评估

## 🐛 故障排除

### 端口冲突

修改 `docker-compose.dev.yml` 中的端口映射：

```yaml
ports:
  - "8001:8000" # 修改为其他端口
```

### 构建失败

```bash
# 清理缓存重新构建
docker-compose -f docker-compose.dev.yml build --no-cache
```

### 数据库连接问题

```bash
# 重置数据库
docker-compose -f docker-compose.dev.yml down -v
./scripts/start-dev.sh
```

## 📚 详细文档

- [系统架构设计](docs/detail-design/architecture/system-architecture.md)
- [API 设计文档](docs/detail-design/api/api-design.md)
- [数据库设计](docs/detail-design/data-models/database-design.md)
- [开发环境迁移指南](docs/deploy/dev-environment-migration.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看服务日志: `docker-compose -f docker-compose.dev.yml logs -f`
2. 检查服务状态: `docker-compose -f docker-compose.dev.yml ps`
3. 参考详细文档: `docs/` 目录

---

**开发愉快！** 🎉
