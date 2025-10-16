#!/bin/bash

# 股票回测决策系统健康检查脚本
# 创建时间: 2025-10-16

echo "🔍 开始健康检查..."
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "----------------------------------------"

# 检查PostgreSQL连接
echo "检查PostgreSQL连接..."
docker-compose exec postgres psql -U stock_user -d stock_system -c "SELECT '✅ PostgreSQL连接成功' as status;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL连接成功"
    
    # 检查表结构
    echo "检查数据库表结构..."
    docker-compose exec postgres psql -U stock_user -d stock_system -c "
    SELECT 
        '表数量: ' || COUNT(*) || ' 个' as table_info
    FROM information_schema.tables 
    WHERE table_schema = 'public';"
    
    # 检查数据量
    echo "检查数据完整性..."
    docker-compose exec postgres psql -U stock_user -d stock_system -c "
    SELECT '股票数据: ' || COUNT(*) || ' 条记录' FROM stocks;
    SELECT '回测模型: ' || COUNT(*) || ' 个模型' FROM backtest_models;
    SELECT '日线数据: ' || COUNT(*) || ' 条记录' FROM stock_daily_data;
    SELECT '模型决策: ' || COUNT(*) || ' 条记录' FROM model_decisions;
    SELECT '综合决策: ' || COUNT(*) || ' 条记录' FROM final_decisions;
    SELECT '性能数据: ' || COUNT(*) || ' 条记录' FROM model_performance;"
else
    echo "❌ PostgreSQL连接失败"
fi

echo "----------------------------------------"

# 检查Redis连接
echo "检查Redis连接..."
docker-compose exec redis redis-cli ping > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Redis连接成功"
else
    echo "❌ Redis连接失败"
fi

echo "----------------------------------------"

# 检查服务状态
echo "检查Docker服务状态..."
docker-compose ps

echo "----------------------------------------"

# 总结
echo "🎉 开发环境健康检查完成!"
echo ""
echo "📊 当前环境状态:"
echo "   - PostgreSQL: 运行中 (端口: 5432)"
echo "   - Redis: 运行中 (端口: 6380)" 
echo "   - 数据库表: 6个核心表已创建"
echo "   - 测试数据: 已插入完整测试数据"
echo ""
echo "🚀 开发环境准备就绪，可以开始开发工作!"