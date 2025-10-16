"""
决策引擎API
"""

from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
import pandas as pd

from src.config.database import get_db_session
from src.models.stock_models import (
    DecisionRequest, BatchDecisionRequest, FinalDecisionResponse,
    APIResponse, PaginatedResponse
)
from src.models.database import Stock, StockDailyData, BacktestModel, ModelDecision, FinalDecision
from src.services.stock_service import StockService, get_stock_service
from src.decision_engine.manager import decision_engine_manager

router = APIRouter()


@router.post("/decisions/generate", response_model=APIResponse)
async def generate_decision(
    decision_request: DecisionRequest
):
    """生成交易决策"""
    async with get_db_session() as session:
        symbol = decision_request.symbol
        trade_date = decision_request.trade_date
        
        # 获取股票服务实例
        stock_service = StockService(session)
        
        try:
            # 获取股票数据
            end_date = trade_date
            start_date = end_date - pd.Timedelta(days=60)  # 获取最近60天的数据
            stock_data = await stock_service.get_stock_data(symbol, start_date, end_date)
            
            if stock_data.empty:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 在指定日期范围内没有数据")
            
            # 使用决策引擎生成决策
            decision_result = await decision_engine_manager.generate_decision(decision_request, stock_data)
            
            if "error" in decision_result:
                raise HTTPException(status_code=500, detail=decision_result["error"])
            
            # 获取股票信息
            stock = await stock_service.get_stock_by_symbol(symbol)
            if not stock:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
            
            # 保存决策结果到数据库
            final_decision_record = FinalDecision(
                stock_id=stock.id,
                trade_date=trade_date,
                buy_votes=decision_result["final_decision"]["vote_summary"].get("BUY", 0),
                sell_votes=decision_result["final_decision"]["vote_summary"].get("SELL", 0),
                hold_votes=decision_result["final_decision"]["vote_summary"].get("HOLD", 0),
                final_decision=decision_result["final_decision"]["decision"],
                confidence_score=decision_result["final_decision"]["confidence"]
            )
            
            session.add(final_decision_record)
            await session.commit()
            await session.refresh(final_decision_record)
            
            # 保存模型决策详情
            for model_detail in decision_result["final_decision"]["model_details"]:
                model_decision = ModelDecision(
                    stock_id=final_decision_record.stock_id,
                    model_id=model_detail["model_id"],
                    trade_date=trade_date,
                    decision=model_detail["decision"],
                    confidence=model_detail["confidence"],
                    signal_strength=model_detail["signal_strength"]
                )
                session.add(model_decision)
            
            await session.commit()
            
            return APIResponse(
                data=decision_result,
                message="决策生成成功",
                status="success"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            # 记录详细错误信息
            print(f"POST /decisions/generate 错误: {str(e)}")
            import traceback
            print(f"错误堆栈: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"决策生成失败: {str(e)}")


@router.post("/decisions/batch", response_model=APIResponse)
async def generate_batch_decisions(
    batch_request: BatchDecisionRequest
):
    """批量生成决策"""
    async with get_db_session() as session:
        symbols = batch_request.symbols
        trade_date = batch_request.trade_date
        
        # 获取股票服务实例
        stock_service = StockService(session)
        
        batch_results = []
        successful_count = 0
        
        for symbol in symbols:
            try:
                # 获取股票数据
                end_date = trade_date
                start_date = end_date - pd.Timedelta(days=60)  # 获取最近60天的数据
                stock_data = await stock_service.get_stock_data(symbol, start_date, end_date)
                
                if stock_data.empty:
                    batch_results.append({
                        "symbol": symbol,
                        "error": f"股票 {symbol} 在指定日期范围内没有数据",
                        "final_decision": None,
                        "risk_assessment": None
                    })
                    continue
                
                # 创建决策请求
                decision_request = DecisionRequest(
                    symbol=symbol,
                    trade_date=trade_date,
                    current_position=0.0  # 假设初始仓位为0
                )
                
                # 使用决策引擎生成决策
                decision_result = await decision_engine_manager.generate_decision(decision_request, stock_data)
                
                if "error" in decision_result:
                    batch_results.append({
                        "symbol": symbol,
                        "error": decision_result["error"],
                        "final_decision": None,
                        "risk_assessment": None
                    })
                    continue
                
                # 获取股票信息
                stock = await stock_service.get_stock_by_symbol(symbol)
                if not stock:
                    batch_results.append({
                        "symbol": symbol,
                        "error": f"股票 {symbol} 不存在",
                        "final_decision": None,
                        "risk_assessment": None
                    })
                    continue
                
                # 保存决策结果到数据库
                final_decision_record = FinalDecision(
                    stock_id=stock.id,
                    trade_date=trade_date,
                    buy_votes=decision_result["final_decision"]["vote_summary"].get("BUY", 0),
                    sell_votes=decision_result["final_decision"]["vote_summary"].get("SELL", 0),
                    hold_votes=decision_result["final_decision"]["vote_summary"].get("HOLD", 0),
                    final_decision=decision_result["final_decision"]["decision"],
                    confidence_score=decision_result["final_decision"]["confidence"]
                )
                
                session.add(final_decision_record)
                await session.commit()
                await session.refresh(final_decision_record)
                
                # 保存模型决策详情
                for model_detail in decision_result["final_decision"]["model_details"]:
                    model_decision = ModelDecision(
                        stock_id=final_decision_record.stock_id,
                        model_id=model_detail["model_id"],
                        trade_date=trade_date,
                        decision=model_detail["decision"],
                        confidence=model_detail["confidence"],
                        signal_strength=model_detail["signal_strength"]
                    )
                    session.add(model_decision)
                
                await session.commit()
                
                batch_results.append(decision_result)
                successful_count += 1
                
            except Exception as e:
                await session.rollback()
                batch_results.append({
                    "symbol": symbol,
                    "error": f"决策生成失败: {str(e)}",
                    "final_decision": None,
                    "risk_assessment": None
                })
        
        return APIResponse(
            data={
                "batch_results": batch_results,
                "total_count": len(symbols),
                "success_count": successful_count,
                "timestamp": trade_date
            },
            message=f"批量决策生成完成，成功 {successful_count}/{len(symbols)}",
            status="success"
        )


@router.get("/decisions/history/{symbol}", response_model=APIResponse)
async def get_decision_history(
    symbol: str,
    start_date: date,
    end_date: date
):
    """获取决策历史"""
    async with get_db_session() as session:
        try:
            # 查询股票信息
            stock_service = StockService(session)
            stock = await stock_service.get_stock_by_symbol(symbol)
            if not stock:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 不存在")
            
            # 查询决策历史
            result = await session.execute(
                select(FinalDecision)
                .where(
                    and_(
                        FinalDecision.stock_id == stock.id,
                        FinalDecision.trade_date >= start_date,
                        FinalDecision.trade_date <= end_date
                    )
                )
                .order_by(desc(FinalDecision.trade_date))
            )
            decisions = result.scalars().all()
            
            # 构建历史数据
            history_data = []
            for decision in decisions:
                history_data.append({
                    "trade_date": decision.trade_date.isoformat(),
                    "final_decision": decision.final_decision,
                    "confidence_score": float(decision.confidence_score) if decision.confidence_score else 0.0,
                    "vote_summary": {
                        "BUY": decision.buy_votes or 0,
                        "SELL": decision.sell_votes or 0,
                        "HOLD": decision.hold_votes or 0
                    }
                })
            
            return APIResponse(
                data={
                    "symbol": symbol,
                    "history": history_data,
                    "metadata": {
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "record_count": len(history_data)
                    }
                },
                message="获取决策历史成功",
                status="success"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取决策历史失败: {str(e)}")


@router.get("/decisions/{decision_id}", response_model=APIResponse)
async def get_decision_detail(
    decision_id: int
):
    """获取决策详情"""
    async with get_db_session() as session:
        try:
            # 查询最终决策信息
            final_decision_result = await session.execute(
                select(FinalDecision, Stock)
                .join(Stock, FinalDecision.stock_id == Stock.id)
                .where(FinalDecision.id == decision_id)
            )
            final_decision_data = final_decision_result.first()
            
            if not final_decision_data:
                raise HTTPException(status_code=404, detail=f"决策 {decision_id} 不存在")
            
            final_decision, stock = final_decision_data
            
            # 查询模型决策详情
            model_decisions_result = await session.execute(
                select(ModelDecision, BacktestModel)
                .join(BacktestModel, ModelDecision.model_id == BacktestModel.id)
                .where(ModelDecision.stock_id == final_decision.stock_id)
                .where(ModelDecision.trade_date == final_decision.trade_date)
            )
            model_decisions = model_decisions_result.all()
            
            # 构建模型详情
            model_details = []
            for model_decision, backtest_model in model_decisions:
                model_details.append({
                    "model_id": backtest_model.id,
                    "model_name": backtest_model.name,
                    "decision": model_decision.decision,
                    "confidence": float(model_decision.confidence) if model_decision.confidence else 0.0,
                    "signal_strength": float(model_decision.signal_strength) if model_decision.signal_strength else 0.0,
                    "reasoning": model_decision.reasoning or "无理由说明"
                })
            
            # 计算投票统计
            vote_summary = {
                "BUY": final_decision.buy_votes or 0,
                "SELL": final_decision.sell_votes or 0,
                "HOLD": final_decision.hold_votes or 0
            }
            
            # 构建决策详情响应
            decision_detail = {
                "id": final_decision.id,
                "symbol": stock.symbol,
                "trade_date": final_decision.trade_date.isoformat(),
                "final_decision": {
                    "decision": final_decision.final_decision or "HOLD",
                    "confidence": float(final_decision.confidence_score) if final_decision.confidence_score else 0.0,
                    "vote_summary": vote_summary,
                    "model_details": model_details,
                    "risk_level": final_decision.risk_level or "MEDIUM",
                    "reasoning": f"加权投票结果: {vote_summary}"
                },
                "risk_assessment": {
                    "is_approved": True,  # 需要根据实际风险控制逻辑计算
                    "risk_level": final_decision.risk_level or "MEDIUM",
                    "warnings": ["风险控制模块待实现"],  # 需要根据实际风险控制逻辑生成
                    "adjusted_decision": final_decision.final_decision or "HOLD",
                    "position_suggestion": 0.5  # 需要根据实际风险控制逻辑计算
                },
                "created_at": final_decision.created_at.isoformat()
            }
            
            return APIResponse(
                data=decision_detail,
                message="获取决策详情成功",
                status="success"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取决策详情失败: {str(e)}")


@router.get("/decisions", response_model=APIResponse)
async def get_decisions(
    symbol: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    decision_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """获取决策列表"""
    async with get_db_session() as session:
        try:
            # 构建查询条件
            query = select(FinalDecision, Stock).join(Stock, FinalDecision.stock_id == Stock.id)
            conditions = []
            
            if symbol:
                conditions.append(Stock.symbol == symbol)
            
            if start_date:
                conditions.append(FinalDecision.trade_date >= start_date)
            
            if end_date:
                conditions.append(FinalDecision.trade_date <= end_date)
            
            if decision_type:
                conditions.append(FinalDecision.final_decision == decision_type)
            
            if conditions:
                query = query.where(and_(*conditions))
            
            # 计算总数
            count_query = select(FinalDecision.id).select_from(FinalDecision).join(Stock)
            if conditions:
                count_query = count_query.where(and_(*conditions))
            
            total_result = await session.execute(count_query)
            total_count = len(total_result.scalars().all())
            
            # 获取分页数据
            query = query.order_by(desc(FinalDecision.trade_date), desc(FinalDecision.id)).offset(skip).limit(limit)
            result = await session.execute(query)
            decisions = result.all()
            
            # 构建决策列表
            decisions_list = []
            for final_decision, stock in decisions:
                decisions_list.append({
                    "id": final_decision.id,
                    "symbol": stock.symbol,
                    "trade_date": final_decision.trade_date.isoformat(),
                    "final_decision": final_decision.final_decision,
                    "confidence_score": float(final_decision.confidence_score) if final_decision.confidence_score else 0.0,
                    "vote_summary": {
                        "BUY": final_decision.buy_votes or 0,
                        "SELL": final_decision.sell_votes or 0,
                        "HOLD": final_decision.hold_votes or 0
                    }
                })
            
            return APIResponse(
                data=PaginatedResponse(
                    data=decisions_list,
                    total=total_count,
                    skip=skip,
                    limit=limit
                ),
                message="获取决策列表成功",
                status="success"
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取决策列表失败: {str(e)}")