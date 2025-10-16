#!/bin/bash

# 数据库迁移执行脚本

set -e

echo "开始数据库迁移..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

# 进入项目根目录
cd "$(dirname "$0")/.."

# 运行配置验证
echo "验证环境配置..."
python -m backend.src.config.validate_config

if [ $? -ne 0 ]; then
    echo "配置验证失败，请检查环境变量"
    exit 1
fi

# 运行迁移
echo "应用数据库迁移..."
cd data/migrations
alembic upgrade head

# 检查迁移状态
echo "迁移状态:"
alembic current

echo "数据库迁移完成"