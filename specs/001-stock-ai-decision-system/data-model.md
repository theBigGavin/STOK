# Data Model: 股票 AI 策略回测决策系统

**Feature**: 001-stock-ai-decision-system  
**Date**: 2025-10-18  
**Status**: Draft

## 核心实体

### 1. 股票实体 (Stock)

代表股票标的的基本信息和价格数据。

**字段**:

- `id`: UUID (主键)
- `symbol`: String (股票代码，唯一)
- `name`: String (股票名称)
- `industry`: String (所属行业)
- `market`: String (市场类型: A 股/港股/美股)
- `current_price`: Decimal (当前价格)
- `price_change`: Decimal (价格变动)
- `price_change_percent`: Decimal (涨跌幅)
- `volume`: BigInteger (成交量)
- `market_cap`: Decimal (市值)
- `pe_ratio`: Decimal (市盈率)
- `pb_ratio`: Decimal (市净率)
- `dividend_yield`: Decimal (股息率)
- `created_at`: DateTime (创建时间)
- `updated_at`: DateTime (更新时间)

**关系**:

- 一对多: Stock → StockPrice (历史价格)
- 一对多: Stock → Decision (决策记录)
- 一对多: Stock → BacktestResult (回测结果)

### 2. 股票价格实体 (StockPrice)

存储股票的历史价格数据。

**字段**:

- `id`: UUID (主键)
- `stock_id`: UUID (外键，关联 Stock)
- `date`: Date (交易日期)
- `open_price`: Decimal (开盘价)
- `high_price`: Decimal (最高价)
- `low_price`: Decimal (最低价)
- `close_price`: Decimal (收盘价)
- `volume`: BigInteger (成交量)
- `adjusted_close`: Decimal (调整后收盘价)
- `created_at`: DateTime (创建时间)

**索引**:

- 复合索引: (stock_id, date)

### 3. AI 模型实体 (AIModel)

代表不同的 AI 策略模型。

**字段**:

- `id`: UUID (主键)
- `name`: String (模型名称)
- `model_type`: String (模型类型: technical/fundamental/machine_learning)
- `description`: Text (模型描述)
- `weight`: Decimal (投票权重，0-1)
- `is_active`: Boolean (是否启用)
- `performance_score`: Decimal (历史表现评分)
- `last_trained_at`: DateTime (最后训练时间)
- `created_at`: DateTime (创建时间)
- `updated_at`: DateTime (更新时间)

**关系**:

- 一对多: AIModel → VoteResult (投票结果)
- 一对多: AIModel → BacktestResult (回测结果)

### 4. 决策实体 (Decision)

代表系统生成的决策结果。

**字段**:

- `id`: UUID (主键)
- `stock_id`: UUID (外键，关联 Stock)
- `decision_type`: String (决策类型: buy/sell/hold)
- `confidence`: Decimal (置信度，0-1)
- `target_price`: Decimal (目标价格)
- `stop_loss_price`: Decimal (止损价格)
- `time_horizon`: Integer (时间周期，天数)
- `reasoning`: Text (决策理由)
- `generated_at`: DateTime (生成时间)
- `expires_at`: DateTime (过期时间)
- `created_at`: DateTime (创建时间)

**关系**:

- 一对多: Decision → VoteResult (投票详情)

### 5. 投票结果实体 (VoteResult)

存储多模型投票的详细结果。

**字段**:

- `id`: UUID (主键)
- `decision_id`: UUID (外键，关联 Decision)
- `model_id`: UUID (外键，关联 AIModel)
- `vote_type`: String (投票类型: buy/sell/hold)
- `confidence`: Decimal (模型置信度，0-1)
- `signal_strength`: Decimal (信号强度，-1 到 1)
- `reasoning`: Text (模型推理过程)
- `created_at`: DateTime (创建时间)

**索引**:

- 复合索引: (decision_id, model_id)

### 6. 回测结果实体 (BacktestResult)

存储历史回测表现数据。

**字段**:

- `id`: UUID (主键)
- `stock_id`: UUID (外键，关联 Stock)
- `model_id`: UUID (外键，关联 AIModel)
- `start_date`: Date (回测开始日期)
- `end_date`: Date (回测结束日期)
- `total_return`: Decimal (总收益率)
- `annual_return`: Decimal (年化收益率)
- `sharpe_ratio`: Decimal (夏普比率)
- `max_drawdown`: Decimal (最大回撤)
- `win_rate`: Decimal (胜率)
- `profit_factor`: Decimal (盈利因子)
- `total_trades`: Integer (总交易次数)
- `avg_trade_return`: Decimal (平均交易收益率)
- `created_at`: DateTime (创建时间)

**索引**:

- 复合索引: (stock_id, model_id, start_date, end_date)

### 7. 交易记录实体 (TradeRecord)

存储模拟交易记录。

**字段**:

- `id`: UUID (主键)
- `stock_id`: UUID (外键，关联 Stock)
- `decision_id`: UUID (外键，关联 Decision)
- `trade_type`: String (交易类型: buy/sell)
- `entry_price`: Decimal (入场价格)
- `exit_price`: Decimal (出场价格)
- `quantity`: Integer (交易数量)
- `entry_date`: DateTime (入场时间)
- `exit_date`: DateTime (出场时间)
- `holding_period`: Integer (持有天数)
- `return_amount`: Decimal (收益金额)
- `return_percent`: Decimal (收益率)
- `created_at`: DateTime (创建时间)

## 数据验证规则

### 股票数据验证

- 股票代码必须符合市场规范格式
- 价格数据必须为正数
- 涨跌幅必须在合理范围内 (-50% 到 +50%)

### 决策数据验证

- 置信度必须在 0 到 1 之间
- 目标价格必须高于当前价格 (买入) 或低于当前价格 (卖出)
- 时间周期必须为正整数

### 回测数据验证

- 收益率数据必须合理
- 夏普比率和最大回撤必须在合理范围内
- 交易次数必须为非负整数

## 状态转换

### 决策状态机

```
pending → active → expired
         ↘ executed
```

- `pending`: 决策生成但未执行
- `active`: 决策有效期内
- `expired`: 决策已过期
- `executed`: 决策已执行交易

### 模型状态机

```
training → active → inactive
         ↘ retraining
```

- `training`: 模型正在训练
- `active`: 模型已启用
- `inactive`: 模型已停用
- `retraining`: 模型正在重新训练

## 数据关系图

```
Stock (1) ←→ (N) StockPrice
Stock (1) ←→ (N) Decision
Stock (1) ←→ (N) BacktestResult
Stock (1) ←→ (N) TradeRecord

AIModel (1) ←→ (N) VoteResult
AIModel (1) ←→ (N) BacktestResult

Decision (1) ←→ (N) VoteResult
Decision (1) ←→ (N) TradeRecord
```

## 性能考虑

### 索引策略

- 高频查询字段建立索引
- 复合索引优化多条件查询
- 分区表处理历史价格数据

### 数据归档

- 历史价格数据按年分区
- 旧决策数据定期归档
- 回测结果数据长期保存
