#!/bin/sh
# 等待服务就绪脚本
# 用于在运行集成测试前确保所有依赖服务都已就绪

set -e

echo "等待集成测试环境服务就绪..."

# 等待后端服务
if [ -n "$1" ]; then
    echo "等待后端服务: $1"
    timeout 120 sh -c "until curl -f http://$1/api/v1/health >/dev/null 2>&1; do echo '等待后端服务...'; sleep 5; done"
    echo "后端服务已就绪"
fi

# 等待前端服务
if [ -n "$2" ]; then
    echo "等待前端服务: $2"
    timeout 120 sh -c "until curl -f http://$2 >/dev/null 2>&1; do echo '等待前端服务...'; sleep 5; done"
    echo "前端服务已就绪"
fi

# 等待数据库服务
if [ -n "$3" ]; then
    echo "等待数据库服务: $3"
    host=$(echo $3 | cut -d: -f1)
    port=$(echo $3 | cut -d: -f2)
    timeout 120 sh -c "until pg_isready -h $host -p $port -U test_user -d stok_test >/dev/null 2>&1; do echo '等待数据库服务...'; sleep 5; done"
    echo "数据库服务已就绪"
fi

# 等待Redis服务
if [ -n "$4" ]; then
    echo "等待Redis服务: $4"
    host=$(echo $4 | cut -d: -f1)
    port=$(echo $4 | cut -d: -f2)
    timeout 120 sh -c "until redis-cli -h $host -p $port ping >/dev/null 2>&1; do echo '等待Redis服务...'; sleep 5; done"
    echo "Redis服务已就绪"
fi

echo "所有服务都已就绪，开始运行集成测试..."