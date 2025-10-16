#!/bin/bash

# 股票回测决策系统开发环境一键启动脚本
# 使用Docker Compose启动所有服务

set -e

echo "🚀 启动股票回测决策系统开发环境..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p backend/logs

# 停止已运行的服务
echo "🛑 停止已运行的服务..."
docker-compose -f docker-compose.dev.yml down

# 构建并启动服务
echo "🔨 构建和启动服务..."
docker-compose -f docker-compose.dev.yml up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查PostgreSQL
if docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL 运行正常"
else
    echo "❌ PostgreSQL 启动失败"
    exit 1
fi

# 检查Redis
if docker-compose -f docker-compose.dev.yml ps redis | grep -q "Up"; then
    echo "✅ Redis 运行正常"
else
    echo "❌ Redis 启动失败"
    exit 1
fi

# 检查Backend
if docker-compose -f docker-compose.dev.yml ps backend | grep -q "Up"; then
    echo "✅ Backend API 运行正常"
else
    echo "❌ Backend API 启动失败"
    exit 1
fi

# 等待API完全启动
echo "⏳ 等待API服务完全启动..."
sleep 5

# 测试API健康检查
echo "🧪 测试API健康检查..."
if curl -s http://localhost:8099/api/v1/health > /dev/null; then
    echo "✅ API健康检查通过"
else
    echo "⚠️  API健康检查失败，但服务可能仍在启动中"
fi

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📊 服务访问地址："
echo "   - Backend API: http://localhost:8099"
echo "   - API文档: http://localhost:8099/docs"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6380"
echo ""
echo "🛑 停止服务命令：docker-compose -f docker-compose.dev.yml down"
echo "📝 查看日志命令：docker-compose -f docker-compose.dev.yml logs -f"
echo ""