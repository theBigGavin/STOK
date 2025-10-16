"""
股票数据服务
"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from src.config.database import get_db_session
from src.models.database import Stock, StockDailyData
from src.models.stock_models import StockDailyDataCreate


class StockService:
    """股票数据服务"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stock_by_symbol(self, symbol: str) -> Optional[Stock]:
        """根据股票代码获取股票"""
        result = await self.session.execute(
            select(Stock).where(Stock.symbol == symbol)
        )
        return result.scalar_one_or_none()

    async def get_stocks(self, active_only: bool = True, market: Optional[str] = None) -> List[Stock]:
        """获取股票列表"""
        conditions = []
        if active_only:
            conditions.append(Stock.is_active == True)
        if market:
            conditions.append(Stock.market == market)

        query = select(Stock)
        if conditions:
            query = query.where(and_(*conditions))

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_stock_data(self, symbol: str, start_date: date, end_date: date) -> pd.DataFrame:
        """获取股票历史数据"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        result = await self.session.execute(
            select(StockDailyData)
            .where(
                and_(
                    StockDailyData.stock_id == stock.id,
                    StockDailyData.trade_date >= start_date,
                    StockDailyData.trade_date <= end_date
                )
            )
            .order_by(StockDailyData.trade_date.asc())
        )
        data = result.scalars().all()

        # 转换为DataFrame
        df_data = []
        for record in data:
            df_data.append({
                'trade_date': record.trade_date,
                'open_price': float(record.open_price) if record.open_price else None,
                'high_price': float(record.high_price) if record.high_price else None,
                'low_price': float(record.low_price) if record.low_price else None,
                'close_price': float(record.close_price) if record.close_price else None,
                'volume': record.volume,
                'turnover': float(record.turnover) if record.turnover else None
            })

        return pd.DataFrame(df_data)

    async def get_latest_stock_data(self, symbol: str, days: int = 30) -> pd.DataFrame:
        """获取最近N天的股票数据"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        return await self.get_stock_data(symbol, start_date, end_date)

    async def create_stock_data(self, symbol: str, data: StockDailyDataCreate) -> StockDailyData:
        """创建股票日线数据"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        # 检查数据是否已存在
        existing_result = await self.session.execute(
            select(StockDailyData)
            .where(
                and_(
                    StockDailyData.stock_id == stock.id,
                    StockDailyData.trade_date == data.trade_date
                )
            )
        )
        existing_data = existing_result.scalar_one_or_none()

        if existing_data:
            raise ValueError(f"股票 {symbol} 在 {data.trade_date} 的数据已存在")

        # 创建新数据
        daily_data = StockDailyData(
            stock_id=stock.id,
            **data.model_dump(exclude={'symbol'})
        )
        self.session.add(daily_data)
        await self.session.commit()
        await self.session.refresh(daily_data)

        return daily_data

    async def batch_create_stock_data(self, symbol: str, data_list: List[StockDailyDataCreate]) -> List[StockDailyData]:
        """批量创建股票日线数据"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        created_data = []
        for data in data_list:
            # 检查数据是否已存在
            existing_result = await self.session.execute(
                select(StockDailyData)
                .where(
                    and_(
                        StockDailyData.stock_id == stock.id,
                        StockDailyData.trade_date == data.trade_date
                    )
                )
            )
            existing_data = existing_result.scalar_one_or_none()

            if not existing_data:
                daily_data = StockDailyData(
                    stock_id=stock.id,
                    **data.model_dump(exclude={'symbol'})
                )
                self.session.add(daily_data)
                created_data.append(daily_data)

        await self.session.commit()
        
        # 刷新所有创建的对象
        for data in created_data:
            await self.session.refresh(data)

        return created_data

    async def update_stock_data(self, symbol: str, trade_date: date, update_data: Dict[str, Any]) -> Optional[StockDailyData]:
        """更新股票日线数据"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        result = await self.session.execute(
            select(StockDailyData)
            .where(
                and_(
                    StockDailyData.stock_id == stock.id,
                    StockDailyData.trade_date == trade_date
                )
            )
        )
        daily_data = result.scalar_one_or_none()

        if not daily_data:
            return None

        # 更新字段
        for field, value in update_data.items():
            if hasattr(daily_data, field):
                setattr(daily_data, field, value)

        await self.session.commit()
        await self.session.refresh(daily_data)

        return daily_data

    async def get_stock_data_range(self, symbol: str) -> Dict[str, Optional[date]]:
        """获取股票数据的时间范围"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        # 获取最早和最晚的交易日期
        min_date_result = await self.session.execute(
            select(StockDailyData.trade_date)
            .where(StockDailyData.stock_id == stock.id)
            .order_by(StockDailyData.trade_date.asc())
            .limit(1)
        )
        min_date = min_date_result.scalar_one_or_none()

        max_date_result = await self.session.execute(
            select(StockDailyData.trade_date)
            .where(StockDailyData.stock_id == stock.id)
            .order_by(StockDailyData.trade_date.desc())
            .limit(1)
        )
        max_date = max_date_result.scalar_one_or_none()

        return {
            'min_date': min_date,
            'max_date': max_date
        }

    async def get_stocks_with_data(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """获取有数据的股票列表"""
        stocks = await self.get_stocks(active_only=active_only)
        stocks_with_data = []

        for stock in stocks:
            data_range = await self.get_stock_data_range(stock.symbol)
            if data_range['min_date'] and data_range['max_date']:
                stocks_with_data.append({
                    'stock': stock,
                    'data_range': data_range,
                    'data_count': await self.get_stock_data_count(stock.symbol)
                })

        return stocks_with_data

    async def get_stock_data_count(self, symbol: str) -> int:
        """获取股票数据数量"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            return 0

        result = await self.session.execute(
            select(StockDailyData.id)
            .where(StockDailyData.stock_id == stock.id)
        )
        return len(result.scalars().all())


    async def get_stock_data_paginated(self, symbol: str, start_date: date, end_date: date, skip: int = 0, limit: int = 1000) -> Dict[str, Any]:
        """获取股票历史数据（支持分页）"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            raise ValueError(f"股票 {symbol} 不存在")

        # 查询总记录数
        count_result = await self.session.execute(
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
        result = await self.session.execute(
            select(StockDailyData)
            .where(
                and_(
                    StockDailyData.stock_id == stock.id,
                    StockDailyData.trade_date >= start_date,
                    StockDailyData.trade_date <= end_date
                )
            )
            .order_by(StockDailyData.trade_date.asc())
            .offset(skip)
            .limit(limit)
        )
        data = result.scalars().all()

        # 转换为DataFrame
        df_data = []
        for record in data:
            df_data.append({
                'trade_date': record.trade_date,
                'open_price': float(record.open_price) if record.open_price else None,
                'high_price': float(record.high_price) if record.high_price else None,
                'low_price': float(record.low_price) if record.low_price else None,
                'close_price': float(record.close_price) if record.close_price else None,
                'volume': record.volume,
                'turnover': float(record.turnover) if record.turnover else None
            })

        return {
            'data': pd.DataFrame(df_data),
            'pagination': {
                'total': total_count,
                'skip': skip,
                'limit': limit,
                'has_more': (skip + len(data)) < total_count
            }
        }


# 依赖函数
async def get_stock_service(session: AsyncSession = None) -> StockService:
    """获取股票服务实例"""
    if session is None:
        # 正确使用异步上下文管理器
        async with get_db_session() as session:
            return StockService(session)
    return StockService(session)