"""
股票数据API
"""

from datetime import date
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from src.config.database import get_db_session
from src.models.database import Stock, StockDailyData
from src.models.stock_models import (
    StockResponse, StockCreate, StockUpdate, StockDailyDataResponse,
    StockDailyDataCreate, StockDailyDataUpdate, APIResponse, PaginatedResponse
)

router = APIRouter()


@router.get("/stocks", response_model=APIResponse)
async def get_stocks(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    active_only: bool = Query(True, description="只返回活跃股票"),
    market: Optional[str] = Query(None, description="市场类型过滤")
):
    """获取股票列表"""
    async with get_db_session() as session:
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
    symbol: str
):
    """获取股票详情"""
    async with get_db_session() as session:
        try:
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
        except HTTPException:
            raise
        except Exception as e:
            # 记录详细错误信息
            print(f"GET /stocks/{symbol} 错误: {str(e)}")
            raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@router.post("/stocks", response_model=APIResponse)
async def create_stock(
    stock_data: StockCreate
):
    """创建股票"""
    async with get_db_session() as session:
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
    stock_data: StockUpdate
):
    """更新股票信息"""
    async with get_db_session() as session:
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
    symbol: str
):
    """删除股票（软删除）"""
    async with get_db_session() as session:
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
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(1000, ge=1, le=10000, description="返回记录数")
):
    """获取股票历史数据"""
    async with get_db_session() as session:
        try:
            # 获取股票
            stock_result = await session.execute(
                select(Stock).where(Stock.symbol == symbol)
            )
            stock = stock_result.scalar_one_or_none()
            
            if not stock:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
            
            # 查询历史数据总数
            count_result = await session.execute(
                select(StockDailyData.id)
                .where(
                    and_(
                        StockDailyData.stock_id == stock.id,
                        StockDailyData.trade_date >= start_date,
                        StockDailyData.trade_date <= end_date
                    )
                )
            )
            total_count = len(count_result.scalars().all())
            
            # 查询分页数据
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
                .offset(skip)
                .limit(limit)
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
                        "record_count": len(data_list),
                        "total_count": total_count,
                        "skip": skip,
                        "limit": limit,
                        "has_more": (skip + len(data_list)) < total_count
                    }
                },
                message="获取股票数据成功",
                status="success"
            )
        except HTTPException:
            raise
        except Exception as e:
            # 记录详细错误信息
            print(f"GET /stocks/{symbol}/data 错误: {str(e)}")
            raise HTTPException(status_code=500, detail=f"获取股票数据失败: {str(e)}")


@router.get("/stocks/{symbol}/latest", response_model=APIResponse)
async def get_latest_stock_data(
    symbol: str
):
    """获取最新股票数据"""
    async with get_db_session() as session:
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
    symbol: str
):
    """刷新股票数据 - 从外部数据源获取最新数据并更新到数据库"""
    async with get_db_session() as session:
        try:
            # 获取股票信息
            stock_result = await session.execute(
                select(Stock).where(Stock.symbol == symbol)
            )
            stock = stock_result.scalar_one_or_none()
            
            if not stock:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
            
            # 获取最新的交易日期
            latest_date_result = await session.execute(
                select(StockDailyData.trade_date)
                .where(StockDailyData.stock_id == stock.id)
                .order_by(StockDailyData.trade_date.desc())
                .limit(1)
            )
            latest_date = latest_date_result.scalar_one_or_none()
            
            # 模拟从外部API获取股票数据
            # 在实际应用中，这里应该调用真实的数据源API，如AKShare、Tushare等
            new_data = await _fetch_stock_data_from_external(symbol, latest_date)
            
            if not new_data:
                return APIResponse(
                    data={
                        "symbol": symbol,
                        "updated_records": 0,
                        "status": "no_new_data"
                    },
                    message=f"股票 {symbol} 没有新的数据需要更新",
                    status="success"
                )
            
            # 批量插入新数据
            updated_count = 0
            for data_item in new_data:
                # 检查数据是否已存在
                existing_result = await session.execute(
                    select(StockDailyData)
                    .where(
                        and_(
                            StockDailyData.stock_id == stock.id,
                            StockDailyData.trade_date == data_item["trade_date"]
                        )
                    )
                )
                existing_data = existing_result.scalar_one_or_none()
                
                if not existing_data:
                    # 创建新数据记录
                    daily_data = StockDailyData(
                        stock_id=stock.id,
                        trade_date=data_item["trade_date"],
                        open_price=data_item["open_price"],
                        high_price=data_item["high_price"],
                        low_price=data_item["low_price"],
                        close_price=data_item["close_price"],
                        volume=data_item["volume"],
                        turnover=data_item.get("turnover")
                    )
                    session.add(daily_data)
                    updated_count += 1
            
            # 提交事务
            await session.commit()
            
            return APIResponse(
                data={
                    "symbol": symbol,
                    "updated_records": updated_count,
                    "status": "completed"
                },
                message=f"成功更新股票 {symbol} 的 {updated_count} 条数据",
                status="success"
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 回滚事务
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"更新股票数据时发生错误: {str(e)}"
            )


async def _fetch_stock_data_from_external(symbol: str, latest_date: Optional[date]) -> List[Dict]:
    """
    从外部数据源获取股票数据（模拟实现）
    
    在实际应用中，这里应该调用真实的数据源API
    """
    # 模拟数据获取逻辑
    # 这里返回一些模拟的股票数据
    import random
    from datetime import date, timedelta
    
    # 如果没有最新日期，则从30天前开始
    if not latest_date:
        start_date = date.today() - timedelta(days=30)
    else:
        start_date = latest_date + timedelta(days=1)
    
    # 如果开始日期在今天之后，则没有新数据
    if start_date > date.today():
        return []
    
    # 生成模拟数据（从开始日期到今天）
    new_data = []
    current_date = start_date
    
    while current_date <= date.today():
        # 生成模拟价格数据
        base_price = 10.0 + random.uniform(-2.0, 2.0)  # 基础价格在8-12之间
        
        open_price = round(base_price + random.uniform(-0.5, 0.5), 2)
        close_price = round(base_price + random.uniform(-0.5, 0.5), 2)
        high_price = round(max(open_price, close_price) + random.uniform(0, 1.0), 2)
        low_price = round(min(open_price, close_price) - random.uniform(0, 1.0), 2)
        volume = random.randint(1000000, 50000000)
        turnover = round(volume * close_price, 2)
        
        new_data.append({
            "trade_date": current_date,
            "open_price": open_price,
            "high_price": high_price,
            "low_price": low_price,
            "close_price": close_price,
            "volume": volume,
            "turnover": turnover
        })
        
        current_date += timedelta(days=1)
    
    return new_data


@router.post("/stocks/{symbol}/data", response_model=APIResponse)
async def create_stock_data(
    symbol: str,
    data: StockDailyDataCreate
):
    """创建股票日线数据"""
    async with get_db_session() as session:
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