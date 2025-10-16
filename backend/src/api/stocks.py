"""
股票数据API
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from config.database import get_db_session
from models.database import Stock, StockDailyData
from models.stock_models import (
    StockResponse, StockCreate, StockUpdate, StockDailyDataResponse,
    StockDailyDataCreate, StockDailyDataUpdate, APIResponse, PaginatedResponse
)

router = APIRouter()


@router.get("/stocks", response_model=APIResponse)
async def get_stocks(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    active_only: bool = Query(True, description="只返回活跃股票"),
    market: Optional[str] = Query(None, description="市场类型过滤"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票列表"""
    
    # 构建查询条件
    conditions = []
    if active_only:
        conditions.append(Stock.is_active == True)
    if market:
        conditions.append(Stock.market == market)
    
    # 查询总数
    count_query = select(Stock)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_result = await session.execute(select(Stock.id).select_from(count_query.subquery()))
    total = len(total_result.scalars().all())
    
    # 查询数据
    query = select(Stock).offset(skip).limit(limit)
    if conditions:
        query = query.where(and_(*conditions))
    
    result = await session.execute(query)
    stocks = result.scalars().all()
    
    return APIResponse(
        data=PaginatedResponse(
            data=[StockResponse.model_validate(stock) for stock in stocks],
            total=total,
            skip=skip,
            limit=limit
        ),
        message="获取股票列表成功",
        status="success"
    )


@router.get("/stocks/{symbol}", response_model=APIResponse)
async def get_stock(
    symbol: str,
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票详情"""
    
    result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    return APIResponse(
        data=StockResponse.model_validate(stock),
        message="获取股票详情成功",
        status="success"
    )


@router.post("/stocks", response_model=APIResponse)
async def create_stock(
    stock_data: StockCreate,
    session: AsyncSession = Depends(get_db_session)
):
    """创建股票"""
    
    # 检查股票是否已存在
    result = await session.execute(
        select(Stock).where(Stock.symbol == stock_data.symbol)
    )
    existing_stock = result.scalar_one_or_none()
    
    if existing_stock:
        raise HTTPException(status_code=400, detail=f"股票 {stock_data.symbol} 已存在")
    
    # 创建新股票
    stock = Stock(**stock_data.model_dump())
    session.add(stock)
    await session.commit()
    await session.refresh(stock)
    
    return APIResponse(
        data=StockResponse.model_validate(stock),
        message="创建股票成功",
        status="success"
    )


@router.put("/stocks/{symbol}", response_model=APIResponse)
async def update_stock(
    symbol: str,
    stock_data: StockUpdate,
    session: AsyncSession = Depends(get_db_session)
):
    """更新股票信息"""
    
    result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    # 更新字段
    update_data = stock_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stock, field, value)
    
    await session.commit()
    await session.refresh(stock)
    
    return APIResponse(
        data=StockResponse.model_validate(stock),
        message="更新股票信息成功",
        status="success"
    )


@router.delete("/stocks/{symbol}", response_model=APIResponse)
async def delete_stock(
    symbol: str,
    session: AsyncSession = Depends(get_db_session)
):
    """删除股票（软删除）"""
    
    result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    # 软删除
    stock.is_active = False
    await session.commit()
    
    return APIResponse(
        data=None,
        message=f"股票 {symbol} 已删除",
        status="success"
    )


@router.get("/stocks/{symbol}/data", response_model=APIResponse)
async def get_stock_data(
    symbol: str,
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    include_features: bool = Query(False, description="是否包含特征数据"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票历史数据"""
    
    # 获取股票
    stock_result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = stock_result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    # 查询历史数据
    result = await session.execute(
        select(StockDailyData)
        .where(
            and_(
                StockDailyData.stock_id == stock.id,
                StockDailyData.trade_date >= start_date,
                StockDailyData.trade_date <= end_date
            )
        )
        .order_by(StockDailyData.trade_date.desc())
    )
    daily_data = result.scalars().all()
    
    # 构建响应数据
    data_list = [StockDailyDataResponse.model_validate(data) for data in daily_data]
    
    return APIResponse(
        data={
            "symbol": symbol,
            "data": data_list,
            "metadata": {
                "start_date": start_date,
                "end_date": end_date,
                "record_count": len(data_list)
            }
        },
        message="获取股票数据成功",
        status="success"
    )


@router.get("/stocks/{symbol}/latest", response_model=APIResponse)
async def get_latest_stock_data(
    symbol: str,
    session: AsyncSession = Depends(get_db_session)
):
    """获取最新股票数据"""
    
    # 获取股票
    stock_result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = stock_result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    # 查询最新数据
    result = await session.execute(
        select(StockDailyData)
        .where(StockDailyData.stock_id == stock.id)
        .order_by(StockDailyData.trade_date.desc())
        .limit(1)
    )
    latest_data = result.scalar_one_or_none()
    
    if not latest_data:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 暂无数据")
    
    return APIResponse(
        data={
            "symbol": symbol,
            "latest_data": StockDailyDataResponse.model_validate(latest_data),
            "timestamp": latest_data.created_at
        },
        message="获取最新数据成功",
        status="success"
    )


@router.post("/stocks/{symbol}/refresh", response_model=APIResponse)
async def refresh_stock_data(
    symbol: str,
    session: AsyncSession = Depends(get_db_session)
):
    """刷新股票数据"""
    
    # 这里应该调用数据更新服务
    # 暂时返回模拟响应
    
    return APIResponse(
        data={
            "message": f"开始更新 {symbol} 的数据",
            "symbol": symbol,
            "status": "processing"
        },
        message="数据更新任务已启动",
        status="success"
    )


@router.post("/stocks/{symbol}/data", response_model=APIResponse)
async def create_stock_data(
    symbol: str,
    data: StockDailyDataCreate,
    session: AsyncSession = Depends(get_db_session)
):
    """创建股票日线数据"""
    
    # 获取股票
    stock_result = await session.execute(
        select(Stock).where(Stock.symbol == symbol)
    )
    stock = stock_result.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
    
    # 检查数据是否已存在
    result = await session.execute(
        select(StockDailyData)
        .where(
            and_(
                StockDailyData.stock_id == stock.id,
                StockDailyData.trade_date == data.trade_date
            )
        )
    )
    existing_data = result.scalar_one_or_none()
    
    if existing_data:
        raise HTTPException(
            status_code=400,
            detail=f"股票 {symbol} 在 {data.trade_date} 的数据已存在"
        )
    
    # 创建新数据
    daily_data = StockDailyData(
        stock_id=stock.id,
        **data.model_dump(exclude={'symbol'})
    )
    session.add(daily_data)
    await session.commit()
    await session.refresh(daily_data)
    
    return APIResponse(
        data=StockDailyDataResponse.model_validate(daily_data),
        message="创建股票数据成功",
        status="success"
    )