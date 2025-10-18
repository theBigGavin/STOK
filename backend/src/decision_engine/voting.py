"""
投票引擎 - 根据数据模型文档更新
"""

from typing import Dict, List, Optional, Any
from decimal import Decimal
from src.models.stock_models import DecisionType


class VotingEngine:
    """投票引擎"""

    def __init__(self, threshold: float = 0.6, min_confidence: float = 0.6):
        self.threshold = threshold
        self.min_confidence = min_confidence

    def aggregate_votes(self, votes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """聚合投票结果"""
        if not votes:
            return self._create_hold_decision("无投票结果")

        # 统计投票
        vote_counts = self._count_votes(votes)
        total_votes = len(votes)

        # 计算加权得分
        weighted_scores = self._calculate_weighted_scores(votes)

        # 确定获胜决策
        winning_decision = self._determine_winning_decision(weighted_scores, vote_counts)

        # 计算置信度
        confidence = self._calculate_confidence(votes, winning_decision)

        # 检查是否达到阈值
        if confidence >= self.min_confidence:
            return {
                'decision_type': winning_decision,
                'confidence': confidence,
                'vote_summary': vote_counts,
                'weighted_scores': weighted_scores,
                'reasoning': self._generate_reasoning(winning_decision, confidence, vote_counts)
            }
        else:
            return self._create_hold_decision(f"置信度未达阈值: {confidence:.1%}")

    def _count_votes(self, votes: List[Dict[str, Any]]) -> Dict[str, int]:
        """统计各决策类型的票数"""
        vote_counts = {
            DecisionType.BUY: 0,
            DecisionType.SELL: 0,
            DecisionType.HOLD: 0
        }
        
        for vote in votes:
            vote_type = vote['vote_type']
            if vote_type in vote_counts:
                vote_counts[vote_type] += 1
        
        return vote_counts

    def _calculate_weighted_scores(self, votes: List[Dict[str, Any]]) -> Dict[str, float]:
        """计算加权得分"""
        weighted_scores = {
            DecisionType.BUY: 0.0,
            DecisionType.SELL: 0.0,
            DecisionType.HOLD: 0.0
        }
        
        for vote in votes:
            vote_type = vote['vote_type']
            confidence = float(vote['confidence'])
            signal_strength = float(vote.get('signal_strength', 1.0))
            
            # 使用置信度和信号强度计算权重
            weight = confidence * signal_strength
            weighted_scores[vote_type] += weight
        
        return weighted_scores

    def _determine_winning_decision(self, weighted_scores: Dict[str, float], 
                                  vote_counts: Dict[str, int]) -> str:
        """确定获胜决策"""
        # 首先检查是否有明确的多数票
        total_votes = sum(vote_counts.values())
        if total_votes > 0:
            for decision_type, count in vote_counts.items():
                if count / total_votes >= self.threshold:
                    return decision_type

        # 如果没有明确多数，使用加权得分
        max_score = 0.0
        winning_decision = DecisionType.HOLD
        
        for decision_type, score in weighted_scores.items():
            if score > max_score:
                max_score = score
                winning_decision = decision_type
        
        return winning_decision

    def _calculate_confidence(self, votes: List[Dict[str, Any]], decision_type: str) -> float:
        """计算置信度"""
        relevant_votes = [v for v in votes if v['vote_type'] == decision_type]
        
        if not relevant_votes:
            return 0.0
        
        # 计算相关投票的平均置信度
        total_confidence = sum(float(v['confidence']) for v in relevant_votes)
        avg_confidence = total_confidence / len(relevant_votes)
        
        # 考虑投票一致性
        consistency_factor = len(relevant_votes) / len(votes)
        
        return avg_confidence * consistency_factor

    def _generate_reasoning(self, decision_type: str, confidence: float, 
                          vote_counts: Dict[str, int]) -> str:
        """生成决策理由"""
        total_votes = sum(vote_counts.values())
        
        if decision_type == DecisionType.HOLD:
            return f"观望决策，投票分布: 买入{vote_counts[DecisionType.BUY]}, 卖出{vote_counts[DecisionType.SELL]}, 观望{vote_counts[DecisionType.HOLD]}"
        
        vote_ratio = vote_counts[decision_type] / total_votes if total_votes > 0 else 0
        
        if vote_ratio >= 0.8:
            strength = "强烈"
        elif vote_ratio >= 0.6:
            strength = "较强"
        else:
            strength = "一般"
        
        return f"{strength}{decision_type}信号，置信度{confidence:.1%}，{vote_counts[decision_type]}/{total_votes}个模型支持"

    def _create_hold_decision(self, reasoning: str) -> Dict[str, Any]:
        """创建观望决策"""
        return {
            'decision_type': DecisionType.HOLD,
            'confidence': 0.5,
            'vote_summary': {
                DecisionType.BUY: 0,
                DecisionType.SELL: 0,
                DecisionType.HOLD: 0
            },
            'weighted_scores': {
                DecisionType.BUY: 0.0,
                DecisionType.SELL: 0.0,
                DecisionType.HOLD: 0.0
            },
            'reasoning': reasoning
        }

    def update_threshold(self, threshold: float):
        """更新决策阈值"""
        self.threshold = threshold

    def update_min_confidence(self, min_confidence: float):
        """更新最小置信度"""
        self.min_confidence = min_confidence


class RiskController:
    """风险控制器"""

    def __init__(self, max_daily_loss: float = 0.05, max_position_size: float = 0.1):
        self.max_daily_loss = max_daily_loss
        self.max_position_size = max_position_size
        self.daily_pnl = 0.0
        self.current_positions: Dict[str, float] = {}

    def assess_decision_risk(self, decision: Dict[str, Any], symbol: str,
                           current_position: Optional[float] = None) -> Dict[str, Any]:
        """评估决策风险"""
        risk_assessment = {
            'is_approved': True,
            'risk_level': self._calculate_risk_level(decision['confidence']),
            'warnings': [],
            'adjusted_decision': decision['decision_type'],
            'position_suggestion': 1.0
        }

        # 检查仓位风险
        if current_position and current_position > self.max_position_size:
            risk_assessment['warnings'].append("超过最大仓位限制")
            if decision['decision_type'] == DecisionType.BUY:
                risk_assessment['is_approved'] = False
                risk_assessment['adjusted_decision'] = DecisionType.HOLD

        # 根据风险等级调整仓位建议
        if risk_assessment['risk_level'] == 'HIGH':
            risk_assessment['position_suggestion'] = 0.3
            risk_assessment['warnings'].append("高风险等级，建议降低仓位")
        elif risk_assessment['risk_level'] == 'MEDIUM':
            risk_assessment['position_suggestion'] = 0.6
        else:
            risk_assessment['position_suggestion'] = 1.0

        return risk_assessment

    def _calculate_risk_level(self, confidence: float) -> str:
        """计算风险等级"""
        if confidence >= 0.8:
            return 'LOW'
        elif confidence >= 0.6:
            return 'MEDIUM'
        else:
            return 'HIGH'

    def update_daily_pnl(self, pnl: float):
        """更新每日盈亏"""
        self.daily_pnl += pnl

    def reset_daily_pnl(self):
        """重置每日盈亏"""
        self.daily_pnl = 0.0