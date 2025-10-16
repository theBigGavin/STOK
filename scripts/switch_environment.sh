#!/bin/bash

# 环境切换脚本

set -e

# 检查参数
if [ $# -ne 1 ]; then
    echo "用法: $0 <environment>"
    echo "可用环境: development, production"
    exit 1
fi

ENVIRONMENT=$1
SOURCE_FILE="backend/.env.$ENVIRONMENT"
TARGET_FILE="backend/.env"

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "错误: 环境文件 $SOURCE_FILE 不存在"
    exit 1
fi

# 备份当前环境文件
if [ -f "$TARGET_FILE" ]; then
    BACKUP_FILE="$TARGET_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$TARGET_FILE" "$BACKUP_FILE"
    echo "当前环境文件已备份到: $BACKUP_FILE"
fi

# 切换环境
cp "$SOURCE_FILE" "$TARGET_FILE"
echo "已切换到 $ENVIRONMENT 环境"

# 验证配置
echo "验证新环境配置..."
cd backend
python -m src.config.validate_config

if [ $? -eq 0 ]; then
    echo "✅ 环境切换成功，配置验证通过"
else
    echo "⚠️  环境切换完成，但配置验证失败，请检查环境变量"
    exit 1
fi