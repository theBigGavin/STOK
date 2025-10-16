# 股票回测决策系统 - 后台服务

## 项目概述

基于多模型投票机制的股票交易决策系统后台服务。

## 快速启动

### 1. 激活虚拟环境

```bash
source venv/bin/activate
```

### 2. 设置环境变量

```bash
export $(grep -v '^#' .env.local | xargs)
```

### 3. 启动服务器

```bash
cd src && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## API 文档

服务器启动后访问：

- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## 主要 API 端点

- `GET /` - 系统根路径
- `GET /api/v1/health` - 健康检查
- `GET /api/v1/stocks` - 股票数据管理
- `GET /api/v1/models` - 模型管理
- `POST /api/v1/decisions/generate` - 生成交易决策
- `POST /api/v1/backtest/model` - 运行模型回测

## 环境配置

- 开发环境: `.env.development`
- 生产环境: `.env.production`
- 本地测试: `.env.local`

## 依赖管理

```bash
pip install -r requirements.txt
```
