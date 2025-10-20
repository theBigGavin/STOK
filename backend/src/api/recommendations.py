"""
股票推荐API - 实现用户故事 US1
"""

import logging
from datetime import date, datetime, timedelta
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func

from src.config.database import get_db_session
from src.models.stock_models import (
    APIResponse, PaginatedResponse, RecommendationRequest, DecisionType
)
from src.models.recommendation_models import (
    RecommendationBatchRequest, RecommendationBatchResponse,
    RecommendationDetailResponse, RecommendationHistory,
    RecommendationSummary, ModelVoteDetail
)
from src.models.database import Stock, Decision, VoteResult, AIModel
from src.services.stock_service import StockService, get_stock_service
from src.decision_engine.manager import DecisionEngineManager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/recommendations", response_model=APIResponse)
async def get_stock_recommendations(
    market_condition: Optional[str] = Query(None, description="市场条件过滤"),
    min_confidence: Optional[float] = Query(0.6, description="最小置信度阈值"),
    limit: Optional[int] = Query(10, description="返回推荐数量"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票推荐列表"""
    try:
        logger.info(f"获取股票推荐请求: market_condition={market_condition}, min_confidence={min_confidence}, limit={limit}")
        
        # 获取最新的决策结果
        subquery = (
            select(
                Decision.stock_id,
                func.max(Decision.created_at).label('latest_date')
            )
            .group_by(Decision.stock_id)
            .subquery()
        )
        
        # 查询最新的决策和投票结果
        query = (
            select(
                Stock.symbol,
                Stock.name,
                Decision.decision_type,
                Decision.confidence,
                Decision.signal_strength,
                Decision.reasoning,
                Decision.created_at
            )
            .join(subquery, and_(
                Decision.stock_id == subquery.c.stock_id,
                Decision.created_at == subquery.c.latest_date
            ))
            .join(Stock, Decision.stock_id == Stock.id)
            .where(Decision.confidence >= min_confidence)
            .order_by(desc(Decision.confidence))
            .limit(limit)
        )
        
        # 如果有市场条件过滤
        if market_condition:
            query = query.where(Decision.reasoning.ilike(f"%{market_condition}%"))
        
        result = await session.execute(query)
        recommendations = result.fetchall()
        
        # 格式化推荐结果
        formatted_recommendations = []
        for rec in recommendations:
            # 将决策类型映射到推荐类型
            recommendation_type = rec.decision_type.value
            if rec.confidence >= 0.8:
                if rec.decision_type.value == "buy":
                    recommendation_type = "strong_buy"
                elif rec.decision_type.value == "sell":
                    recommendation_type = "strong_sell"
            
            formatted_recommendations.append(RecommendationSummary(
                symbol=rec.symbol,
                name=rec.name,
                recommendation_type=recommendation_type,
                confidence=rec.confidence,
                signal_strength=rec.signal_strength,
                reasoning=rec.reasoning,
                priority="high" if rec.confidence >= 0.8 else "medium",
                last_updated=rec.created_at
            ))
        
        batch_response = RecommendationBatchResponse(
            recommendations=formatted_recommendations,
            total_count=len(formatted_recommendations),
            market_condition=market_condition,
            min_confidence=min_confidence,
            generated_at=datetime.now()
        )
        
        return APIResponse(
            data=batch_response.model_dump(),
            message="股票推荐获取成功",
            status="success"
        )
            
    except Exception as e:
        logger.error(f"获取股票推荐失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取股票推荐失败: {str(e)}")


@router.post("/recommendations/generate", response_model=APIResponse)
async def generate_recommendations(
    request: RecommendationRequest,
    stock_service: StockService = Depends(get_stock_service),
    session: AsyncSession = Depends(get_db_session)
):
    """生成新的股票推荐"""
    try:
        logger.info(f"生成股票推荐请求: {request}")
        
        # 获取决策引擎管理器
        decision_manager = DecisionEngineManager(session)
        
        # 获取股票列表
        if request.symbols:
            # 如果指定了特定股票
            stocks_result = await session.execute(
                select(Stock).where(Stock.symbol.in_(request.symbols))
            )
            stocks = stocks_result.scalars().all()
        else:
            # 获取所有活跃股票
            stocks_result = await session.execute(
                select(Stock).where(Stock.is_active == True)
            )
            stocks = stocks_result.scalars().all()
        
        recommendations = []
        
        # 为每个股票生成推荐
        for stock in stocks:
            try:
                # 获取股票数据
                stock_data = await stock_service.get_stock_data(stock.symbol)
                
                if stock_data:
                    # 使用决策引擎生成推荐
                    decision_result = await decision_manager.generate_decision(
                        stock.symbol,
                        stock_data
                    )
                    
                    if decision_result:
                        recommendations.append({
                            "symbol": stock.symbol,
                            "name": stock.name,
                            "decision_type": decision_result.decision_type.value,
                            "confidence": float(decision_result.confidence),
                            "signal_strength": float(decision_result.signal_strength),
                            "reasoning": decision_result.reasoning,
                            "target_price": float(decision_result.target_price) if decision_result.target_price else None,
                            "stop_loss_price": float(decision_result.stop_loss_price) if decision_result.stop_loss_price else None,
                            "model_votes": decision_result.model_votes
                        })
                        
            except Exception as e:
                logger.warning(f"为股票 {stock.symbol} 生成推荐失败: {str(e)}")
                continue
        
        # 按置信度排序
        recommendations.sort(key=lambda x: x["confidence"], reverse=True)
        
        return APIResponse(
            data={
                "recommendations": recommendations[:request.limit],
                "total_generated": len(recommendations),
                "request": request.dict()
            },
            message="股票推荐生成成功",
            status="success"
        )
            
    except Exception as e:
        logger.error(f"生成股票推荐失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成股票推荐失败: {str(e)}")


@router.get("/recommendations/{symbol}", response_model=APIResponse)
async def get_stock_recommendation_detail(
    symbol: str,
    days: Optional[int] = Query(30, description="历史天数"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取特定股票的详细推荐信息"""
    try:
        logger.info(f"获取股票推荐详情: symbol={symbol}, days={days}")
        
        # 获取股票信息
        stock_result = await session.execute(
            select(Stock).where(Stock.symbol == symbol)
        )
        stock = stock_result.scalar_one_or_none()
        
        if not stock:
            raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
        
        # 获取历史决策
        cutoff_date = datetime.now().date() - timedelta(days=days)
        decisions_result = await session.execute(
            select(Decision)
            .where(and_(
                Decision.stock_id == stock.id,
                Decision.created_at >= cutoff_date
            ))
            .order_by(desc(Decision.created_at))
        )
        decisions = decisions_result.scalars().all()
        
        # 获取投票详情
        votes_result = await session.execute(
            select(VoteResult)
            .join(Decision, VoteResult.decision_id == Decision.id)
            .where(and_(
                Decision.stock_id == stock.id,
                Decision.created_at >= cutoff_date
            ))
            .order_by(desc(Decision.created_at))
        )
        votes = votes_result.scalars().all()
        
        # 格式化历史推荐
        decision_history = []
        for decision in decisions:
            decision_votes = [v for v in votes if v.decision_id == decision.id]
            
            # 格式化模型投票详情
            model_votes = []
            for vote in decision_votes:
                model_votes.append(ModelVoteDetail(
                    model_name=vote.model_name,
                    model_type="technical",  # 默认为技术模型
                    vote_type=vote.vote_type,
                    confidence=vote.confidence,
                    signal_strength=vote.signal_strength,
                    reasoning=vote.reasoning,
                    weight=Decimal('0.25')  # 默认权重
                ))
            
            # 将决策类型映射到推荐类型
            recommendation_type = decision.decision_type.value
            if decision.confidence >= 0.8:
                if decision.decision_type.value == "buy":
                    recommendation_type = "strong_buy"
                elif decision.decision_type.value == "sell":
                    recommendation_type = "strong_sell"
            
            decision_history.append(RecommendationHistory(
                recommendation_type=recommendation_type,
                confidence=decision.confidence,
                signal_strength=decision.signal_strength,
                reasoning=decision.reasoning,
                created_at=decision.created_at,
                model_votes=model_votes
            ))
        
        # 获取最新推荐
        latest_decision = decisions[0] if decisions else None
        
        if latest_decision:
            # 获取最新投票详情
            latest_votes = [v for v in votes if v.decision_id == latest_decision.id]
            latest_model_votes = []
            for vote in latest_votes:
                latest_model_votes.append(ModelVoteDetail(
                    model_name=vote.model_name,
                    model_type="technical",  # 默认为技术模型
                    vote_type=vote.vote_type,
                    confidence=vote.confidence,
                    signal_strength=vote.signal_strength,
                    reasoning=vote.reasoning,
                    weight=Decimal('0.25')  # 默认权重
                ))
            
            # 将决策类型映射到推荐类型
            recommendation_type = latest_decision.decision_type.value
            if latest_decision.confidence >= 0.8:
                if latest_decision.decision_type.value == "buy":
                    recommendation_type = "strong_buy"
                elif latest_decision.decision_type.value == "sell":
                    recommendation_type = "strong_sell"
            
            recommendation_detail = RecommendationDetailResponse(
                id=latest_decision.id,
                symbol=stock.symbol,
                name=stock.name,
                recommendation_type=recommendation_type,
                confidence=latest_decision.confidence,
                signal_strength=latest_decision.signal_strength,
                target_price=latest_decision.target_price,
                stop_loss_price=latest_decision.stop_loss_price,
                reasoning=latest_decision.reasoning,
                priority="high" if latest_decision.confidence >= 0.8 else "medium",
                time_horizon=latest_decision.time_horizon,
                expected_return=None,  # 需要计算
                status="active",
                model_votes=latest_model_votes,
                sector=stock.sector,
                market_cap=stock.market_cap,
                current_price=stock.current_price,
                price_change_percent=stock.price_change_percent,
                created_at=latest_decision.created_at,
                updated_at=latest_decision.created_at,
                expires_at=latest_decision.expires_at
            )
        else:
            recommendation_detail = None
        
        return APIResponse(
            data={
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "sector": stock.sector,
                    "market_cap": float(stock.market_cap) if stock.market_cap else None
                },
                "latest_recommendation": recommendation_detail.model_dump() if recommendation_detail else None,
                "decision_history": [history.model_dump() for history in decision_history],
                "analysis_period_days": days
            },
            message="股票推荐详情获取成功",
            status="success"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取股票推荐详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取股票推荐详情失败: {str(e)}")