"""
数据库模型定义 - 根据数据模型文档更新
"""

from sqlalchemy import (
    String, Boolean, DateTime, Date, Numeric, Integer, Text, 
    ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
import uuid

class Base(DeclarativeBase):
    """基础模型类"""
    pass

class Stock(Base):
    """股票实体表"""
    __tablename__ = "stocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(50))
    market: Mapped[str] = mapped_column(String(10), nullable=False)
    current_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    price_change: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    price_change_percent: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    volume: Mapped[Optional[int]] = mapped_column(Integer)
    market_cap: Mapped[Optional[float]] = mapped_column(Numeric(15, 2))
    pe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    pb_ratio: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    dividend_yield: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关系
    stock_prices: Mapped[list["StockPrice"]] = relationship(back_populates="stock")
    decisions: Mapped[list["Decision"]] = relationship(back_populates="stock")
    backtest_results: Mapped[list["BacktestResult"]] = relationship(back_populates="stock")
    trade_records: Mapped[list["TradeRecord"]] = relationship(back_populates="stock")

class StockPrice(Base):
    """股票价格实体表"""
    __tablename__ = "stock_prices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[datetime] = mapped_column(Date, nullable=False)
    open_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    high_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    low_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    close_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    volume: Mapped[Optional[int]] = mapped_column(Integer)
    adjusted_close: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="stock_prices")

    __table_args__ = (
        UniqueConstraint('stock_id', 'date', name='uq_stock_date'),
    )

class AIModel(Base):
    """AI 模型实体表"""
    __tablename__ = "ai_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    weight: Mapped[Optional[float]] = mapped_column(Numeric(3, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    performance_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    last_trained_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关系
    vote_results: Mapped[list["VoteResult"]] = relationship(back_populates="model")
    backtest_results: Mapped[list["BacktestResult"]] = relationship(back_populates="model")

    __table_args__ = (
        CheckConstraint("weight >= 0 AND weight <= 1", name='chk_weight_range'),
        CheckConstraint("performance_score >= 0 AND performance_score <= 1", name='chk_performance_range'),
    )

class Decision(Base):
    """决策实体表"""
    __tablename__ = "decisions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    decision_type: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    target_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    stop_loss_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    time_horizon: Mapped[Optional[int]] = mapped_column(Integer)
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="decisions")
    vote_results: Mapped[list["VoteResult"]] = relationship(back_populates="decision")
    trade_records: Mapped[list["TradeRecord"]] = relationship(back_populates="decision")

    __table_args__ = (
        CheckConstraint("decision_type IN ('buy', 'sell', 'hold')", name='chk_decision_type'),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name='chk_confidence_range'),
        CheckConstraint("time_horizon > 0", name='chk_time_horizon'),
    )

class VoteResult(Base):
    """投票结果实体表"""
    __tablename__ = "vote_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    vote_type: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    signal_strength: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    decision: Mapped["Decision"] = relationship(back_populates="vote_results")
    model: Mapped["AIModel"] = relationship(back_populates="vote_results")

    __table_args__ = (
        UniqueConstraint('decision_id', 'model_id', name='uq_decision_model'),
        CheckConstraint("vote_type IN ('buy', 'sell', 'hold')", name='chk_vote_type'),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name='chk_vote_confidence_range'),
        CheckConstraint("signal_strength >= -1 AND signal_strength <= 1", name='chk_signal_strength_range'),
    )

class BacktestResult(Base):
    """回测结果实体表"""
    __tablename__ = "backtest_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    total_return: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    annual_return: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    max_drawdown: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    win_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    profit_factor: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    total_trades: Mapped[Optional[int]] = mapped_column(Integer)
    avg_trade_return: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="backtest_results")
    model: Mapped["AIModel"] = relationship(back_populates="backtest_results")

    __table_args__ = (
        UniqueConstraint('stock_id', 'model_id', 'start_date', 'end_date', name='uq_stock_model_date_range'),
    )

class TradeRecord(Base):
    """交易记录实体表"""
    __tablename__ = "trade_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    decision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    trade_type: Mapped[str] = mapped_column(String(10), nullable=False)
    entry_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    exit_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    quantity: Mapped[Optional[int]] = mapped_column(Integer)
    entry_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    exit_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    holding_period: Mapped[Optional[int]] = mapped_column(Integer)
    return_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    return_percent: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="trade_records")
    decision: Mapped["Decision"] = relationship(back_populates="trade_records")

    __table_args__ = (
        CheckConstraint("trade_type IN ('buy', 'sell')", name='chk_trade_type'),
        CheckConstraint("quantity > 0", name='chk_quantity'),
        CheckConstraint("holding_period >= 0", name='chk_holding_period'),
    )