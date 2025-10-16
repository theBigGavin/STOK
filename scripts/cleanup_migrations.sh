#!/bin/bash

# 股票回测决策系统 - 迁移文件清理脚本
# 清理有问题的迁移文件，只保留有效的SQL文件

echo "🧹 开始清理迁移文件..."
echo "----------------------------------------"

# 删除有问题的Python迁移文件
echo "删除有问题的Python迁移文件..."
rm -f data/migrations/versions/001_initial_schema.py
rm -f data/migrations/versions/002_add_indexes.py
rm -f data/migrations/versions/__init__.py

# 删除有问题的Python种子脚本
echo "删除有问题的Python种子脚本..."
rm -f data/seeds/run_seeds.py
rm -f data/seeds/validate_data.py

# 删除有问题的Python健康检查脚本
echo "删除有问题的Python健康检查脚本..."
rm -f scripts/health_check.py

# 删除有问题的Alembic配置文件
echo "删除有问题的Alembic配置文件..."
rm -f data/migrations/alembic.ini
rm -f data/migrations/env.py

# 保留有效的SQL文件
echo "保留有效的SQL文件:"
echo "  ✅ data/migrations/init_database.sql"
echo "  ✅ data/migrations/seed_test_data.sql"
echo "  ✅ scripts/simple_health_check.sh"

# 更新目录结构
echo "更新目录结构..."
mkdir -p data/migrations/backup

# 移动有问题的文件到备份目录（如果有的话）
mv data/migrations/versions data/migrations/backup/ 2>/dev/null || true
mv data/migrations/alembic.ini data/migrations/backup/ 2>/dev/null || true
mv data/migrations/env.py data/migrations/backup/ 2>/dev/null || true

echo "----------------------------------------"
echo "🎉 清理完成!"
echo ""
echo "📁 当前有效的文件:"
echo "   data/migrations/init_database.sql    - 数据库初始化脚本"
echo "   data/migrations/seed_test_data.sql   - 测试数据种子脚本" 
echo "   scripts/simple_health_check.sh       - 环境健康检查脚本"
echo ""
echo "⚠️  注意: 由于Python 3.13兼容性问题，暂时使用SQL文件进行数据库初始化"
echo "    后续可考虑使用Python 3.11/3.12环境或等待依赖包更新"