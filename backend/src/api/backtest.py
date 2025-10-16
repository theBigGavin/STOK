"""
回测分析API
"""

from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db_session
from models.stock_models import (
    BacktestRequest, PortfolioBacktestRequest, APIResponse
)

router = APIRouter()


@router.post("/backtest/model", response_model=APIResponse)
async def run_model_backtest(
    backtest_request: BacktestRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """运行模型回测"""
    
    symbol = backtest_request.symbol
    start_date = backtest_request.start_date
    end_date = backtest_request.end_date
    initial_capital = backtest_request.initial_capital
    
    # 这里应该调用回测服务
    # 暂时返回模拟响应
    
    return APIResponse(
        data={
            "symbol": symbol,
            "backtest_result": {
                "total_return": 0.156,
                "annual_return": 0.234,
                "volatility": 0.245,
                "sharpe_ratio": 0.956,
                "max_drawdown": 0.124,
                "win_rate": 0.65,
                "profit_factor": 1.45,
                "total_trades": 45,
                "winning_trades": 29,
                "losing_trades": 16,
                "avg_profit_per_trade": 0.034,
                "avg_loss_per_trade": -0.021,
                "trades": [
                    {
                        "type": "BUY",
                        "date": "2025-03-15",
                        "price": 14.50,
                        "shares": 6896,
                        "value": 100000,
                        "reason": "移动平均线金叉"
                    },
                    {
                        "type": "SELL",
                        "date": "2025-04-20",
                        "price": 16.80,
                        "shares": 6896,
                        "value": 115852,
                        "reason": "达到目标价位"
                    }
                ],
                "equity_curve": [
                    {"date": "2025-01-01", "value": 100000},
                    {"date": "2025-02-01", "value": 102500},
                    {"date": "2025-03-01", "value": 98000},
                    {"date": "2025-04-01", "value": 105000},
                    {"date": "2025-05-01", "value": 115600}
                ],
                "signals": [
                    {"date": "2025-03-15", "signal": "BUY", "price": 14.50},
                    {"date": "2025-04-20", "signal": "SELL", "price": 16.80}
                ]
            },
            "parameters": {
                "symbol": symbol,
                "start_date": start_date,
                "end_date": end_date,
                "initial_capital": initial_capital
            }
        },
        message="回测完成",
        status="success"
    )


@router.post("/backtest/portfolio", response_model=APIResponse)
async def run_portfolio_backtest(
    portfolio_request: PortfolioBacktestRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """执行组合回测"""
    
    symbols = portfolio_request.symbols
    start_date = portfolio_request.start_date
    end_date = portfolio_request.end_date
    initial_capital = portfolio_request.initial_capital
    rebalance_frequency = portfolio_request.rebalance_frequency
    
    # 这里应该调用组合回测服务
    # 暂时返回模拟响应
    
    return APIResponse(
        data={
            "portfolio_result": {
                "total_return": 0.189,
                "annual_return": 0.267,
                "volatility": 0.198,
                "sharpe_ratio": 1.348,
                "max_drawdown": 0.089,
                "win_rate": 0.72,
                "profit_factor": 1.67,
                "portfolio_weights": {
                    symbol: 1.0 / len(symbols) for symbol in symbols
                },
                "individual_returns": {
                    symbol: 0.156 + i * 0.02 for i, symbol in enumerate(symbols)
                },
                "correlation_matrix": {
                    symbol1: {
                        symbol2: 0.8 if symbol1 == symbol2 else 0.3 
                        for symbol2 in symbols
                    } for symbol1 in symbols
                },
                "rebalance_dates": [
                    "2025-02-01", "2025-03-01", "2025-04-01", "2025-05-01"
                ],
                "equity_curve": [
                    {"date": "2025-01-01", "value": 100000},
                    {"date": "2025-02-01", "value": 105000},
                    {"date": "2025-03-01", "value": 102000},
                    {"date": "2025-04-01", "value": 108000},
                    {"date": "2025-05-01", "value": 118900}
                ]
            },
            "parameters": {
                "symbols": symbols,
                "start_date": start_date,
                "end_date": end_date,
                "initial_capital": initial_capital,
                "rebalance_frequency": rebalance_frequency
            }
        },
        message="组合回测完成",
        status="success"
    )


@router.post("/backtest/compare", response_model=APIResponse)
async def compare_backtest_results(
    backtest_requests: List[BacktestRequest],
    session: AsyncSession = Depends(get_db_session)
):
    """比较多个回测结果"""
    
    if not backtest_requests:
        raise HTTPException(status_code=400, detail="至少需要一个回测请求")
    
    # 这里应该调用比较回测服务
    # 暂时返回模拟响应
    
    comparison_results = []
    
    for i, request in enumerate(backtest_requests):
        comparison_results.append({
            "symbol": request.symbol,
            "model_id": request.model_ids[0] if request.model_ids else i + 1,
            "results": {
                "total_return": 0.156 + i * 0.02,
                "annual_return": 0.234 + i * 0.03,
                "volatility": 0.245 - i * 0.02,
                "sharpe_ratio": 0.956 + i * 0.1,
                "max_drawdown": 0.124 - i * 0.01,
                "win_rate": 0.65 + i * 0.05
            }
        })
    
    return APIResponse(
        data={
            "comparison": comparison_results,
            "summary": {
                "best_performer": comparison_results[0]["symbol"],
                "worst_performer": comparison_results[-1]["symbol"],
                "avg_return": sum(r["results"]["total_return"] for r in comparison_results) / len(comparison_results),
                "avg_sharpe": sum(r["results"]["sharpe_ratio"] for r in comparison_results) / len(comparison_results)
            }
        },
        message="回测比较完成",
        status="success"
    )


@router.get("/backtest/results/{result_id}", response_model=APIResponse)
async def get_backtest_result(
    result_id: int,
    session: AsyncSession = Depends(get_db_session)
):
    """获取回测结果详情"""
    
    # 这里应该查询数据库中的回测结果
    # 暂时返回模拟响应
    
    if result_id <= 0:
        raise HTTPException(status_code=404, detail=f"回测结果 {result_id} 不存在")
    
    return APIResponse(
        data={
            "id": result_id,
            "symbol": "000001",
            "model_id": 1,
            "start_date": "2025-01-01",
            "end_date": "2025-10-16",
            "initial_capital": 100000,
            "results": {
                "total_return": 0.156,
                "annual_return": 0.234,
                "volatility": 0.245,
                "sharpe_ratio": 0.956,
                "max_drawdown": 0.124,
                "win_rate": 0.65,
                "profit_factor": 1.45,
                "total_trades": 45,
                "winning_trades": 29,
                "losing_trades": 16
            },
            "trades": [
                {
                    "id": i + 1,
                    "type": "BUY" if i % 2 == 0 else "SELL",
                    "date": f"2025-0{3 + i//10}-{15 + i%10}",
                    "price": 14.50 + i * 0.5,
                    "shares": 6896 - i * 100,
                    "value": 100000 + i * 5000,
                    "profit": 5000 if i % 2 == 1 else 0,
                    "reason": "技术指标信号"
                }
                for i in range(10)
            ],
            "created_at": "2025-10-16T10:00:00Z"
        },
        message="获取回测结果详情成功",
        status="success"
    )


@router.get("/backtest/results", response_model=APIResponse)
async def get_backtest_results(
    symbol: str = None,
    model_id: int = None,
    start_date: date = None,
    end_date: date = None,
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db_session)
):
    """获取回测结果列表"""
    
    # 这里应该查询数据库中的回测结果列表
    # 暂时返回模拟响应
    
    # 模拟回测结果列表
    results_list = [
        {
            "id": i + 1,
            "symbol": f"00000{i+1}",
            "model_id": (i % 3) + 1,
            "model_name": ["移动平均线交叉模型", "RSI模型", "MACD模型"][i % 3],
            "start_date": "2025-01-01",
            "end_date": "2025-10-16",
            "total_return": 0.156 + i * 0.02,
            "sharpe_ratio": 0.956 + i * 0.1,
            "max_drawdown": 0.124 - i * 0.01,
            "created_at": f"2025-10-{16-i}T10:00:00Z"
        }
        for i in range(min(limit, 10))
    ]
    
    # 应用过滤条件
    filtered_results = results_list
    
    if symbol:
        filtered_results = [r for r in filtered_results if r["symbol"] == symbol]
    
    if model_id:
        filtered_results = [r for r in filtered_results if r["model_id"] == model_id]
    
    return APIResponse(
        data={
            "results": filtered_results[skip:skip+limit],
            "total": len(filtered_results),
            "skip": skip,
            "limit": limit
        },
        message="获取回测结果列表成功",
        status="success"
    )