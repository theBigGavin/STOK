"""
决策引擎API - 根据数据模型文档更新
"""

import logging
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from src.config.database import get_db_session
from src.models.stock_models import (
    APIResponse, PaginatedResponse, RecommendationRequest, DecisionType
)
from src.models.database import Stock, Decision, VoteResult, AIModel
from src.services.stock_service import StockService, get_stock_service
from src.decision_engine.manager import DecisionEngineManager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/decisions/stats", response_model=APIResponse)
async def get_decision_stats(
    symbol: Optional[str] = Query(None, description="股票代码"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期")
):
    """获取决策统计信息（前端兼容版本）"""
    try:
        logger.info(f"获取决策统计请求: symbol={symbol}, start_date={start_date}, end_date={end_date}")
        
        async with get_db_session() as session:
            # 构建查询条件
            query = select(Decision.decision_type, Decision.confidence)
            
            # 如果有股票代码过滤
            if symbol:
                stock_result = await session.execute(
                    select(Stock).where(Stock.symbol == symbol)
                )
                stock = stock_result.scalar_one_or_none()
                if stock:
                    query = query.where(Decision.stock_id == stock.id)
                else:
                    # 如果股票不存在，返回空统计
                    return APIResponse(
                        data={
                            "totalDecisions": 0,
                            "buyCount": 0,
                            "sellCount": 0,
                            "holdCount": 0,
                            "avgConfidence": 0
                        },
                        message="决策统计获取成功",
                        status="success"
                    )
            
            # 日期范围过滤
            if start_date:
                query = query.where(Decision.generated_at >= start_date)
            if end_date:
                query = query.where(Decision.generated_at <= end_date)
            
            # 执行查询
            decision_stats_result = await session.execute(query)
            decision_stats_data = decision_stats_result.all()
            
            # 计算决策统计
            total_decisions = len(decision_stats_data)
            if total_decisions > 0:
                buy_count = len([d for d in decision_stats_data if d[0] == DecisionType.BUY])
                sell_count = len([d for d in decision_stats_data if d[0] == DecisionType.SELL])
                hold_count = len([d for d in decision_stats_data if d[0] == DecisionType.HOLD])
                avg_confidence = sum(float(d[1]) for d in decision_stats_data if d[1]) / total_decisions
            else:
                buy_count = 0
                sell_count = 0
                hold_count = 0
                avg_confidence = 0
            
            # 返回前端期望的格式
            stats_data = {
                "totalDecisions": total_decisions,
                "buyCount": buy_count,
                "sellCount": sell_count,
                "holdCount": hold_count,
                "avgConfidence": round(avg_confidence, 4)
            }
            
            logger.info(f"决策统计: {stats_data}")
            
            return APIResponse(
                data=stats_data,
                message="决策统计获取成功",
                status="success"
            )
        
    except Exception as e:
        logger.error(f"获取决策统计失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取决策统计失败: {str(e)}")


@router.get("/decisions", response_model=APIResponse)
async def get_decisions_summary(
    session: AsyncSession = Depends(get_db_session)
):
    """获取决策引擎摘要信息"""
    try:
        # 使用异步上下文管理器正确获取会话
        async with get_db_session() as db_session:
            # 获取股票统计信息
            stock_count_result = await db_session.execute(select(Stock.id))
            total_stocks = len(stock_count_result.scalars().all())
            
            # 获取决策统计
            decision_stats_result = await db_session.execute(select(Decision))
            decisions = decision_stats_result.scalars().all()
            
            # 获取模型统计
            model_stats_result = await db_session.execute(select(AIModel))
            models = model_stats_result.scalars().all()
            
            summary = {
                "engine_status": "active",
                "total_stocks": total_stocks,
                "total_decisions": len(decisions),
                "total_models": len(models),
                "active_models": len([m for m in models if m.is_active]),
                "last_updated": datetime.now().isoformat()
            }
            
            return APIResponse(
                data=summary,
                message="决策引擎运行正常",
                status="success"
            )
        
    except Exception as e:
        logger.error(f"获取决策引擎摘要失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取决策引擎摘要失败: {str(e)}")


@router.get("/decisions/recommendations", response_model=APIResponse)
async def get_recommendations(
    limit: int = Query(10, ge=1, le=100, description="推荐数量限制"),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票推荐列表"""
    try:
        logger.info(f"获取推荐列表请求: limit={limit}, skip={skip}")
        
        # 参数验证
        if limit > 100:
            raise HTTPException(status_code=400, detail="推荐数量不能超过100")
        
        # 创建决策引擎管理器
        decision_manager = DecisionEngineManager(session)
        
        # 生成推荐
        recommendations = await decision_manager.generate_recommendations(limit=limit)
        
        # 格式化响应数据
        formatted_recommendations = []
        for rec in recommendations:
            stock = rec['stock']
            decision = rec['decision']
            
            formatted_recommendations.append({
                'stock': {
                    'id': str(stock.id),
                    'symbol': stock.symbol,
                    'name': stock.name,
                    'market': stock.market,
                    'current_price': float(stock.current_price) if stock.current_price else None,
                    'price_change_percent': float(stock.price_change_percent) if stock.price_change_percent else None,
                    'industry': stock.industry
                },
                'decision': {
                    'id': str(decision.id),
                    'decision_type': decision.decision_type,
                    'confidence': float(decision.confidence) if decision.confidence else 0.0,
                    'target_price': float(decision.target_price) if decision.target_price else None,
                    'stop_loss_price': float(decision.stop_loss_price) if decision.stop_loss_price else None,
                    'time_horizon': decision.time_horizon,
                    'reasoning': decision.reasoning,
                    'generated_at': decision.generated_at.isoformat() if decision.generated_at else None
                },
                'vote_summary': {
                    'total_votes': rec['total_votes'],
                    'buy_votes': rec['buy_votes'],
                    'sell_votes': rec['sell_votes'],
                    'hold_votes': rec['hold_votes'],
                    'avg_confidence': rec['avg_confidence']
                },
                'vote_details': [
                    {
                        'model_id': str(vote.model_id),
                        'vote_type': vote.vote_type,
                        'confidence': float(vote.confidence) if vote.confidence else 0.0,
                        'signal_strength': float(vote.signal_strength) if vote.signal_strength else 0.0,
                        'reasoning': vote.reasoning
                    }
                    for vote in rec['vote_results']
                ]
            })
        
        logger.info(f"成功获取 {len(formatted_recommendations)} 个推荐")
        
        return APIResponse(
            data=PaginatedResponse(
                data=formatted_recommendations,
                total=len(formatted_recommendations),
                skip=skip,
                limit=limit
            ),
            message="获取推荐列表成功",
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取推荐列表失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取推荐列表失败: {str(e)}")




@router.get("/decisions/stock/{stock_id}", response_model=APIResponse)
async def get_stock_decisions(
    stock_id: str,
    limit: int = Query(50, ge=1, le=100, description="决策数量限制"),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    session: AsyncSession = Depends(get_db_session)
):
    """获取股票的决策列表"""
    try:
        stock_service = StockService(session)
        
        # 获取股票信息
        stock = await stock_service.get_stock_by_id(stock_id)
        if not stock:
            raise HTTPException(status_code=404, detail=f"股票 {stock_id} 不存在")
        
        # 获取决策列表
        decisions = await stock_service.get_decisions_for_stock(stock_id, limit=limit, skip=skip)
        
        # 格式化响应数据
        formatted_decisions = []
        for decision in decisions:
            # 获取投票结果
            vote_results = await stock_service.get_vote_results_for_decision(decision.id)
            
            formatted_decisions.append({
                'id': str(decision.id),
                'decision_type': decision.decision_type,
                'confidence': float(decision.confidence) if decision.confidence else 0.0,
                'target_price': float(decision.target_price) if decision.target_price else None,
                'stop_loss_price': float(decision.stop_loss_price) if decision.stop_loss_price else None,
                'time_horizon': decision.time_horizon,
                'reasoning': decision.reasoning,
                'generated_at': decision.generated_at.isoformat() if decision.generated_at else None,
                'expires_at': decision.expires_at.isoformat() if decision.expires_at else None,
                'created_at': decision.created_at.isoformat() if decision.created_at else None,
                'vote_summary': {
                    'total_votes': len(vote_results),
                    'buy_votes': len([v for v in vote_results if v.vote_type == DecisionType.BUY]),
                    'sell_votes': len([v for v in vote_results if v.vote_type == DecisionType.SELL]),
                    'hold_votes': len([v for v in vote_results if v.vote_type == DecisionType.HOLD])
                }
            })
        
        return APIResponse(
            data=PaginatedResponse(
                data=formatted_decisions,
                total=len(formatted_decisions),
                skip=skip,
                limit=limit
            ),
            message="获取股票决策列表成功",
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取股票决策列表失败: {str(e)}")


@router.post("/decisions/refresh", response_model=APIResponse)
async def refresh_recommendations(
    session: AsyncSession = Depends(get_db_session)
):
    """刷新所有推荐（重新生成决策）"""
    try:
        logger.info("开始刷新推荐")
        
        # 创建决策引擎管理器
        decision_manager = DecisionEngineManager(session)
        
        # 刷新推荐
        generated_count = await decision_manager.refresh_recommendations()
        
        logger.info(f"成功刷新 {generated_count} 个决策")
        
        return APIResponse(
            data={
                'generated_count': generated_count,
                'timestamp': datetime.now().isoformat()
            },
            message=f"成功刷新 {generated_count} 个决策",
            status="success"
        )
        
    except Exception as e:
        logger.error(f"刷新推荐失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"刷新推荐失败: {str(e)}")


@router.get("/decisions/statistics", response_model=APIResponse)
async def get_decision_statistics(
    session: AsyncSession = Depends(get_db_session)
):
    """获取决策统计信息"""
    try:
        logger.info("获取决策统计信息")
        
        stock_service = StockService(session)
        
        # 获取股票统计信息
        stock_stats = await stock_service.get_stock_statistics()
        
        # 获取决策统计
        decision_stats_result = await session.execute(
            select(Decision.decision_type, Decision.confidence)
        )
        decision_stats_data = decision_stats_result.all()
        
        # 计算决策统计
        decision_stats = {
            'total_decisions': len(decision_stats_data),
            'buy_decisions': len([d for d in decision_stats_data if d[0] == DecisionType.BUY]),
            'sell_decisions': len([d for d in decision_stats_data if d[0] == DecisionType.SELL]),
            'hold_decisions': len([d for d in decision_stats_data if d[0] == DecisionType.HOLD]),
            'avg_confidence': sum(float(d[1]) for d in decision_stats_data if d[1]) / len(decision_stats_data) if decision_stats_data else 0
        }
        
        # 获取模型统计
        model_stats_result = await session.execute(
            select(AIModel)
        )
        
        logger.info(f"统计信息: {decision_stats['total_decisions']} 个决策, {stock_stats['total_stocks']} 个股票")
        model_stats_data = model_stats_result.scalars().all()
        
        model_stats = {
            'total_models': len(model_stats_data),
            'active_models': len([m for m in model_stats_data if m.is_active]),
            'model_types': {
                'technical': len([m for m in model_stats_data if m.model_type == 'technical']),
                'fundamental': len([m for m in model_stats_data if m.model_type == 'fundamental']),
                'machine_learning': len([m for m in model_stats_data if m.model_type == 'machine_learning'])
            }
        }
        
        return APIResponse(
            data={
                'stock_statistics': stock_stats,
                'decision_statistics': decision_stats,
                'model_statistics': model_stats,
                'timestamp': datetime.now().isoformat()
            },
            message="获取决策统计信息成功",
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取决策统计信息失败: {str(e)}")


@router.get("/decisions/search", response_model=APIResponse)
async def search_decisions(
    query: str = Query(..., description="搜索关键词（股票代码或名称）"),
    limit: int = Query(20, ge=1, le=100, description="搜索结果数量限制"),
    session: AsyncSession = Depends(get_db_session)
):
    """搜索决策"""
    try:
        stock_service = StockService(session)
        
        # 搜索股票
        stocks = await stock_service.search_stocks(query, limit=limit)
        
        # 获取每个股票的最新决策
        decisions_with_stocks = []
        for stock in stocks:
            latest_decision = await stock_service.get_latest_decision(stock.id)
            if latest_decision:
                decisions_with_stocks.append({
                    'stock': {
                        'id': str(stock.id),
                        'symbol': stock.symbol,
                        'name': stock.name,
                        'market': stock.market,
                        'current_price': float(stock.current_price) if stock.current_price else None
                    },
                    'decision': {
                        'id': str(latest_decision.id),
                        'decision_type': latest_decision.decision_type,
                        'confidence': float(latest_decision.confidence) if latest_decision.confidence else 0.0,
                        'generated_at': latest_decision.generated_at.isoformat() if latest_decision.generated_at else None
                    }
                })
        
        return APIResponse(
            data=PaginatedResponse(
                data=decisions_with_stocks,
                total=len(decisions_with_stocks),
                skip=0,
                limit=limit
            ),
            message="搜索决策成功",
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索决策失败: {str(e)}")


@router.get("/decisions/recent", response_model=APIResponse)
async def get_recent_decisions(
    limit: int = Query(10, ge=1, le=50, description="返回的决策数量"),
    skip: int = Query(0, ge=0, description="跳过记录数")
):
    """获取最近生成的决策列表"""
    try:
        logger.info(f"获取最近决策请求: limit={limit}, skip={skip}")
        
        async with get_db_session() as session:
            # 查询最近的决策，按生成时间倒序排列
            query = (
                select(Decision, Stock)
                .join(Stock, Decision.stock_id == Stock.id)
                .order_by(desc(Decision.generated_at))
                .limit(limit)
                .offset(skip)
            )
            
            result = await session.execute(query)
            decisions_with_stocks = result.all()
            
            # 格式化响应数据
            formatted_decisions = []
            for decision, stock in decisions_with_stocks:
                # 计算风险等级（基于置信度）
                confidence = float(decision.confidence) if decision.confidence else 0.0
                if confidence >= 80:
                    risk_level = "LOW"
                elif confidence >= 60:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "HIGH"
                
                formatted_decisions.append({
                    'symbol': stock.symbol,
                    'decision': decision.decision_type.value if hasattr(decision.decision_type, 'value') else decision.decision_type,
                    'confidence': confidence,
                    'timestamp': decision.generated_at.isoformat() if decision.generated_at else datetime.now().isoformat(),
                    'riskLevel': risk_level
                })
            
            logger.info(f"成功获取 {len(formatted_decisions)} 条最近决策")
            
            return APIResponse(
                data=formatted_decisions,
                message="获取最近决策列表成功",
                status="success"
            )
            
    except Exception as e:
        logger.error(f"获取最近决策列表失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取最近决策列表失败: {str(e)}")

