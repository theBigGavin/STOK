# 股票回测决策系统 - 数据库部署实施指南

## 1. 概述

本文档记录实际的数据库部署流程、遇到的问题及解决方案，为后续部署提供参考。

## 2. 部署环境

- **操作系统**: macOS Sequoia
- **Docker**: Docker Desktop
- **数据库**: PostgreSQL 13
- **缓存**: Redis 6
- **Python**: 3.13 (存在兼容性问题)

## 3. 部署流程

### 3.1 启动基础服务

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 验证服务状态
docker-compose ps
```

### 3.2 数据库初始化

由于 Python 3.13 存在依赖包兼容性问题，采用直接 SQL 方式初始化：

```bash
# 创建数据库表结构
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/init_database.sql

# 插入测试数据
docker-compose exec postgres psql -U stock_user -d stock_system -f /docker-entrypoint-initdb.d/seed_test_data.sql
```

### 3.3 环境验证

```bash
# 运行健康检查
chmod +x scripts/simple_health_check.sh
./scripts/simple_health_check.sh
```

## 4. 遇到的问题及解决方案

### 4.1 Python 依赖问题

**问题**: Python 3.13 与部分依赖包不兼容

- `asyncpg`: 编译错误
- `pandas`: 构建失败
- `alembic`: 无法运行

**解决方案**:

- 放弃使用 Alembic 迁移工具
- 直接使用 SQL 文件进行数据库初始化
- 创建简单的 Shell 脚本替代 Python 健康检查

### 4.2 SQL 语法问题

**问题**: 复杂的 SQL 生成语句在 PostgreSQL 中执行失败

- 无法在 SELECT 中引用同一查询的列别名
- `round()` 函数参数类型不匹配
- 子查询中无法引用外层查询的列

**解决方案**:

- 使用 CTE (Common Table Expressions) 处理复杂查询
- 显式类型转换替代隐式转换
- 拆分复杂查询为多个简单查询

### 4.3 文件路径问题

**问题**: Docker 容器内无法访问某些文件路径

**解决方案**:

- 将所有 SQL 文件放在 `data/migrations/` 目录
- 通过 Docker volume 映射访问文件

## 5. 可用脚本

### 5.1 数据库初始化脚本

- [`data/migrations/init_database.sql`](../data/migrations/init_database.sql): 创建表结构和索引
- [`data/migrations/seed_test_data.sql`](../data/migrations/seed_test_data.sql): 插入测试数据

### 5.2 健康检查脚本

- [`scripts/simple_health_check.sh`](../scripts/simple_health_check.sh): 环境健康检查

## 6. 部署验证

部署完成后应验证以下内容：

### 6.1 服务状态

```bash
docker-compose ps
```

预期输出:

- PostgreSQL: Up (healthy)
- Redis: Up (healthy)

### 6.2 数据库结构

```bash
docker-compose exec postgres psql -U stock_user -d stock_system -c "\dt"
```

预期输出: 6 个核心表

### 6.3 数据完整性

```bash
docker-compose exec postgres psql -U stock_user -d stock_system -c "
SELECT '股票数据: ' || COUNT(*) || ' 条记录' FROM stocks;
SELECT '回测模型: ' || COUNT(*) || ' 个模型' FROM backtest_models;
SELECT '日线数据: ' || COUNT(*) || ' 条记录' FROM stock_daily_data;
SELECT '模型决策: ' || COUNT(*) || ' 条记录' FROM model_decisions;
SELECT '综合决策: ' || COUNT(*) || ' 条记录' FROM final_decisions;
SELECT '性能数据: ' || COUNT(*) || ' 条记录' FROM model_performance;"
```

## 7. 故障排除

### 7.1 常见问题

1. **容器启动失败**

   - 检查端口冲突 (5432, 6380)
   - 检查 Docker 服务状态

2. **数据库连接失败**

   - 验证环境变量配置
   - 检查网络连接

3. **SQL 执行错误**
   - 检查 SQL 语法
   - 验证文件编码

### 7.2 日志查看

```bash
# 查看数据库日志
docker-compose logs postgres

# 查看 Redis 日志
docker-compose logs redis
```

## 8. 后续改进建议

1. **Python 环境**: 使用 Python 3.11 或 3.12 避免兼容性问题
2. **迁移工具**: 考虑使用其他数据库迁移工具
3. **容器化**: 完善后端服务的 Docker 配置
4. **监控**: 添加更完善的监控和告警机制

## 9. 总结

通过本次部署，我们成功建立了完整的数据库环境，包括：

- 6 个核心数据表
- 完整的测试数据
- 性能优化的索引
- 健康检查工具

开发环境已准备就绪，可以开始应用开发工作。

---

**文档版本**: v1.1  
**最后更新**: 2025-10-16  
**维护者**: 部署团队
