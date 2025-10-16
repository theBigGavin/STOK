"""
模型管理API
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.src.config.database import get_db_session
from backend.src.models.database import BacktestModel, ModelPerformance
from backend.src.models.stock_models import (
    BacktestModelResponse, BacktestModelCreate, BacktestModelUpdate,
    ModelPerformanceResponse, BacktestRequest, APIResponse, PaginatedResponse
)

router = APIRouter()


@router.get("/models", response_model=APIResponse)
async def get_models(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    active_only: bool = Query(True, description="只返回活跃模型"),
    model_type: Optional[str] = Query(None, description="模型类型过滤"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取模型列表"""
    
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


@router.get("/models/{model_id}", response_model=APIResponse)
async def get_model(
    model_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """获取模型详情"""
    
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
    model_data: BacktestModelCreate,
    session: AsyncSession = Depends(get_db_session)
):
    """创建新模型"""
    
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
    model_data: BacktestModelUpdate,
    session: AsyncSession = Depends(get_db_session)
):
    """更新模型信息"""
    
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
    model_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """删除模型（软删除）"""
    
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
    backtest_request: BacktestRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """运行模型回测"""
    
    # 检查模型是否存在
    result = await session.execute(
        select(BacktestModel).where(BacktestModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
    
    # 这里应该调用回测服务
    # 暂时返回模拟响应
    
    return APIResponse(
        data={
            "model_id": model_id,
            "symbol": backtest_request.symbol,
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
                "signals": []
            }
        },
        message="回测完成",
        status="success"
    )


@router.get("/models/{model_id}/performance", response_model=APIResponse)
async def get_model_performance(
    model_id: int,
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取模型性能历史"""
    
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
    performance_data: ModelPerformanceResponse,
    session: AsyncSession = Depends(get_db_session)
):
    """创建模型性能记录"""
    
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