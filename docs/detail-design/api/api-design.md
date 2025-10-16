# 股票回测决策系统 - API 接口设计

## 1. API 架构总览

### 1.1 设计原则

- **RESTful 风格**: 遵循 RESTful API 设计规范
- **版本控制**: 支持 API 版本管理
- **统一响应格式**: 标准化的响应数据结构
- **异步处理**: 支持异步请求和长时任务
- **安全认证**: 完整的认证和授权机制

### 1.2 API 版本管理

```
/api/v1/ - 版本1 API
/api/v2/ - 版本2 API (未来扩展)
```

### 1.3 响应格式标准

```json
{
    "data": {...},
    "message": "操作成功",
    "status": "success",
    "timestamp": "2025-10-16T11:00:00Z"
}
```

## 2. 核心 API 端点设计

### 2.1 系统状态 API

#### 2.1.1 健康检查

```http
GET /api/v1/health
```

**响应示例**:

```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-16T11:00:00Z",
    "components": {
      "database": "healthy",
      "redis": "healthy",
      "celery": "healthy"
    },
    "system": {
      "cpu_percent": 45.2,
      "memory_percent": 67.8,
      "disk_usage": 23.4
    }
  },
  "message": "系统运行正常",
  "status": "success"
}
```

#### 2.1.2 系统指标

```http
GET /api/v1/metrics
```

**响应**: Prometheus 格式的指标数据

### 2.2 股票数据 API

#### 2.2.1 获取股票列表

```http
GET /api/v1/stocks?skip=0&limit=100&active_only=true
```

**参数**:

- `skip`: 跳过记录数 (默认: 0)
- `limit`: 返回记录数 (默认: 100, 最大: 1000)
- `active_only`: 只返回活跃股票 (默认: true)

**响应示例**:

```json
{
  "data": [
    {
      "id": 1,
      "symbol": "000001",
      "name": "平安银行",
      "market": "SZ",
      "is_active": true,
      "created_at": "2025-10-01T00:00:00Z"
    }
  ],
  "message": "获取股票列表成功",
  "status": "success",
  "pagination": {
    "total": 150,
    "skip": 0,
    "limit": 100
  }
}
```

#### 2.2.2 获取股票历史数据

```http
GET /api/v1/stocks/{symbol}/data?start_date=2025-01-01&end_date=2025-10-16&include_features=false
```

**参数**:

- `symbol`: 股票代码 (路径参数)
- `start_date`: 开始日期 (必需)
- `end_date`: 结束日期 (必需)
- `include_features`: 是否包含特征数据 (默认: false)

**响应示例**:

```json
{
  "data": {
    "symbol": "000001",
    "data": [
      {
        "trade_date": "2025-10-15",
        "open_price": 15.2,
        "high_price": 15.8,
        "low_price": 15.1,
        "close_price": 15.65,
        "volume": 15000000,
        "turnover": 234000000.0
      }
    ],
    "metadata": {
      "start_date": "2025-01-01",
      "end_date": "2025-10-16",
      "record_count": 180
    }
  },
  "message": "获取股票数据成功",
  "status": "success"
}
```

#### 2.2.3 获取最新股票数据

```http
GET /api/v1/stocks/{symbol}/latest
```

**响应示例**:

```json
{
  "data": {
    "symbol": "000001",
    "latest_data": {
      "trade_date": "2025-10-16",
      "open_price": 15.7,
      "high_price": 16.1,
      "low_price": 15.6,
      "close_price": 15.95,
      "volume": 12000000,
      "turnover": 191400000.0
    },
    "timestamp": "2025-10-16T15:00:00Z"
  },
  "message": "获取最新数据成功",
  "status": "success"
}
```

#### 2.2.4 刷新股票数据

```http
POST /api/v1/stocks/{symbol}/refresh
```

**响应示例**:

```json
{
  "data": {
    "message": "开始更新 000001 的数据",
    "symbol": "000001",
    "status": "processing"
  },
  "message": "数据更新任务已启动",
  "status": "success"
}
```

### 2.3 模型管理 API

#### 2.3.1 获取模型列表

```http
GET /api/v1/models
```

**响应示例**:

```json
{
  "data": [
    {
      "model_id": 1,
      "name": "移动平均线交叉模型",
      "description": "基于短期和长期移动平均线交叉的交易策略",
      "model_type": "technical",
      "parameters": {
        "short_window": 5,
        "long_window": 20
      },
      "is_trained": true,
      "performance_metrics": {
        "accuracy": 0.65,
        "total_return": 0.12
      }
    }
  ],
  "message": "获取模型列表成功",
  "status": "success"
}
```

#### 2.3.2 创建新模型

```http
POST /api/v1/models
Content-Type: application/json

{
    "model_type": "moving_average_crossover",
    "parameters": {
        "short_window": 5,
        "long_window": 20
    }
}
```

**响应示例**:

```json
{
  "data": {
    "message": "模型创建成功",
    "model_id": 2,
    "model_name": "移动平均线交叉模型",
    "parameters": {
      "short_window": 5,
      "long_window": 20
    }
  },
  "message": "模型创建成功",
  "status": "success"
}
```

#### 2.3.3 获取模型详情

```http
GET /api/v1/models/{model_id}
```

**响应示例**:

```json
{
  "data": {
    "model_id": 1,
    "name": "移动平均线交叉模型",
    "description": "基于短期和长期移动平均线交叉的交易策略",
    "parameters": {
      "short_window": 5,
      "long_window": 20
    },
    "is_trained": true,
    "performance_metrics": {
      "accuracy": 0.65,
      "precision": 0.68,
      "recall": 0.62,
      "f1_score": 0.65,
      "total_return": 0.12,
      "sharpe_ratio": 1.2,
      "max_drawdown": 0.08
    }
  },
  "message": "获取模型详情成功",
  "status": "success"
}
```

#### 2.3.4 删除模型

```http
DELETE /api/v1/models/{model_id}
```

**响应示例**:

```json
{
  "data": {
    "message": "模型删除成功",
    "model_id": 2
  },
  "message": "模型删除成功",
  "status": "success"
}
```

#### 2.3.5 运行模型回测

```http
POST /api/v1/models/{model_id}/backtest
Content-Type: application/json

{
    "symbol": "000001",
    "start_date": "2025-01-01",
    "end_date": "2025-10-16",
    "initial_capital": 100000
}
```

**响应示例**:

```json
{
    "data": {
        "model_id": 1,
        "symbol": "000001",
        "backtest_result": {
            "total_return": 0.156,
            "annual_return": 0.234,
            "volatility": 0.245,
            "sharpe_ratio": 0.956,
            "max_drawdown": 0.124,
            "trades": [
                {
                    "type": "BUY",
                    "date": "2025-03-15",
                    "price": 14.50,
                    "shares": 6896
                }
            ],
            "signals": [...]
        }
    },
    "message": "回测完成",
    "status": "success"
}
```

### 2.4 决策引擎 API

#### 2.4.1 生成交易决策

```http
POST /api/v1/decisions/generate
Content-Type: application/json

{
    "symbol": "000001",
    "trade_date": "2025-10-16",
    "current_position": 0.0
}
```

**响应示例**:

```json
{
    "data": {
        "symbol": "000001",
        "final_decision": {
            "decision": "BUY",
            "confidence": 0.78,
            "vote_summary": {
                "BUY": 6,
                "SELL": 2,
                "HOLD": 2
            },
            "model_details": [
                {
                    "model_id": 1,
                    "decision": "BUY",
                    "confidence": 0.85,
                    "signal_strength": 0.8,
                    "reasoning": "移动平均线金叉"
                }
            ],
            "risk_level": "MEDIUM",
            "reasoning": "加权投票通过: 78.0%"
        },
        "risk_assessment": {
            "is_approved": true,
            "risk_level": "MEDIUM",
            "warnings": ["高波动率风险"],
            "adjusted_decision": "BUY",
            "position_suggestion": 0.5
        },
        "model_results": {...},
        "timestamp": "2025-10-16T09:30:00Z"
    },
    "message": "决策生成成功",
    "status": "success"
}
```

#### 2.4.2 批量生成决策

```http
POST /api/v1/decisions/batch
Content-Type: application/json

{
    "symbols": ["000001", "000002", "600000"],
    "trade_date": "2025-10-16"
}
```

**响应示例**:

```json
{
    "data": {
        "batch_results": [
            {
                "symbol": "000001",
                "final_decision": {...},
                "risk_assessment": {...}
            }
        ],
        "total_count": 3,
        "success_count": 3,
        "timestamp": "2025-10-16T09:35:00Z"
    },
    "message": "批量决策生成完成",
    "status": "success"
}
```

#### 2.4.3 获取决策历史

```http
GET /api/v1/decisions/history/{symbol}?start_date=2025-10-01&end_date=2025-10-16
```

**响应示例**:

```json
{
  "data": {
    "symbol": "000001",
    "history": [
      {
        "trade_date": "2025-10-15",
        "final_decision": "HOLD",
        "confidence_score": 0.45,
        "vote_summary": {
          "BUY": 3,
          "SELL": 3,
          "HOLD": 4
        }
      }
    ],
    "metadata": {
      "start_date": "2025-10-01",
      "end_date": "2025-10-16",
      "record_count": 12
    }
  },
  "message": "获取决策历史成功",
  "status": "success"
}
```

### 2.5 回测分析 API

#### 2.5.1 执行组合回测

```http
POST /api/v1/backtest/portfolio
Content-Type: application/json

{
    "symbols": ["000001", "000002", "600000"],
    "start_date": "2025-01-01",
    "end_date": "2025-10-16",
    "initial_capital": 100000,
    "rebalance_frequency": "monthly"
}
```

**响应示例**:

```json
{
    "data": {
        "portfolio_result": {
            "total_return": 0.234,
            "annual_return": 0.356,
            "volatility": 0.189,
            "sharpe_ratio": 1.883,
            "max_drawdown": 0.095,
            "individual_performance": {
                "000001": {
                    "return": 0.156,
                    "weight": 0.333
                }
            }
        },
        "rebalance_logs": [...]
    },
    "message": "组合回测完成",
    "status": "success"
}
```

## 3. 错误处理设计

### 3.1 标准错误响应格式

```json
{
  "data": null,
  "message": "详细的错误描述",
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "details": {
    "field": "symbol",
    "issue": "股票代码不存在"
  }
}
```

### 3.2 错误码定义

| 错误码                | HTTP 状态码 | 描述             |
| --------------------- | ----------- | ---------------- |
| `VALIDATION_ERROR`    | 400         | 请求参数验证失败 |
| `NOT_FOUND`           | 404         | 资源不存在       |
| `UNAUTHORIZED`        | 401         | 未授权访问       |
| `FORBIDDEN`           | 403         | 权限不足         |
| `INTERNAL_ERROR`      | 500         | 服务器内部错误   |
| `SERVICE_UNAVAILABLE` | 503         | 服务暂时不可用   |

### 3.3 常见错误场景

#### 3.3.1 参数验证错误

```json
{
  "data": null,
  "message": "请求参数验证失败",
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "start_date",
      "issue": "开始日期不能晚于结束日期"
    },
    {
      "field": "symbol",
      "issue": "股票代码格式不正确"
    }
  ]
}
```

#### 3.3.2 资源不存在

```json
{
  "data": null,
  "message": "股票代码 999999 不存在",
  "status": "error",
  "error_code": "NOT_FOUND"
}
```

#### 3.3.3 服务不可用

```json
{
  "data": null,
  "message": "数据服务暂时不可用，请稍后重试",
  "status": "error",
  "error_code": "SERVICE_UNAVAILABLE"
}
```

## 4. 安全设计

### 4.1 认证机制

```python
# JWT Token认证
@app.middleware("http")
async def authenticate(request: Request, call_next):
    token = request.headers.get("Authorization")
    if token:
        # 验证JWT Token
        user = await verify_jwt_token(token)
        if user:
            request.state.user = user
    return await call_next(request)
```

### 4.2 速率限制

```python
# 基于Redis的速率限制
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"

    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, 60)  # 60秒窗口

    if current > 100:  # 每分钟100次请求
        return JSONResponse(
            status_code=429,
            content={"message": "请求过于频繁"}
        )

    return await call_next(request)
```

### 4.3 CORS 配置

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://trading.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 5. 性能优化

### 5.1 缓存策略

```python
# Redis缓存装饰器
def cache_response(ttl: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"api:{func.__name__}:{hash(str(kwargs))}"
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)

            result = await func(*args, **kwargs)
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

### 5.2 分页优化

```python
# 游标分页实现
async def get_stocks_cursor(cursor: str = None, limit: int = 100):
    if cursor:
        # 使用游标继续查询
        query = "SELECT * FROM stocks WHERE id > $1 ORDER BY id LIMIT $2"
        result = await db.fetch(query, cursor, limit)
    else:
        # 首次查询
        query = "SELECT * FROM stocks ORDER BY id LIMIT $1"
        result = await db.fetch(query, limit)

    next_cursor = result[-1]['id'] if result else None
    return {
        "data": result,
        "next_cursor": next_cursor
    }
```

## 6. API 文档

### 6.1 OpenAPI 文档

- 自动生成的 API 文档位于 `/docs`
- Swagger UI
