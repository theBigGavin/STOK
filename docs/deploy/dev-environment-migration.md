# 开发环境迁移指南

## 概述

本文档提供股票回测决策系统开发环境在不同 PC 间迁移的完整指南。推荐使用 Docker 容器化方案，确保环境一致性。

## 迁移方案对比

### 方案一：Docker 容器化（推荐）

**优势：**

- ✅ 环境完全一致
- ✅ 依赖自动管理
- ✅ 快速部署
- ✅ 跨平台兼容
- ✅ 开发和生产环境一致

**劣势：**

- ⚠️ 需要安装 Docker
- ⚠️ 首次构建时间较长

### 方案二：Python 虚拟环境

**优势：**

- ✅ 无需 Docker
- ✅ 启动速度快

**劣势：**

- ❌ 环境配置复杂
- ❌ 依赖冲突风险
- ❌ 跨平台兼容性差

## Docker 容器化迁移步骤

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 2. 迁移步骤

#### 第一步：复制项目文件

```bash
# 复制整个项目目录到新PC
git clone <repository-url>
# 或者直接复制项目文件夹
```

#### 第二步：一键启动开发环境

```bash
# 进入项目根目录
cd STOK

# 给启动脚本执行权限
chmod +x scripts/start-dev.sh

# 一键启动所有服务
./scripts/start-dev.sh
```

#### 第三步：验证服务状态

脚本会自动检查：

- ✅ PostgreSQL 数据库
- ✅ Redis 缓存
- ✅ Backend API 服务
- ✅ API 健康检查

### 3. 服务访问地址

- **Backend API**: http://localhost:8099
- **API 文档**: http://localhost:8099/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6380

## 常用命令

### 启动服务

```bash
# 一键启动（推荐）
./scripts/start-dev.sh

# 或手动启动
docker-compose -f docker-compose.dev.yml up -d
```

### 停止服务

```bash
docker-compose -f docker-compose.dev.yml down
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f backend
```

### 进入容器

```bash
# 进入backend容器
docker-compose -f docker-compose.dev.yml exec backend bash

# 进入PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U stock_user -d stock_system
```

## 数据持久化

### 数据库数据

- PostgreSQL 数据存储在 Docker volume `postgres_data`
- Redis 数据存储在 Docker volume `redis_data`

### 代码热重载

- Backend 代码通过 volume 映射实现热重载
- 修改代码后自动重新加载

## 故障排除

### 端口冲突

如果端口被占用，可以修改 `docker-compose.dev.yml` 中的端口映射：

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
# 检查数据库状态
docker-compose -f docker-compose.dev.yml ps postgres

# 重置数据库
docker-compose -f docker-compose.dev.yml down -v
./scripts/start-dev.sh
```

## 开发工作流

### 1. 代码开发

- 在本地编辑代码
- 容器自动热重载
- 实时查看日志

### 2. 数据库操作

```bash
# 执行数据库迁移
docker-compose -f docker-compose.dev.yml exec backend python -m alembic upgrade head

# 查看数据库
docker-compose -f docker-compose.dev.yml exec postgres psql -U stock_user -d stock_system
```

### 3. 测试

```bash
# 运行测试
docker-compose -f docker-compose.dev.yml exec backend pytest

# 运行特定测试
docker-compose -f docker-compose.dev.yml exec backend pytest tests/unit/
```

## 性能优化建议

### 开发环境

- 使用 SSD 存储提高构建速度
- 分配足够内存给 Docker（建议 4GB+）
- 启用 Docker BuildKit 加速构建

### 生产环境

- 使用多阶段构建优化镜像大小
- 配置资源限制
- 使用镜像仓库管理镜像

## 迁移检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 项目文件完整复制
- [ ] 启动脚本有执行权限
- [ ] 端口未被占用
- [ ] 磁盘空间充足
- [ ] 网络连接正常

通过此 Docker 容器化方案，可以在任何支持 Docker 的 PC 上快速搭建一致的开发环境，大大简化了环境迁移过程。
