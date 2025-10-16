"""
决策引擎管理器
"""

from typing import Dict, List, Optional
from datetime import date
import pandas as pd

from backend.src.ml_models.base import ModelManager
from backend.src.ml_models.technical_models import MovingAverageCrossover, RSIModel, MACDModel
from backend.src.decision_engine.voting import DecisionEngine, RiskController, VotingConfig
from backend.src.models.stock_models import (
    DecisionRequest, FinalDecision, ModelSignal, DecisionType
)


class DecisionEngineManager:
    """决策引擎管理器"""

    def __init__(self, voting_config: Optional[VotingConfig] = None):
        self.model_manager = ModelManager()
        self.decision_engine = DecisionEngine(voting_config)
        self.risk_controller = RiskController()
        
        # 注册模型类型
        self._register_model_types()

    def _register_model_types(self):
        """注册模型类型"""
        self.model_manager.model_registry.update({
            'moving_average_crossover': MovingAverageCrossover,
            'rsi_model': RSIModel,
            'macd_model': MACDModel
        })

    async def generate_decision(self, decision_request: DecisionRequest, 
                              stock_data: pd.DataFrame) -> Dict:
        """生成交易决策"""
        
        # 获取所有活跃模型
        active_models = [
            model for model in self.model_manager.models.values() 
            if hasattr(model, 'is_active') and model.is_active
        ]
        
        if not active_models:
            return {
                "error": "没有活跃的模型",
                "final_decision": None,
                "risk_assessment": None
            }

        # 运行所有模型生成信号
        model_signals: Dict[int, ModelSignal] = {}
        
        for model in active_models:
            try:
                signal = model.generate_signal(stock_data)
                model_signals[model.model_id] = signal
            except Exception as e:
                # 记录错误但继续处理其他模型
                print(f"模型 {model.model_id} 生成信号失败: {e}")
                continue

        # 聚合决策
        final_decision = self.decision_engine.aggregate_decisions(model_signals)

        # 风险评估
        risk_assessment = self.risk_controller.assess_decision_risk(
            final_decision, 
            decision_request.symbol,
            decision_request.current_position
        )

        return {
            "symbol": decision_request.symbol,
            "final_decision": self._format_final_decision(final_decision),
            "risk_assessment": risk_assessment,
            "model_results": {
                "total_models": len(active_models),
                "successful_models": len(model_signals),
                "failed_models": len(active_models) - len(model_signals)
            },
            "timestamp": decision_request.trade_date
        }

    def _format_final_decision(self, final_decision) -> Dict:
        """格式化最终决策"""
        return {
            "decision": final_decision.decision.value,
            "confidence": final_decision.confidence,
            "vote_summary": {
                decision_type.value: count 
                for decision_type, count in final_decision.vote_summary.items()
            },
            "model_details": [
                {
                    "model_id": signal.model_id,
                    "decision": signal.decision.value,
                    "confidence": signal.confidence,
                    "signal_strength": signal.signal_strength,
                    "reasoning": signal.reasoning
                }
                for signal in final_decision.model_details
            ],
            "risk_level": final_decision.risk_level.value,
            "reasoning": final_decision.reasoning
        }

    async def generate_batch_decisions(self, symbols: List[str], trade_date: date,
                                     stock_data_dict: Dict[str, pd.DataFrame]) -> Dict:
        """批量生成决策"""
        batch_results = []
        
        for symbol in symbols:
            if symbol not in stock_data_dict:
                batch_results.append({
                    "symbol": symbol,
                    "error": "缺少股票数据",
                    "final_decision": None,
                    "risk_assessment": None
                })
                continue
            
            decision_request = DecisionRequest(
                symbol=symbol,
                trade_date=trade_date,
                current_position=0.0  # 假设初始仓位为0
            )
            
            try:
                result = await self.generate_decision(decision_request, stock_data_dict[symbol])
                batch_results.append(result)
            except Exception as e:
                batch_results.append({
                    "symbol": symbol,
                    "error": str(e),
                    "final_decision": None,
                    "risk_assessment": None
                })
        
        return {
            "batch_results": batch_results,
            "total_count": len(symbols),
            "success_count": len([r for r in batch_results if "error" not in r]),
            "timestamp": trade_date
        }

    def add_model(self, model_type: str, model_id: int, **kwargs) -> bool:
        """添加模型"""
        try:
            model = self.model_manager.register_model(model_id, model_type, **kwargs)
            return model is not None
        except Exception as e:
            print(f"添加模型失败: {e}")
            return False

    def remove_model(self, model_id: int):
        """移除模型"""
        self.model_manager.remove_model(model_id)

    def update_model_weights(self, weights: Dict[int, float]):
        """更新模型权重"""
        self.decision_engine.set_model_weights(weights)

    def get_model_info(self, model_id: int) -> Optional[Dict]:
        """获取模型信息"""
        model = self.model_manager.get_model(model_id)
        return model.get_info() if model else None

    def get_all_models_info(self) -> List[Dict]:
        """获取所有模型信息"""
        return self.model_manager.get_all_models_info()

    def update_voting_config(self, config: VotingConfig):
        """更新投票配置"""
        self.decision_engine.config = config

    def update_risk_config(self, max_daily_loss: float, max_position_size: float):
        """更新风险配置"""
        self.risk_controller.max_daily_loss = max_daily_loss
        self.risk_controller.max_position_size = max_position_size


# 全局决策引擎管理器实例
decision_engine_manager = DecisionEngineManager()