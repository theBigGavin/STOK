"""
模型管理API
"""

from datetime import date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.config.database import get_db_session
from src.models.database import BacktestModel, ModelPerformance, ModelDecision
from src.models.stock_models import (
    BacktestModelResponse, BacktestModelCreate, BacktestModelUpdate,
    ModelPerformanceResponse, BacktestRequest, APIResponse, PaginatedResponse
)
from src.services.stock_service import StockService
from src.ml_models.base import BaseBacktestModel

router = APIRouter()


@router.get("/models", response_model=APIResponse)
async def get_models(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    active_only: bool = Query(True, description="只返回活跃模型"),
    model_type: Optional[str] = Query(None, description="模型类型过滤")
):
    """获取模型列表"""
    async with get_db_session() as session:
        # 构建查询条件
        conditions = []
        if active_only:
            conditions.append(BacktestModel.is_active == True)
        if model_type:
            conditions.append(BacktestModel.model_type == model_type)
        
        # 查询总数
        count_query = select(BacktestModel)
        if conditions:
            for condition in conditions:
                count_query = count_query.where(condition)
        
        total_result = await session.execute(select(BacktestModel.id).select_from(count_query.subquery()))
        total = len(total_result.scalars().all())
        
        # 查询数据
        query = select(BacktestModel).offset(skip).limit(limit)
        if conditions:
            for condition in conditions:
                query = query.where(condition)
        
        result = await session.execute(query)
        models = result.scalars().all()
        
        # 构建响应数据
        models_data = []
        for model in models:
            model_data = BacktestModelResponse.model_validate(model)
            
            # 获取最新性能指标
            perf_result = await session.execute(
                select(ModelPerformance)
                .where(ModelPerformance.model_id == model.id)
                .order_by(ModelPerformance.backtest_date.desc())
                .limit(1)
            )
            latest_perf = perf_result.scalar_one_or_none()
            
            if latest_perf:
                model_data.performance_metrics = {
                    "accuracy": latest_perf.accuracy,
                    "precision": latest_perf.precision,
                    "recall": latest_perf.recall,
                    "f1_score": latest_perf.f1_score,
                    "total_return": latest_perf.total_return,
                    "sharpe_ratio": latest_perf.sharpe_ratio,
                    "max_drawdown": latest_perf.max_drawdown
                }
            else:
                model_data.performance_metrics = {}
            
            models_data.append(model_data)
        
        return APIResponse(
            data=PaginatedResponse(
                data=models_data,
                total=total,
                skip=skip,
                limit=limit
            ),
            message="获取模型列表成功",
            status="success"
        )

@router.get("/models/performance", response_model=APIResponse)
async def get_all_model_performance():
    """获取所有模型的性能指标"""
    async with get_db_session() as session:
        # 查询所有活跃模型
        models_result = await session.execute(
            select(BacktestModel).where(BacktestModel.is_active == True)
        )
        active_models = models_result.scalars().all()
        
        performance_data = []
        
        for model in active_models:
            # 获取每个模型的最新性能记录
            perf_result = await session.execute(
                select(ModelPerformance)
                .where(ModelPerformance.model_id == model.id)
                .order_by(ModelPerformance.backtest_date.desc())
                .limit(1)
            )
            latest_perf = perf_result.scalar_one_or_none()
            
            # 获取该模型的性能记录总数作为数据点数量
            count_result = await session.execute(
                select(ModelPerformance.id).where(ModelPerformance.model_id == model.id)
            )
            data_points = len(count_result.scalars().all())
            
            # 构建性能指标数据
            if latest_perf:
                metrics = {
                    "accuracy": float(latest_perf.accuracy) if latest_perf.accuracy else None,
                    "precision": float(latest_perf.precision) if latest_perf.precision else None,
                    "recall": float(latest_perf.recall) if latest_perf.recall else None,
                    "f1Score": float(latest_perf.f1_score) if latest_perf.f1_score else None,
                    "totalReturn": float(latest_perf.total_return) if latest_perf.total_return else None,
                    "sharpeRatio": float(latest_perf.sharpe_ratio) if latest_perf.sharpe_ratio else None,
                    "maxDrawdown": float(latest_perf.max_drawdown) if latest_perf.max_drawdown else None,
                }
                
                # 计算胜率（基于决策记录）
                win_rate_result = await session.execute(
                    select(ModelDecision)
                    .where(
                        ModelDecision.model_id == model.id,
                        ModelDecision.decision == 'BUY'
                    )
                )
                buy_decisions = win_rate_result.scalars().all()
                total_decisions_result = await session.execute(
                    select(ModelDecision).where(ModelDecision.model_id == model.id)
                )
                total_decisions = total_decisions_result.scalars().all()
                
                win_rate = len(buy_decisions) / len(total_decisions) if total_decisions else 0
                metrics["winRate"] = float(win_rate)
                
                last_updated = latest_perf.backtest_date.isoformat() if latest_perf.backtest_date else ""
            else:
                # 如果没有性能记录，返回空的指标
                metrics = {}
                last_updated = ""
            
            performance_data.append({
                "modelId": model.id,
                "modelName": model.name,
                "metrics": metrics,
                "lastUpdated": last_updated,
                "dataPoints": data_points
            })
        
        return APIResponse(
            data=performance_data,
            message="获取模型性能指标成功",
            status="success"
        )


@router.get("/models/{model_id}", response_model=APIResponse)
async def get_model(
    model_id: int
):
    """获取模型详情"""
    async with get_db_session() as session:
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        # 获取性能历史
        perf_result = await session.execute(
            select(ModelPerformance)
            .where(ModelPerformance.model_id == model_id)
            .order_by(ModelPerformance.backtest_date.desc())
            .limit(10)  # 返回最近10次回测结果
        )
        performance_history = perf_result.scalars().all()
        
        model_data = BacktestModelResponse.model_validate(model)
        model_data.performance_history = [
            ModelPerformanceResponse.model_validate(perf) for perf in performance_history
        ]
        
        return APIResponse(
            data=model_data,
            message="获取模型详情成功",
            status="success"
        )


@router.post("/models", response_model=APIResponse)
async def create_model(
    model_data: BacktestModelCreate
):
    """创建新模型"""
    async with get_db_session() as session:
        # 检查模型名称是否已存在
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.name == model_data.name)
        )
        existing_model = result.scalar_one_or_none()
        
        if existing_model:
            raise HTTPException(status_code=400, detail=f"模型名称 {model_data.name} 已存在")
        
        # 创建新模型
        model = BacktestModel(**model_data.model_dump())
        session.add(model)
        await session.commit()
        await session.refresh(model)
        
        return APIResponse(
            data=BacktestModelResponse.model_validate(model),
            message="模型创建成功",
            status="success"
        )


@router.put("/models/{model_id}", response_model=APIResponse)
async def update_model(
    model_id: int,
    model_data: BacktestModelUpdate
):
    """更新模型信息"""
    async with get_db_session() as session:
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        # 更新字段
        update_data = model_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(model, field, value)
        
        await session.commit()
        await session.refresh(model)
        
        return APIResponse(
            data=BacktestModelResponse.model_validate(model),
            message="模型更新成功",
            status="success"
        )


@router.delete("/models/{model_id}", response_model=APIResponse)
async def delete_model(
    model_id: int
):
    """删除模型（软删除）"""
    async with get_db_session() as session:
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        # 软删除
        model.is_active = False
        await session.commit()
        
        return APIResponse(
            data=None,
            message=f"模型 {model_id} 已删除",
            status="success"
        )


@router.post("/models/{model_id}/backtest", response_model=APIResponse)
async def run_model_backtest(
    model_id: int,
    backtest_request: BacktestRequest
):
    """运行模型回测"""
    async with get_db_session() as session:
        # 检查模型是否存在
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
    
    # 使用股票服务获取真实数据
    stock_service = StockService(session)
    
    try:
        # 获取股票数据
        stock_data = await stock_service.get_stock_data(
            backtest_request.symbol,
            backtest_request.start_date,
            backtest_request.end_date
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取股票数据失败: {str(e)}")
    
    if stock_data.empty:
        raise HTTPException(
            status_code=404,
            detail=f"股票 {backtest_request.symbol} 在指定时间段内无数据"
        )
    
    # 根据模型类型创建对应的模型实例
    model_instance = await _create_model_instance(model, stock_data)
    
    if not model_instance:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的模型类型: {model.model_type}"
        )
    
    # 执行真实回测
    try:
        backtest_result = model_instance.backtest(
            stock_data,
            backtest_request.initial_capital
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"回测执行失败: {str(e)}"
        )
    
    # 格式化回测结果
    formatted_result = _format_backtest_result(backtest_result, stock_data)
    
    return APIResponse(
        data={
            "model_id": model_id,
            "symbol": backtest_request.symbol,
            "backtest_result": formatted_result
        },
        message="回测完成",
        status="success"
    )


async def _create_model_instance(model: BacktestModel, stock_data) -> Optional[BaseBacktestModel]:
    """根据模型配置创建模型实例"""
    from src.ml_models.technical_models import (
        MovingAverageCrossover, RSIModel, MACDModel
    )
    
    model_params = model.parameters or {}
    
    try:
        if model.model_type == "moving_average_crossover":
            short_window = model_params.get('short_window', 5)
            long_window = model_params.get('long_window', 20)
            return MovingAverageCrossover(
                model_id=model.id,
                short_window=short_window,
                long_window=long_window
            )
        
        elif model.model_type == "rsi_model":
            period = model_params.get('period', 14)
            overbought = model_params.get('overbought', 70)
            oversold = model_params.get('oversold', 30)
            return RSIModel(
                model_id=model.id,
                period=period,
                overbought=overbought,
                oversold=oversold
            )
        
        elif model.model_type == "macd_model":
            fast_period = model_params.get('fast_period', 12)
            slow_period = model_params.get('slow_period', 26)
            signal_period = model_params.get('signal_period', 9)
            return MACDModel(
                model_id=model.id,
                fast_period=fast_period,
                slow_period=slow_period,
                signal_period=signal_period
            )
        
        else:
            return None
            
    except Exception:
        return None


def _format_backtest_result(backtest_result: dict, stock_data) -> dict:
    """格式化回测结果"""
    # 计算额外指标
    returns = stock_data['close_price'].pct_change().dropna()
    volatility = returns.std() * (252 ** 0.5)  # 年化波动率
    
    # 计算最大回撤
    cumulative_returns = (1 + returns).cumprod()
    running_max = cumulative_returns.expanding().max()
    drawdown = (cumulative_returns - running_max) / running_max
    max_drawdown = drawdown.min()
    
    # 计算年化收益率
    total_days = (stock_data['trade_date'].max() - stock_data['trade_date'].min()).days
    annual_return = (1 + backtest_result['total_return']) ** (365 / total_days) - 1 if total_days > 0 else 0
    
    # 计算夏普比率
    sharpe_ratio = annual_return / volatility if volatility > 0 else 0
    
    # 格式化交易记录
    formatted_trades = []
    for trade in backtest_result.get('trades', []):
        formatted_trades.append({
            "type": trade['type'],
            "date": trade['date'].strftime("%Y-%m-%d") if hasattr(trade['date'], 'strftime') else str(trade['date']),
            "price": float(trade['price']),
            "shares": int(trade['shares']),
            "value": float(trade.get('value', trade['price'] * trade['shares']))
        })
    
    # 格式化信号
    formatted_signals = []
    for signal in backtest_result.get('signals', []):
        if hasattr(signal, 'model_dump'):
            signal_data = signal.model_dump()
        else:
            signal_data = signal
            
        formatted_signals.append({
            "date": stock_data.iloc[len(formatted_signals)]['trade_date'].strftime("%Y-%m-%d") if len(formatted_signals) < len(stock_data) else "",
            "decision": signal_data.get('decision', 'HOLD'),
            "confidence": float(signal_data.get('confidence', 0)),
            "signal_strength": float(signal_data.get('signal_strength', 0)),
            "reasoning": signal_data.get('reasoning', '')
        })
    
    return {
        "total_return": float(backtest_result['total_return']),
        "annual_return": float(annual_return),
        "volatility": float(volatility),
        "sharpe_ratio": float(sharpe_ratio),
        "max_drawdown": float(max_drawdown),
        "final_value": float(backtest_result.get('final_value', 0)),
        "total_trades": len(formatted_trades),
        "winning_trades": len([t for t in formatted_trades if t['type'] == 'SELL']),  # 简化：卖出视为盈利交易
        "losing_trades": 0,  # 简化处理
        "trades": formatted_trades,
        "signals": formatted_signals
    }


@router.get("/models/{model_id}/performance", response_model=APIResponse)
async def get_model_performance(
    model_id: int,
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期")
):
    """获取模型性能历史"""
    async with get_db_session() as session:
        # 检查模型是否存在
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        # 构建查询条件
        query = select(ModelPerformance).where(ModelPerformance.model_id == model_id)
        
        if start_date:
            query = query.where(ModelPerformance.backtest_date >= start_date)
        if end_date:
            query = query.where(ModelPerformance.backtest_date <= end_date)
        
        query = query.order_by(ModelPerformance.backtest_date.desc())
        
        result = await session.execute(query)
        performance_data = result.scalars().all()
        
        return APIResponse(
            data={
                "model_id": model_id,
                "performance_history": [
                    ModelPerformanceResponse.model_validate(perf) for perf in performance_data
                ]
            },
            message="获取模型性能历史成功",
            status="success"
        )


@router.post("/models/{model_id}/performance", response_model=APIResponse)
async def create_model_performance(
    model_id: int,
    performance_data: ModelPerformanceResponse
):
    """创建模型性能记录"""
    async with get_db_session() as session:
        # 检查模型是否存在
        result = await session.execute(
            select(BacktestModel).where(BacktestModel.id == model_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        # 检查性能记录是否已存在
        existing_result = await session.execute(
            select(ModelPerformance)
            .where(
                ModelPerformance.model_id == model_id,
                ModelPerformance.backtest_date == performance_data.backtest_date
            )
        )
        existing_perf = existing_result.scalar_one_or_none()
        
        if existing_perf:
            raise HTTPException(
                status_code=400,
                detail=f"模型 {model_id} 在 {performance_data.backtest_date} 的性能记录已存在"
            )
        
        # 创建性能记录
        performance = ModelPerformance(
            model_id=model_id,
            **performance_data.model_dump(exclude={'id', 'created_at'})
        )
        session.add(performance)
        await session.commit()
        await session.refresh(performance)
        
        return APIResponse(
            data=ModelPerformanceResponse.model_validate(performance),
            message="创建模型性能记录成功",
            status="success"
        )