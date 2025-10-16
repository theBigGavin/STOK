"""
决策引擎 - 投票机制
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

from backend.src.models.stock_models import (
    DecisionType, VotingStrategy, ModelSignal, RiskLevel
)


@dataclass
class VotingConfig:
    """投票配置"""
    strategy: VotingStrategy = VotingStrategy.WEIGHTED
    threshold: float = 0.6  # 决策阈值
    min_confidence: float = 0.6  # 最小置信度
    enable_risk_control: bool = True


@dataclass
class FinalDecision:
    """最终决策结果"""
    decision: DecisionType
    confidence: float
    vote_summary: Dict[DecisionType, int]
    model_details: List[ModelSignal]
    risk_level: RiskLevel
    reasoning: str


class DecisionEngine:
    """决策引擎核心类"""

    def __init__(self, config: Optional[VotingConfig] = None):
        self.config = config or VotingConfig()
        self.model_weights: Dict[int, float] = {}

    def set_model_weights(self, weights: Dict[int, float]):
        """设置模型权重"""
        self.model_weights = weights

    def aggregate_decisions(self, model_decisions: Dict[int, ModelSignal]) -> FinalDecision:
        """聚合多个模型的决策"""
        if not model_decisions:
            return self._create_hold_decision("无模型决策")

        # 过滤无效决策
        valid_decisions = {
            model_id: signal for model_id, signal in model_decisions.items()
            if signal and signal.confidence >= self.config.min_confidence
        }

        if not valid_decisions:
            return self._create_hold_decision("无有效模型决策")

        # 统计投票
        vote_counts = self._count_votes(valid_decisions)

        # 根据策略计算最终决策
        if self.config.strategy == VotingStrategy.MAJORITY:
            return self._majority_voting(valid_decisions, vote_counts)
        elif self.config.strategy == VotingStrategy.WEIGHTED:
            return self._weighted_voting(valid_decisions, vote_counts)
        else:
            return self._confidence_weighted_voting(valid_decisions, vote_counts)

    def _count_votes(self, model_decisions: Dict[int, ModelSignal]) -> Dict[DecisionType, int]:
        """统计各决策类型的票数"""
        vote_counts = {decision_type: 0 for decision_type in DecisionType}
        
        for signal in model_decisions.values():
            if signal.decision in vote_counts:
                vote_counts[signal.decision] += 1
        
        return vote_counts

    def _majority_voting(self, model_decisions: Dict[int, ModelSignal],
                        vote_counts: Dict[DecisionType, int]) -> FinalDecision:
        """简单多数投票"""
        total_votes = sum(vote_counts.values())
        max_votes = 0
        winning_decision = DecisionType.HOLD

        for decision_type, count in vote_counts.items():
            if count > max_votes:
                max_votes = count
                winning_decision = decision_type

        vote_ratio = max_votes / total_votes

        if vote_ratio >= self.config.threshold:
            confidence = self._calculate_confidence(model_decisions, winning_decision)
            if confidence >= self.config.min_confidence:
                return FinalDecision(
                    decision=winning_decision,
                    confidence=confidence,
                    vote_summary=vote_counts,
                    model_details=list(model_decisions.values()),
                    risk_level=self._assess_risk_level(confidence, vote_ratio),
                    reasoning=f"多数投票通过: {vote_ratio:.1%}"
                )

        return self._create_hold_decision(f"投票未达阈值: {vote_ratio:.1%}")

    def _weighted_voting(self, model_decisions: Dict[int, ModelSignal],
                        vote_counts: Dict[DecisionType, int]) -> FinalDecision:
        """加权投票"""
        weighted_scores = {decision_type: 0.0 for decision_type in DecisionType}

        for model_id, signal in model_decisions.items():
            if signal and signal.decision:
                weight = self.model_weights.get(model_id, 1.0)  # 默认权重为1.0
                weighted_scores[signal.decision] += weight * signal.confidence

        max_score = 0.0
        winning_decision = DecisionType.HOLD

        for decision_type, score in weighted_scores.items():
            if score > max_score:
                max_score = score
                winning_decision = decision_type

        # 归一化得分
        total_weight = sum(self.model_weights.values()) or len(model_decisions)
        normalized_score = max_score / total_weight

        if normalized_score >= self.config.threshold:
            confidence = self._calculate_weighted_confidence(model_decisions, winning_decision)
            if confidence >= self.config.min_confidence:
                return FinalDecision(
                    decision=winning_decision,
                    confidence=confidence,
                    vote_summary=vote_counts,
                    model_details=list(model_decisions.values()),
                    risk_level=self._assess_risk_level(confidence, normalized_score),
                    reasoning=f"加权投票通过: {normalized_score:.1%}"
                )

        return self._create_hold_decision(f"加权投票未达阈值: {normalized_score:.1%}")

    def _confidence_weighted_voting(self, model_decisions: Dict[int, ModelSignal],
                                  vote_counts: Dict[DecisionType, int]) -> FinalDecision:
        """置信度加权投票"""
        confidence_scores = {decision_type: 0.0 for decision_type in DecisionType}

        for signal in model_decisions.values():
            if signal and signal.decision:
                confidence_scores[signal.decision] += signal.confidence

        max_score = 0.0
        winning_decision = DecisionType.HOLD

        for decision_type, score in confidence_scores.items():
            if score > max_score:
                max_score = score
                winning_decision = decision_type

        # 归一化得分
        total_confidence = sum(confidence_scores.values())
        normalized_score = max_score / total_confidence if total_confidence > 0 else 0

        if normalized_score >= self.config.threshold:
            confidence = self._calculate_confidence(model_decisions, winning_decision)
            if confidence >= self.config.min_confidence:
                return FinalDecision(
                    decision=winning_decision,
                    confidence=confidence,
                    vote_summary=vote_counts,
                    model_details=list(model_decisions.values()),
                    risk_level=self._assess_risk_level(confidence, normalized_score),
                    reasoning=f"置信度加权投票通过: {normalized_score:.1%}"
                )

        return self._create_hold_decision(f"置信度加权投票未达阈值: {normalized_score:.1%}")

    def _calculate_confidence(self, model_decisions: Dict[int, ModelSignal],
                            decision_type: DecisionType) -> float:
        """计算平均置信度"""
        relevant_signals = [
            signal for signal in model_decisions.values()
            if signal.decision == decision_type
        ]
        
        if not relevant_signals:
            return 0.0
        
        return sum(signal.confidence for signal in relevant_signals) / len(relevant_signals)

    def _calculate_weighted_confidence(self, model_decisions: Dict[int, ModelSignal],
                                     decision_type: DecisionType) -> float:
        """计算加权平均置信度"""
        total_weight = 0.0
        weighted_confidence = 0.0
        
        for model_id, signal in model_decisions.items():
            if signal.decision == decision_type:
                weight = self.model_weights.get(model_id, 1.0)
                weighted_confidence += signal.confidence * weight
                total_weight += weight
        
        return weighted_confidence / total_weight if total_weight > 0 else 0.0

    def _assess_risk_level(self, confidence: float, vote_ratio: float) -> RiskLevel:
        """评估风险等级"""
        if confidence >= 0.8 and vote_ratio >= 0.8:
            return RiskLevel.LOW
        elif confidence >= 0.6 and vote_ratio >= 0.6:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH

    def _create_hold_decision(self, reasoning: str) -> FinalDecision:
        """创建观望决策"""
        return FinalDecision(
            decision=DecisionType.HOLD,
            confidence=0.5,
            vote_summary={decision_type: 0 for decision_type in DecisionType},
            model_details=[],
            risk_level=RiskLevel.MEDIUM,
            reasoning=reasoning
        )


class RiskController:
    """风险控制器"""

    def __init__(self, max_daily_loss: float = 0.05, max_position_size: float = 0.1):
        self.max_daily_loss = max_daily_loss
        self.max_position_size = max_position_size
        self.daily_pnl = 0.0
        self.current_positions: Dict[str, float] = {}

    def assess_decision_risk(self, decision: FinalDecision, symbol: str,
                           current_position: Optional[float] = None) -> Dict[str, any]:
        """评估决策风险"""
        risk_assessment = {
            'is_approved': True,
            'risk_level': decision.risk_level,
            'warnings': [],
            'adjusted_decision': decision.decision,
            'position_suggestion': 1.0
        }

        # 检查仓位风险
        if current_position and current_position > self.max_position_size:
            risk_assessment['warnings'].append("超过最大仓位限制")
            if decision.decision == DecisionType.BUY:
                risk_assessment['is_approved'] = False
                risk_assessment['adjusted_decision'] = DecisionType.HOLD

        # 根据风险等级调整仓位建议
        if decision.risk_level == RiskLevel.HIGH:
            risk_assessment['position_suggestion'] = 0.3
            risk_assessment['warnings'].append("高风险等级，建议降低仓位")
        elif decision.risk_level == RiskLevel.MEDIUM:
            risk_assessment['position_suggestion'] = 0.6
        else:
            risk_assessment['position_suggestion'] = 1.0

        return risk_assessment

    def update_daily_pnl(self, pnl: float):
        """更新每日盈亏"""
        self.daily_pnl += pnl

    def reset_daily_pnl(self):
        """重置每日盈亏"""
        self.daily_pnl = 0.0