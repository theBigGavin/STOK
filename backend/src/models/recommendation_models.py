"""
推荐数据模型定义 - 实现用户故事 US1
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal
import uuid

from src.models.stock_models import DecisionType, ModelType


class RecommendationStatus(str, Enum):
    """推荐状态枚举"""
    ACTIVE = "active"
    EXPIRED = "expired"
    EXECUTED = "executed"
    CANCELLED = "cancelled"


class RecommendationType(str, Enum):
    """推荐类型枚举"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    STRONG_BUY = "strong_buy"
    STRONG_SELL = "strong_sell"


class RecommendationPriority(str, Enum):
    """推荐优先级枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecommendationBase(BaseModel):
    """推荐基础模型"""
    symbol: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    recommendation_type: RecommendationType = Field(..., description="推荐类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    signal_strength: Decimal = Field(..., ge=-1, le=1, description="信号强度")
    target_price: Optional[Decimal] = Field(None, gt=0, description="目标价格")
    stop_loss_price: Optional[Decimal] = Field(None, gt=0, description="止损价格")
    reasoning: str = Field(..., description="推荐理由")
    priority: RecommendationPriority = Field(RecommendationPriority.MEDIUM, description="推荐优先级")
    time_horizon: Optional[int] = Field(None, gt=0, description="时间周期（天）")
    expected_return: Optional[Decimal] = Field(None, description="预期收益率")


class RecommendationCreate(RecommendationBase):
    """推荐创建模型"""
    model_votes: Optional[List[Dict[str, Any]]] = Field(None, description="模型投票详情")


class RecommendationUpdate(BaseModel):
    """推荐更新模型"""
    recommendation_type: Optional[RecommendationType] = None
    confidence: Optional[Decimal] = None
    signal_strength: Optional[Decimal] = None
    target_price: Optional[Decimal] = None
    stop_loss_price: Optional[Decimal] = None
    reasoning: Optional[str] = None
    priority: Optional[RecommendationPriority] = None
    time_horizon: Optional[int] = None
    expected_return: Optional[Decimal] = None
    status: Optional[RecommendationStatus] = None


class RecommendationResponse(RecommendationBase):
    """推荐响应模型"""
    id: uuid.UUID
    status: RecommendationStatus
    model_votes: Optional[List[Dict[str, Any]]] = Field(None, description="模型投票详情")
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class RecommendationSummary(BaseModel):
    """推荐摘要模型"""
    symbol: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    recommendation_type: RecommendationType = Field(..., description="推荐类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    signal_strength: Decimal = Field(..., ge=-1, le=1, description="信号强度")
    reasoning: str = Field(..., description="推荐理由")
    priority: RecommendationPriority = Field(..., description="推荐优先级")
    last_updated: datetime = Field(..., description="最后更新时间")


class RecommendationBatchRequest(BaseModel):
    """批量推荐请求模型"""
    symbols: Optional[List[str]] = Field(None, description="股票代码列表")
    market_condition: Optional[str] = Field(None, description="市场条件过滤")
    min_confidence: Decimal = Field(0.6, ge=0, le=1, description="最小置信度阈值")
    limit: int = Field(10, ge=1, le=100, description="推荐数量限制")


class RecommendationBatchResponse(BaseModel):
    """批量推荐响应模型"""
    recommendations: List[RecommendationSummary] = Field(..., description="推荐列表")
    total_count: int = Field(..., description="总推荐数量")
    market_condition: Optional[str] = Field(None, description="市场条件")
    min_confidence: Decimal = Field(..., description="最小置信度阈值")
    generated_at: datetime = Field(..., description="生成时间")


class ModelVoteDetail(BaseModel):
    """模型投票详情模型"""
    model_name: str = Field(..., description="模型名称")
    model_type: ModelType = Field(..., description="模型类型")
    vote_type: DecisionType = Field(..., description="投票类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="模型置信度")
    signal_strength: Decimal = Field(..., ge=-1, le=1, description="信号强度")
    reasoning: str = Field(..., description="模型推理过程")
    weight: Decimal = Field(..., ge=0, le=1, description="投票权重")


class RecommendationDetailResponse(RecommendationBase):
    """推荐详情响应模型"""
    id: uuid.UUID
    status: RecommendationStatus
    model_votes: List[ModelVoteDetail] = Field(..., description="模型投票详情")
    sector: Optional[str] = Field(None, description="所属行业")
    market_cap: Optional[Decimal] = Field(None, description="市值")
    current_price: Optional[Decimal] = Field(None, description="当前价格")
    price_change_percent: Optional[Decimal] = Field(None, description="涨跌幅")
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class RecommendationHistory(BaseModel):
    """推荐历史模型"""
    recommendation_type: RecommendationType = Field(..., description="推荐类型")
    confidence: Decimal = Field(..., ge=0, le=1, description="置信度")
    signal_strength: Decimal = Field(..., ge=-1, le=1, description="信号强度")
    reasoning: str = Field(..., description="推荐理由")
    created_at: datetime
    model_votes: List[ModelVoteDetail] = Field(..., description="模型投票详情")


class RecommendationStats(BaseModel):
    """推荐统计模型"""
    total_recommendations: int = Field(..., description="总推荐数量")
    active_recommendations: int = Field(..., description="活跃推荐数量")
    buy_recommendations: int = Field(..., description="买入推荐数量")
    sell_recommendations: int = Field(..., description="卖出推荐数量")
    hold_recommendations: int = Field(..., description="持有推荐数量")
    avg_confidence: Decimal = Field(..., description="平均置信度")
    high_priority_count: int = Field(..., description="高优先级推荐数量")
    recommendation_distribution: Dict[str, int] = Field(..., description="推荐类型分布")


class MarketInsight(BaseModel):
    """市场洞察模型"""
    market_condition: str = Field(..., description="市场状况")
    dominant_sentiment: RecommendationType = Field(..., description="主导情绪")
    avg_confidence: Decimal = Field(..., description="平均置信度")
    top_sectors: List[str] = Field(..., description="热门行业")
    recommendation_count: int = Field(..., description="推荐数量")
    generated_at: datetime = Field(..., description="生成时间")