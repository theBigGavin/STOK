"""
股票数据模型定义
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal


class DecisionType(str, Enum):
    """决策类型枚举"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class VotingStrategy(str, Enum):
    """投票策略枚举"""
    MAJORITY = "majority"
    WEIGHTED = "weighted"
    CONFIDENCE = "confidence"


class RiskLevel(str, Enum):
    """风险等级枚举"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ModelType(str, Enum):
    """模型类型枚举"""
    TECHNICAL = "technical"
    MACHINE_LEARNING = "ml"
    DEEP_LEARNING = "dl"


class StockBase(BaseModel):
    """股票基础模型"""
    symbol: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    market: str = Field(..., description="市场类型")
    is_active: bool = Field(True, description="是否活跃")


class StockCreate(StockBase):
    """股票创建模型"""
    pass


class StockUpdate(BaseModel):
    """股票更新模型"""
    name: Optional[str] = None
    market: Optional[str] = None
    is_active: Optional[bool] = None


class StockResponse(StockBase):
    """股票响应模型"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockDailyDataBase(BaseModel):
    """股票日线数据基础模型"""
    symbol: str = Field(..., description="股票代码")
    trade_date: date = Field(..., description="交易日期")
    open_price: Decimal = Field(..., gt=0, description="开盘价")
    high_price: Decimal = Field(..., gt=0, description="最高价")
    low_price: Decimal = Field(..., gt=0, description="最低价")
    close_price: Decimal = Field(..., gt=0, description="收盘价")
    volume: int = Field(..., gt=0, description="成交量")
    turnover: Optional[Decimal] = Field(None, description="成交额")


class StockDailyDataCreate(StockDailyDataBase):
    """股票日线数据创建模型"""
    pass


class StockDailyDataUpdate(BaseModel):
    """股票日线数据更新模型"""
    open_price: Optional[Decimal] = None
    high_price: Optional[Decimal] = None
    low_price: Optional[Decimal] = None
    close_price: Optional[Decimal] = None
    volume: Optional[int] = None
    turnover: Optional[Decimal] = None


class StockDailyDataResponse(StockDailyDataBase):
    """股票日线数据响应模型"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BacktestModelBase(BaseModel):
    """回测模型基础模型"""
    name: str = Field(..., description="模型名称")
    description: Optional[str] = Field(None, description="模型描述")
    model_type: ModelType = Field(..., description="模型类型")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="模型参数")
    weight: Decimal = Field(1.0, ge=0, le=1, description="模型权重")
    is_active: bool = Field(True, description="是否活跃")


class BacktestModelCreate(BacktestModelBase):
    """回测模型创建模型"""
    pass


class BacktestModelUpdate(BaseModel):
    """回测模型更新模型"""
    name: Optional[str] = None
    description: Optional[str] = None
    model_type: Optional[ModelType] = None
    parameters: Optional[Dict[str, Any]] = None
    weight: Optional[Decimal] = None
    is_active: Optional[bool] = None


class BacktestModelResponse(BacktestModelBase):
    """回测模型响应模型"""
    id: int
    created_at: datetime
    performance_metrics: Optional[Dict[str, Any]] = Field(None, description="性能指标")
    performance_history: Optional[List[Any]] = Field(None, description="性能历史")

    model_config = ConfigDict(from_attributes=True)


class ModelSignal(BaseModel):
    """模型信号模型"""
    model_id: int = Field(..., description="模型ID")
    decision: DecisionType = Field(..., description="决策类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    signal_strength: Decimal = Field(..., ge=0, le=1, description="信号强度")
    reasoning: Optional[str] = Field(None, description="决策理由")


class ModelDecisionBase(BaseModel):
    """模型决策基础模型"""
    symbol: str = Field(..., description="股票代码")
    trade_date: date = Field(..., description="交易日期")
    model_id: int = Field(..., description="模型ID")
    decision: DecisionType = Field(..., description="决策类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    signal_strength: Decimal = Field(..., ge=0, le=1, description="信号强度")


class ModelDecisionCreate(ModelDecisionBase):
    """模型决策创建模型"""
    pass


class ModelDecisionResponse(ModelDecisionBase):
    """模型决策响应模型"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinalDecisionBase(BaseModel):
    """综合决策基础模型"""
    symbol: str = Field(..., description="股票代码")
    trade_date: date = Field(..., description="交易日期")
    final_decision: DecisionType = Field(..., description="最终决策")
    confidence_score: Decimal = Field(..., ge=0, le=1, description="综合置信度")
    vote_summary: Dict[str, int] = Field(..., description="投票统计")
    risk_level: RiskLevel = Field(..., description="风险等级")


class FinalDecisionCreate(FinalDecisionBase):
    """综合决策创建模型"""
    pass


class FinalDecisionResponse(FinalDecisionBase):
    """综合决策响应模型"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelPerformanceBase(BaseModel):
    """模型性能基础模型"""
    model_id: int = Field(..., description="模型ID")
    backtest_date: date = Field(..., description="回测日期")
    accuracy: Optional[Decimal] = Field(None, ge=0, le=1, description="准确率")
    precision: Optional[Decimal] = Field(None, ge=0, le=1, description="精确率")
    recall: Optional[Decimal] = Field(None, ge=0, le=1, description="召回率")
    f1_score: Optional[Decimal] = Field(None, ge=0, le=1, description="F1分数")
    total_return: Optional[Decimal] = Field(None, description="总收益率")
    sharpe_ratio: Optional[Decimal] = Field(None, description="夏普比率")
    max_drawdown: Optional[Decimal] = Field(None, description="最大回撤")


class ModelPerformanceCreate(ModelPerformanceBase):
    """模型性能创建模型"""
    pass


class ModelPerformanceResponse(ModelPerformanceBase):
    """模型性能响应模型"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VotingConfig(BaseModel):
    """投票配置模型"""
    strategy: VotingStrategy = Field(VotingStrategy.WEIGHTED, description="投票策略")
    threshold: Decimal = Field(0.6, ge=0, le=1, description="决策阈值")
    min_confidence: Decimal = Field(0.6, ge=0, le=1, description="最小置信度")
    enable_risk_control: bool = Field(True, description="启用风险控制")


class RiskConfig(BaseModel):
    """风险配置模型"""
    max_daily_loss: Decimal = Field(0.05, ge=0, le=1, description="最大日亏损")
    max_position_size: Decimal = Field(0.1, ge=0, le=1, description="最大仓位比例")
    volatility_threshold: Decimal = Field(0.03, ge=0, description="波动率阈值")
    enable_circuit_breaker: bool = Field(True, description="启用熔断机制")


class DecisionRequest(BaseModel):
    """决策请求模型"""
    symbol: str = Field(..., description="股票代码")
    trade_date: date = Field(..., description="交易日期")
    current_position: Optional[Decimal] = Field(0.0, ge=0, le=1, description="当前仓位")


class BatchDecisionRequest(BaseModel):
    """批量决策请求模型"""
    symbols: List[str] = Field(..., description="股票代码列表")
    trade_date: date = Field(..., description="交易日期")


class BacktestRequest(BaseModel):
    """回测请求模型"""
    symbol: str = Field(..., description="股票代码")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    initial_capital: Decimal = Field(100000, gt=0, description="初始资金")
    model_ids: Optional[List[int]] = Field(None, description="模型ID列表")


class PortfolioBacktestRequest(BaseModel):
    """组合回测请求模型"""
    symbols: List[str] = Field(..., description="股票代码列表")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    initial_capital: Decimal = Field(100000, gt=0, description="初始资金")
    rebalance_frequency: str = Field("monthly", description="再平衡频率")


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