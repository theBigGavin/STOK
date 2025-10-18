"""
股票数据服务 - 根据数据模型文档更新
"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from src.config.database import get_db_session
from src.models.database import Stock, StockPrice, Decision, VoteResult, AIModel
from src.models.stock_models import StockCreate, StockUpdate, StockPriceCreate, DecisionCreate, VoteResultCreate


class StockService:
    """股票数据服务"""

    def __init__(self, session: AsyncSession):
        self.session = session

    # 股票相关方法
    async def get_stock_by_symbol(self, symbol: str) -> Optional[Stock]:
        """根据股票代码获取股票"""
        result = await self.session.execute(
            select(Stock).where(Stock.symbol == symbol)
        )
        return result.scalar_one_or_none()

    async def get_stock_by_id(self, stock_id: str) -> Optional[Stock]:
        """根据股票ID获取股票"""
        result = await self.session.execute(
            select(Stock).where(Stock.id == stock_id)
        )
        return result.scalar_one_or_none()

    async def get_stocks(self, market: Optional[str] = None, limit: int = 100, skip: int = 0) -> List[Stock]:
        """获取股票列表"""
        query = select(Stock)
        
        if market:
            query = query.where(Stock.market == market)
        
        query = query.offset(skip).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_stock(self, stock_data: StockCreate) -> Stock:
        """创建股票"""
        # 检查股票是否已存在
        existing_stock = await self.get_stock_by_symbol(stock_data.symbol)
        if existing_stock:
            raise ValueError(f"股票 {stock_data.symbol} 已存在")

        stock = Stock(**stock_data.model_dump())
        self.session.add(stock)
        await self.session.commit()
        await self.session.refresh(stock)
        return stock

    async def update_stock(self, symbol: str, update_data: StockUpdate) -> Optional[Stock]:
        """更新股票信息"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            return None

        # 更新字段
        for field, value in update_data.model_dump(exclude_unset=True).items():
            if hasattr(stock, field):
                setattr(stock, field, value)

        stock.updated_at = datetime.now()
        await self.session.commit()
        await self.session.refresh(stock)
        return stock

    async def delete_stock(self, symbol: str) -> bool:
        """删除股票"""
        stock = await self.get_stock_by_symbol(symbol)
        if not stock:
            return False

        await self.session.delete(stock)
        await self.session.commit()
        return True

    # 股票价格相关方法
    async def get_stock_prices(self, stock_id: str, start_date: date, end_date: date) -> List[StockPrice]:
        """获取股票价格数据"""
        result = await self.session.execute(
            select(StockPrice)
            .where(
                and_(
                    StockPrice.stock_id == stock_id,
                    StockPrice.date >= start_date,
                    StockPrice.date <= end_date
                )
            )
            .order_by(StockPrice.date.asc())
        )
        return result.scalars().all()

    async def get_latest_stock_price(self, stock_id: str) -> Optional[StockPrice]:
        """获取最新股票价格"""
        result = await self.session.execute(
            select(StockPrice)
            .where(StockPrice.stock_id == stock_id)
            .order_by(StockPrice.date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_stock_price(self, price_data: StockPriceCreate) -> StockPrice:
        """创建股票价格记录"""
        # 检查价格记录是否已存在
        existing_result = await self.session.execute(
            select(StockPrice)
            .where(
                and_(
                    StockPrice.stock_id == price_data.stock_id,
                    StockPrice.date == price_data.date
                )
            )
        )
        existing_price = existing_result.scalar_one_or_none()

        if existing_price:
            raise ValueError(f"股票价格记录在 {price_data.date} 已存在")

        stock_price = StockPrice(**price_data.model_dump())
        self.session.add(stock_price)
        await self.session.commit()
        await self.session.refresh(stock_price)
        return stock_price

    async def batch_create_stock_prices(self, price_data_list: List[StockPriceCreate]) -> List[StockPrice]:
        """批量创建股票价格记录"""
        created_prices = []
        
        for price_data in price_data_list:
            try:
                stock_price = await self.create_stock_price(price_data)
                created_prices.append(stock_price)
            except ValueError:
                # 跳过已存在的记录
                continue

        return created_prices

    # 决策相关方法
    async def get_decisions_for_stock(self, stock_id: str, limit: int = 50, skip: int = 0) -> List[Decision]:
        """获取股票的决策列表"""
        result = await self.session.execute(
            select(Decision)
            .where(Decision.stock_id == stock_id)
            .order_by(Decision.generated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_latest_decision(self, stock_id: str) -> Optional[Decision]:
        """获取最新决策"""
        result = await self.session.execute(
            select(Decision)
            .where(Decision.stock_id == stock_id)
            .order_by(Decision.generated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_decision(self, decision_data: DecisionCreate) -> Decision:
        """创建决策"""
        decision = Decision(**decision_data.model_dump())
        self.session.add(decision)
        await self.session.commit()
        await self.session.refresh(decision)
        return decision

    # 投票结果相关方法
    async def get_vote_results_for_decision(self, decision_id: str) -> List[VoteResult]:
        """获取决策的投票结果"""
        result = await self.session.execute(
            select(VoteResult)
            .where(VoteResult.decision_id == decision_id)
            .order_by(VoteResult.confidence.desc())
        )
        return result.scalars().all()

    async def create_vote_result(self, vote_data: VoteResultCreate) -> VoteResult:
        """创建投票结果"""
        vote_result = VoteResult(**vote_data.model_dump())
        self.session.add(vote_result)
        await self.session.commit()
        await self.session.refresh(vote_result)
        return vote_result

    # 推荐相关方法
    async def get_recommended_stocks(self, limit: int = 10, skip: int = 0) -> List[Dict[str, Any]]:
        """获取推荐股票列表"""
        # 获取最新的决策
        subquery = (
            select(
                Decision.stock_id,
                func.max(Decision.generated_at).label('latest_generated_at')
            )
            .group_by(Decision.stock_id)
            .subquery()
        )

        result = await self.session.execute(
            select(Decision, Stock)
            .join(Stock, Decision.stock_id == Stock.id)
            .join(subquery, and_(
                Decision.stock_id == subquery.c.stock_id,
                Decision.generated_at == subquery.c.latest_generated_at
            ))
            .where(Decision.decision_type == 'buy')  # 只推荐买入决策
            .order_by(Decision.confidence.desc())
            .offset(skip)
            .limit(limit)
        )
        
        recommendations = []
        for decision, stock in result:
            # 获取投票结果
            vote_results = await self.get_vote_results_for_decision(decision.id)
            
            recommendations.append({
                'stock': stock,
                'decision': decision,
                'vote_results': vote_results,
                'total_votes': len(vote_results),
                'buy_votes': len([v for v in vote_results if v.vote_type == 'buy']),
                'sell_votes': len([v for v in vote_results if v.vote_type == 'sell']),
                'hold_votes': len([v for v in vote_results if v.vote_type == 'hold'])
            })
        
        return recommendations

    async def get_stock_recommendation_details(self, stock_id: str) -> Optional[Dict[str, Any]]:
        """获取股票推荐详情"""
        stock = await self.get_stock_by_id(stock_id)
        if not stock:
            return None

        latest_decision = await self.get_latest_decision(stock_id)
        if not latest_decision:
            return None

        vote_results = await self.get_vote_results_for_decision(latest_decision.id)
        latest_price = await self.get_latest_stock_price(stock_id)

        return {
            'stock': stock,
            'latest_decision': latest_decision,
            'vote_results': vote_results,
            'latest_price': latest_price,
            'vote_summary': {
                'total_votes': len(vote_results),
                'buy_votes': len([v for v in vote_results if v.vote_type == 'buy']),
                'sell_votes': len([v for v in vote_results if v.vote_type == 'sell']),
                'hold_votes': len([v for v in vote_results if v.vote_type == 'hold']),
                'avg_confidence': sum(v.confidence for v in vote_results) / len(vote_results) if vote_results else 0,
                'avg_signal_strength': sum(v.signal_strength for v in vote_results) / len(vote_results) if vote_results else 0
            }
        }

    # 统计方法
    async def get_stock_statistics(self) -> Dict[str, Any]:
        """获取股票统计信息"""
        # 股票总数
        total_stocks_result = await self.session.execute(
            select(func.count(Stock.id))
        )
        total_stocks = total_stocks_result.scalar()

        # 按市场分类统计
        market_stats_result = await self.session.execute(
            select(Stock.market, func.count(Stock.id))
            .group_by(Stock.market)
        )
        market_stats = dict(market_stats_result.all())

        # 决策统计
        decision_stats_result = await self.session.execute(
            select(Decision.decision_type, func.count(Decision.id))
            .group_by(Decision.decision_type)
        )
        decision_stats = dict(decision_stats_result.all())

        # 最新决策时间
        latest_decision_result = await self.session.execute(
            select(func.max(Decision.generated_at))
        )
        latest_decision_time = latest_decision_result.scalar()

        return {
            'total_stocks': total_stocks,
            'market_distribution': market_stats,
            'decision_distribution': decision_stats,
            'latest_decision_time': latest_decision_time,
            'stocks_with_decisions': await self.get_stocks_with_decisions_count(),
            'stocks_with_prices': await self.get_stocks_with_prices_count()
        }

    async def get_stocks_with_decisions_count(self) -> int:
        """获取有决策的股票数量"""
        result = await self.session.execute(
            select(func.count(func.distinct(Decision.stock_id)))
        )
        return result.scalar()

    async def get_stocks_with_prices_count(self) -> int:
        """获取有价格数据的股票数量"""
        result = await self.session.execute(
            select(func.count(func.distinct(StockPrice.stock_id)))
        )
        return result.scalar()

    # 数据导入/导出方法
    async def export_stock_data(self, stock_id: str, start_date: date, end_date: date) -> pd.DataFrame:
        """导出股票数据到DataFrame"""
        prices = await self.get_stock_prices(stock_id, start_date, end_date)
        
        df_data = []
        for price in prices:
            df_data.append({
                'date': price.date,
                'open': float(price.open_price) if price.open_price else None,
                'high': float(price.high_price) if price.high_price else None,
                'low': float(price.low_price) if price.low_price else None,
                'close': float(price.close_price) if price.close_price else None,
                'volume': price.volume,
                'adjusted_close': float(price.adjusted_close) if price.adjusted_close else None
            })
        
        return pd.DataFrame(df_data)

    async def import_stock_data(self, stock_id: str, df: pd.DataFrame) -> List[StockPrice]:
        """从DataFrame导入股票数据"""
        price_data_list = []
        
        for _, row in df.iterrows():
            price_data = StockPriceCreate(
                stock_id=stock_id,
                date=row['date'],
                open_price=row.get('open'),
                high_price=row.get('high'),
                low_price=row.get('low'),
                close_price=row.get('close'),
                volume=row.get('volume'),
                adjusted_close=row.get('adjusted_close')
            )
            price_data_list.append(price_data)
        
        return await self.batch_create_stock_prices(price_data_list)

    # 搜索方法
    async def search_stocks(self, query: str, market: Optional[str] = None, limit: int = 20) -> List[Stock]:
        """搜索股票"""
        search_conditions = [
            Stock.symbol.ilike(f"%{query}%"),
            Stock.name.ilike(f"%{query}%")
        ]
        
        if market:
            search_conditions.append(Stock.market == market)
        
        result = await self.session.execute(
            select(Stock)
            .where(and_(*search_conditions))
            .limit(limit)
        )
        return result.scalars().all()


# 依赖函数
async def get_stock_service(session: AsyncSession = None) -> StockService:
    """获取股票服务实例"""
    if session is None:
        # 正确使用异步上下文管理器
        async with get_db_session() as session:
            return StockService(session)
    return StockService(session)