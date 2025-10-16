"""
决策引擎API
"""

from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db_session
from models.stock_models import (
    DecisionRequest, BatchDecisionRequest, FinalDecisionResponse,
    APIResponse, PaginatedResponse
)

router = APIRouter()


@router.post("/decisions/generate", response_model=APIResponse)
async def generate_decision(
    decision_request: DecisionRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """生成交易决策"""
    
    # 这里应该调用决策引擎服务
    # 暂时返回模拟响应
    
    symbol = decision_request.symbol
    trade_date = decision_request.trade_date
    
    # 模拟决策结果
    final_decision = {
        "decision": "BUY",
        "confidence": 0.78,
        "vote_summary": {
            "BUY": 6,
            "SELL": 2,
            "HOLD": 2
        },
        "model_details": [
            {
                "model_id": 1,
                "decision": "BUY",
                "confidence": 0.85,
                "signal_strength": 0.8,
                "reasoning": "移动平均线金叉"
            },
            {
                "model_id": 2,
                "decision": "BUY",
                "confidence": 0.75,
                "signal_strength": 0.7,
                "reasoning": "RSI超卖"
            }
        ],
        "risk_level": "MEDIUM",
        "reasoning": "加权投票通过: 78.0%"
    }
    
    # 模拟风险评估
    risk_assessment = {
        "is_approved": True,
        "risk_level": "MEDIUM",
        "warnings": ["高波动率风险"],
        "adjusted_decision": "BUY",
        "position_suggestion": 0.5
    }
    
    # 模拟模型结果
    model_results = {
        "total_models": 10,
        "active_models": 8,
        "successful_models": 8,
        "failed_models": 0
    }
    
    return APIResponse(
        data={
            "symbol": symbol,
            "final_decision": final_decision,
            "risk_assessment": risk_assessment,
            "model_results": model_results,
            "timestamp": trade_date
        },
        message="决策生成成功",
        status="success"
    )


@router.post("/decisions/batch", response_model=APIResponse)
async def generate_batch_decisions(
    batch_request: BatchDecisionRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """批量生成决策"""
    
    symbols = batch_request.symbols
    trade_date = batch_request.trade_date
    
    # 这里应该调用批量决策服务
    # 暂时返回模拟响应
    
    batch_results = []
    
    for symbol in symbols:
        # 模拟单个决策结果
        final_decision = {
            "decision": "BUY" if symbol.endswith("1") else "HOLD",
            "confidence": 0.78 if symbol.endswith("1") else 0.45,
            "vote_summary": {
                "BUY": 6 if symbol.endswith("1") else 3,
                "SELL": 2 if symbol.endswith("1") else 3,
                "HOLD": 2 if symbol.endswith("1") else 4
            },
            "risk_level": "MEDIUM" if symbol.endswith("1") else "LOW"
        }
        
        risk_assessment = {
            "is_approved": True,
            "risk_level": "MEDIUM" if symbol.endswith("1") else "LOW",
            "warnings": ["高波动率风险"] if symbol.endswith("1") else [],
            "adjusted_decision": "BUY" if symbol.endswith("1") else "HOLD",
            "position_suggestion": 0.5 if symbol.endswith("1") else 0.2
        }
        
        batch_results.append({
            "symbol": symbol,
            "final_decision": final_decision,
            "risk_assessment": risk_assessment
        })
    
    return APIResponse(
        data={
            "batch_results": batch_results,
            "total_count": len(symbols),
            "success_count": len(symbols),
            "timestamp": trade_date
        },
        message="批量决策生成完成",
        status="success"
    )


@router.get("/decisions/history/{symbol}", response_model=APIResponse)
async def get_decision_history(
    symbol: str,
    start_date: date,
    end_date: date,
    session: AsyncSession = Depends(get_db_session)
):
    """获取决策历史"""
    
    # 这里应该查询数据库中的决策历史
    # 暂时返回模拟响应
    
    # 模拟历史数据
    history_data = [
        {
            "trade_date": "2025-10-15",
            "final_decision": "HOLD",
            "confidence_score": 0.45,
            "vote_summary": {
                "BUY": 3,
                "SELL": 3,
                "HOLD": 4
            }
        },
        {
            "trade_date": "2025-10-14",
            "final_decision": "BUY",
            "confidence_score": 0.72,
            "vote_summary": {
                "BUY": 5,
                "SELL": 2,
                "HOLD": 3
            }
        },
        {
            "trade_date": "2025-10-13",
            "final_decision": "SELL",
            "confidence_score": 0.68,
            "vote_summary": {
                "BUY": 2,
                "SELL": 6,
                "HOLD": 2
            }
        }
    ]
    
    return APIResponse(
        data={
            "symbol": symbol,
            "history": history_data,
            "metadata": {
                "start_date": start_date,
                "end_date": end_date,
                "record_count": len(history_data)
            }
        },
        message="获取决策历史成功",
        status="success"
    )


@router.get("/decisions/{decision_id}", response_model=APIResponse)
async def get_decision_detail(
    decision_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """获取决策详情"""
    
    # 这里应该查询数据库中的决策详情
    # 暂时返回模拟响应
    
    if decision_id <= 0:
        raise HTTPException(status_code=404, detail=f"决策 {decision_id} 不存在")
    
    # 模拟决策详情
    decision_detail = {
        "id": decision_id,
        "symbol": "000001",
        "trade_date": "2025-10-16",
        "final_decision": {
            "decision": "BUY",
            "confidence": 0.78,
            "vote_summary": {
                "BUY": 6,
                "SELL": 2,
                "HOLD": 2
            },
            "model_details": [
                {
                    "model_id": 1,
                    "model_name": "移动平均线交叉模型",
                    "decision": "BUY",
                    "confidence": 0.85,
                    "signal_strength": 0.8,
                    "reasoning": "移动平均线金叉"
                },
                {
                    "model_id": 2,
                    "model_name": "RSI模型",
                    "decision": "BUY",
                    "confidence": 0.75,
                    "signal_strength": 0.7,
                    "reasoning": "RSI超卖"
                },
                {
                    "model_id": 3,
                    "model_name": "MACD模型",
                    "decision": "SELL",
                    "confidence": 0.65,
                    "signal_strength": 0.6,
                    "reasoning": "MACD死叉"
                }
            ],
            "risk_level": "MEDIUM",
            "reasoning": "加权投票通过: 78.0%"
        },
        "risk_assessment": {
            "is_approved": True,
            "risk_level": "MEDIUM",
            "warnings": ["高波动率风险"],
            "adjusted_decision": "BUY",
            "position_suggestion": 0.5
        },
        "created_at": "2025-10-16T09:30:00Z"
    }
    
    return APIResponse(
        data=decision_detail,
        message="获取决策详情成功",
        status="success"
    )


@router.get("/decisions", response_model=APIResponse)
async def get_decisions(
    symbol: str = None,
    start_date: date = None,
    end_date: date = None,
    decision_type: str = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db_session)
):
    """获取决策列表"""
    
    # 这里应该查询数据库中的决策列表
    # 暂时返回模拟响应
    
    # 模拟决策列表
    decisions_list = [
        {
            "id": i + 1,
            "symbol": f"00000{i+1}",
            "trade_date": f"2025-10-{16-i}",
            "final_decision": "BUY" if i % 3 == 0 else "SELL" if i % 3 == 1 else "HOLD",
            "confidence_score": 0.78 if i % 3 == 0 else 0.65 if i % 3 == 1 else 0.45,
            "vote_summary": {
                "BUY": 6 if i % 3 == 0 else 2 if i % 3 == 1 else 3,
                "SELL": 2 if i % 3 == 0 else 6 if i % 3 == 1 else 3,
                "HOLD": 2 if i % 3 == 0 else 2 if i % 3 == 1 else 4
            }
        }
        for i in range(min(limit, 10))
    ]
    
    # 应用过滤条件
    filtered_decisions = decisions_list
    
    if symbol:
        filtered_decisions = [d for d in filtered_decisions if d["symbol"] == symbol]
    
    if decision_type:
        filtered_decisions = [d for d in filtered_decisions if d["final_decision"] == decision_type]
    
    return APIResponse(
        data=PaginatedResponse(
            data=filtered_decisions[skip:skip+limit],
            total=len(filtered_decisions),
            skip=skip,
            limit=limit
        ),
        message="获取决策列表成功",
        status="success"
    )