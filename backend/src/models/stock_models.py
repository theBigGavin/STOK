"""
股票数据模型定义 - 根据数据模型文档更新
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal
import uuid


class DecisionType(str, Enum):
    """决策类型枚举"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class ModelType(str, Enum):
    """模型类型枚举"""
    TECHNICAL = "technical"
    FUNDAMENTAL = "fundamental"
    MACHINE_LEARNING = "machine_learning"


class TradeType(str, Enum):
    """交易类型枚举"""
    BUY = "buy"
    SELL = "sell"


class MarketType(str, Enum):
    """市场类型枚举"""
    A_SHARE = "A股"
    HK_SHARE = "港股"
    US_SHARE = "美股"


class APIResponse(BaseModel):
    """API响应模型"""
    data: Optional[Any] = Field(None, description="响应数据")
    message: str = Field(..., description="响应消息")
    status: str = Field(..., description="响应状态")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="时间戳")


class PaginatedResponse(BaseModel):
    """分页响应模型"""
    data: List[Any] = Field(..., description="数据列表")
    total: int = Field(..., description="总记录数")
    skip: int = Field(0, description="跳过记录数")
    limit: int = Field(100, description="限制记录数")


# 股票相关模型
class StockBase(BaseModel):
    """股票基础模型"""
    symbol: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    industry: Optional[str] = Field(None, description="所属行业")
    market: MarketType = Field(..., description="市场类型")
    current_price: Optional[Decimal] = Field(None, gt=0, description="当前价格")
    price_change: Optional[Decimal] = Field(None, description="价格变动")
    price_change_percent: Optional[Decimal] = Field(None, ge=-50, le=50, description="涨跌幅")
    volume: Optional[int] = Field(None, ge=0, description="成交量")
    market_cap: Optional[Decimal] = Field(None, gt=0, description="市值")
    pe_ratio: Optional[Decimal] = Field(None, gt=0, description="市盈率")
    pb_ratio: Optional[Decimal] = Field(None, gt=0, description="市净率")
    dividend_yield: Optional[Decimal] = Field(None, ge=0, description="股息率")


class StockCreate(StockBase):
    """股票创建模型"""
    pass


class StockUpdate(BaseModel):
    """股票更新模型"""
    name: Optional[str] = None
    industry: Optional[str] = None
    market: Optional[MarketType] = None
    current_price: Optional[Decimal] = None
    price_change: Optional[Decimal] = None
    price_change_percent: Optional[Decimal] = None
    volume: Optional[int] = None
    market_cap: Optional[Decimal] = None
    pe_ratio: Optional[Decimal] = None
    pb_ratio: Optional[Decimal] = None
    dividend_yield: Optional[Decimal] = None


class StockResponse(StockBase):
    """股票响应模型"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 股票价格相关模型
class StockPriceBase(BaseModel):
    """股票价格基础模型"""
    date: date = Field(..., description="交易日期")
    open_price: Optional[Decimal] = Field(None, gt=0, description="开盘价")
    high_price: Optional[Decimal] = Field(None, gt=0, description="最高价")
    low_price: Optional[Decimal] = Field(None, gt=0, description="最低价")
    close_price: Optional[Decimal] = Field(None, gt=0, description="收盘价")
    volume: Optional[int] = Field(None, ge=0, description="成交量")
    adjusted_close: Optional[Decimal] = Field(None, gt=0, description="调整后收盘价")


class StockPriceCreate(StockPriceBase):
    """股票价格创建模型"""
    stock_id: uuid.UUID = Field(..., description="股票ID")


class StockPriceResponse(StockPriceBase):
    """股票价格响应模型"""
    id: uuid.UUID
    stock_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# AI 模型相关模型
class AIModelBase(BaseModel):
    """AI 模型基础模型"""
    name: str = Field(..., description="模型名称")
    model_type: ModelType = Field(..., description="模型类型")
    description: Optional[str] = Field(None, description="模型描述")
    weight: Decimal = Field(1.0, ge=0, le=1, description="投票权重")
    is_active: bool = Field(True, description="是否启用")
    performance_score: Optional[Decimal] = Field(None, ge=0, le=1, description="历史表现评分")


class AIModelCreate(AIModelBase):
    """AI 模型创建模型"""
    pass


class AIModelUpdate(BaseModel):
    """AI 模型更新模型"""
    name: Optional[str] = None
    model_type: Optional[ModelType] = None
    description: Optional[str] = None
    weight: Optional[Decimal] = None
    is_active: Optional[bool] = None
    performance_score: Optional[Decimal] = None


class AIModelResponse(AIModelBase):
    """AI 模型响应模型"""
    id: uuid.UUID
    last_trained_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 决策相关模型
class DecisionBase(BaseModel):
    """决策基础模型"""
    decision_type: DecisionType = Field(..., description="决策类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    target_price: Optional[Decimal] = Field(None, gt=0, description="目标价格")
    stop_loss_price: Optional[Decimal] = Field(None, gt=0, description="止损价格")
    time_horizon: Optional[int] = Field(None, gt=0, description="时间周期")
    reasoning: Optional[str] = Field(None, description="决策理由")


class DecisionCreate(DecisionBase):
    """决策创建模型"""
    stock_id: uuid.UUID = Field(..., description="股票ID")


class DecisionResponse(DecisionBase):
    """决策响应模型"""
    id: uuid.UUID
    stock_id: uuid.UUID
    generated_at: datetime
    expires_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 投票结果相关模型
class VoteResultBase(BaseModel):
    """投票结果基础模型"""
    vote_type: DecisionType = Field(..., description="投票类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="模型置信度")
    signal_strength: Decimal = Field(..., ge=-1, le=1, description="信号强度")
    reasoning: Optional[str] = Field(None, description="模型推理过程")


class VoteResultCreate(VoteResultBase):
    """投票结果创建模型"""
    decision_id: uuid.UUID = Field(..., description="决策ID")
    model_id: uuid.UUID = Field(..., description="模型ID")


class VoteResultResponse(VoteResultBase):
    """投票结果响应模型"""
    id: uuid.UUID
    decision_id: uuid.UUID
    model_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 回测结果相关模型
class BacktestResultBase(BaseModel):
    """回测结果基础模型"""
    start_date: date = Field(..., description="回测开始日期")
    end_date: date = Field(..., description="回测结束日期")
    total_return: Optional[Decimal] = Field(None, description="总收益率")
    annual_return: Optional[Decimal] = Field(None, description="年化收益率")
    sharpe_ratio: Optional[Decimal] = Field(None, description="夏普比率")
    max_drawdown: Optional[Decimal] = Field(None, description="最大回撤")
    win_rate: Optional[Decimal] = Field(None, ge=0, le=1, description="胜率")
    profit_factor: Optional[Decimal] = Field(None, description="盈利因子")
    total_trades: Optional[int] = Field(None, ge=0, description="总交易次数")
    avg_trade_return: Optional[Decimal] = Field(None, description="平均交易收益率")


class BacktestResultCreate(BacktestResultBase):
    """回测结果创建模型"""
    stock_id: uuid.UUID = Field(..., description="股票ID")
    model_id: uuid.UUID = Field(..., description="模型ID")


class BacktestResultResponse(BacktestResultBase):
    """回测结果响应模型"""
    id: uuid.UUID
    stock_id: uuid.UUID
    model_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 交易记录相关模型
class TradeRecordBase(BaseModel):
    """交易记录基础模型"""
    trade_type: TradeType = Field(..., description="交易类型")
    entry_price: Optional[Decimal] = Field(None, gt=0, description="入场价格")
    exit_price: Optional[Decimal] = Field(None, gt=0, description="出场价格")
    quantity: Optional[int] = Field(None, gt=0, description="交易数量")
    entry_date: Optional[datetime] = Field(None, description="入场时间")
    exit_date: Optional[datetime] = Field(None, description="出场时间")
    holding_period: Optional[int] = Field(None, ge=0, description="持有天数")
    return_amount: Optional[Decimal] = Field(None, description="收益金额")
    return_percent: Optional[Decimal] = Field(None, description="收益率")


class TradeRecordCreate(TradeRecordBase):
    """交易记录创建模型"""
    stock_id: uuid.UUID = Field(..., description="股票ID")
    decision_id: uuid.UUID = Field(..., description="决策ID")


class TradeRecordResponse(TradeRecordBase):
    """交易记录响应模型"""
    id: uuid.UUID
    stock_id: uuid.UUID
    decision_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# 请求模型
class RecommendationRequest(BaseModel):
    """推荐请求模型"""
    symbols: Optional[List[str]] = Field(None, description="股票代码列表")
    limit: int = Field(10, ge=1, le=100, description="推荐数量限制")


class DecisionDetailRequest(BaseModel):
    """决策详情请求模型"""
    decision_id: uuid.UUID = Field(..., description="决策ID")


class BacktestRequest(BaseModel):
    """回测请求模型"""
    symbol: str = Field(..., description="股票代码")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    initial_capital: Decimal = Field(100000, gt=0, description="初始资金")
    model_ids: Optional[List[uuid.UUID]] = Field(None, description="模型ID列表")