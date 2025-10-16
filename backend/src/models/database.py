"""
数据库模型定义
"""

from sqlalchemy import (
    BigInteger, String, Boolean, DateTime, Date, 
    Numeric, Integer, Text, ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import Optional

class Base(DeclarativeBase):
    """基础模型类"""
    pass

class Stock(Base):
    """股票基本信息表"""
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    market: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    daily_data: Mapped[list["StockDailyData"]] = relationship(back_populates="stock")
    model_decisions: Mapped[list["ModelDecision"]] = relationship(back_populates="stock")
    final_decisions: Mapped[list["FinalDecision"]] = relationship(back_populates="stock")

class StockDailyData(Base):
    """股票日线数据表"""
    __tablename__ = "stock_daily_data"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    stock_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    trade_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    open_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    high_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    low_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    close_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    volume: Mapped[Optional[int]] = mapped_column(BigInteger)
    turnover: Mapped[Optional[float]] = mapped_column(Numeric(15, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="daily_data")

    __table_args__ = (
        UniqueConstraint('stock_id', 'trade_date', name='uq_stock_date'),
    )

class BacktestModel(Base):
    """回测模型表"""
    __tablename__ = "backtest_models"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    model_type: Mapped[Optional[str]] = mapped_column(String(50))
    parameters: Mapped[Optional[dict]] = mapped_column(JSONB)
    weight: Mapped[Optional[float]] = mapped_column(Numeric(3, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    model_decisions: Mapped[list["ModelDecision"]] = relationship(back_populates="model")
    performances: Mapped[list["ModelPerformance"]] = relationship(back_populates="model")

class ModelDecision(Base):
    """模型决策记录表"""
    __tablename__ = "model_decisions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    stock_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("backtest_models.id", ondelete="CASCADE"), nullable=False)
    trade_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    decision: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    signal_strength: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="model_decisions")
    model: Mapped["BacktestModel"] = relationship(back_populates="model_decisions")

    __table_args__ = (
        UniqueConstraint('stock_id', 'model_id', 'trade_date', name='uq_stock_model_date'),
        CheckConstraint("decision IN ('BUY', 'SELL', 'HOLD')", name='chk_decision_type'),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name='chk_confidence_range'),
        CheckConstraint("signal_strength >= 0 AND signal_strength <= 1", name='chk_signal_range'),
    )

class FinalDecision(Base):
    """综合决策表"""
    __tablename__ = "final_decisions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    stock_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    trade_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    buy_votes: Mapped[Optional[int]] = mapped_column(Integer)
    sell_votes: Mapped[Optional[int]] = mapped_column(Integer)
    hold_votes: Mapped[Optional[int]] = mapped_column(Integer)
    final_decision: Mapped[Optional[str]] = mapped_column(String(10))
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    stock: Mapped["Stock"] = relationship(back_populates="final_decisions")

    __table_args__ = (
        UniqueConstraint('stock_id', 'trade_date', name='uq_final_stock_date'),
        CheckConstraint("final_decision IN ('BUY', 'SELL', 'HOLD')", name='chk_final_decision_type'),
        CheckConstraint("confidence_score >= 0 AND confidence_score <= 1", name='chk_final_confidence_range'),
    )

class ModelPerformance(Base):
    """模型性能表"""
    __tablename__ = "model_performance"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    model_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("backtest_models.id", ondelete="CASCADE"), nullable=False)
    backtest_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    accuracy: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    precision: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    recall: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    f1_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    total_return: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    max_drawdown: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    model: Mapped["BacktestModel"] = relationship(back_populates="performances")

    __table_args__ = (
        UniqueConstraint('model_id', 'backtest_date', name='uq_model_backtest_date'),
    )