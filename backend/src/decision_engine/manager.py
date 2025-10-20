"""
决策引擎管理器 - 根据数据模型文档更新
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from src.ml_models.base import BaseBacktestModel
from src.ml_models.technical_models import MovingAverageCrossover, RSIModel, MACDModel
from src.decision_engine.voting import VotingEngine
from src.models.database import AIModel, Decision, VoteResult, Stock
from src.models.stock_models import DecisionCreate, VoteResultCreate, DecisionType
from src.services.stock_service import StockService


class DecisionEngineManager:
    """决策引擎管理器"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.stock_service = StockService(session)
        self.voting_engine = VotingEngine()
        
        # 模型实例缓存
        self.model_instances: Dict[str, BaseBacktestModel] = {}
        
        # 初始化默认模型
        self._initialize_default_models()

    def _initialize_default_models(self):
        """初始化默认模型"""
        try:
            # 创建默认的技术指标模型实例
            self.model_instances = {
                'moving_average_crossover': MovingAverageCrossover(
                    short_window=5, long_window=20
                ),
                'rsi_model': RSIModel(
                    period=14, overbought=70, oversold=30
                ),
                'macd_model': MACDModel(
                    fast_period=12, slow_period=26, signal_period=9
                )
            }
            print("默认模型初始化成功")
        except Exception as e:
            print(f"默认模型初始化失败: {str(e)}")

    async def get_active_models(self) -> List[AIModel]:
        """获取活跃的AI模型"""
        result = await self.session.execute(
            AIModel.__table__.select().where(AIModel.is_active == True)
        )
        return result.fetchall()

    async def generate_recommendations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """生成股票推荐列表"""
        # 获取所有活跃模型
        active_models = await self.get_active_models()
        if not active_models:
            return []

        # 获取所有股票
        stocks = await self.stock_service.get_stocks(limit=100)
        recommendations = []

        for stock in stocks:
            try:
                # 为每个股票生成决策
                decision = await self.generate_decision_for_stock(stock.id, active_models)
                if decision and decision.decision_type == DecisionType.BUY:
                    # 获取投票结果
                    vote_results = await self.stock_service.get_vote_results_for_decision(decision.id)
                    
                    recommendations.append({
                        'stock': stock,
                        'decision': decision,
                        'vote_results': vote_results,
                        'total_votes': len(vote_results),
                        'buy_votes': len([v for v in vote_results if v.vote_type == DecisionType.BUY]),
                        'sell_votes': len([v for v in vote_results if v.vote_type == DecisionType.SELL]),
                        'hold_votes': len([v for v in vote_results if v.vote_type == DecisionType.HOLD]),
                        'avg_confidence': sum(v.confidence for v in vote_results) / len(vote_results) if vote_results else 0
                    })
            except Exception as e:
                print(f"为股票 {stock.symbol} 生成推荐失败: {e}")
                continue

        # 按置信度排序并限制数量
        recommendations.sort(key=lambda x: x['decision'].confidence, reverse=True)
        return recommendations[:limit]

    async def generate_decision_for_stock(self, stock_id: str, models: List[AIModel]) -> Optional[Decision]:
        """为单个股票生成决策"""
        try:
            # 获取股票数据
            stock = await self.stock_service.get_stock_by_id(stock_id)
            if not stock:
                return None

            # 获取最近的价格数据
            end_date = date.today()
            start_date = end_date - timedelta(days=365)  # 获取最近一年的数据
            stock_prices = await self.stock_service.get_stock_prices(stock_id, start_date, end_date)
            
            if not stock_prices:
                return None

            # 转换为DataFrame格式供模型使用
            price_data = []
            for price in stock_prices:
                price_data.append({
                    'date': price.date,
                    'open': float(price.open_price) if price.open_price else None,
                    'high': float(price.high_price) if price.high_price else None,
                    'low': float(price.low_price) if price.low_price else None,
                    'close': float(price.close_price) if price.close_price else None,
                    'volume': price.volume
                })

            # 收集所有模型的投票
            vote_results = []
            for model in models:
                try:
                    vote_result = await self._generate_model_vote(model, stock_id, price_data)
                    if vote_result:
                        vote_results.append(vote_result)
                except Exception as e:
                    print(f"模型 {model.name} 投票失败: {e}")
                    continue

            if not vote_results:
                return None

            # 使用投票引擎聚合决策
            final_decision = self.voting_engine.aggregate_votes(vote_results)

            # 创建决策记录
            decision_data = DecisionCreate(
                stock_id=stock_id,
                decision_type=final_decision['decision_type'],
                confidence=final_decision['confidence'],
                target_price=final_decision.get('target_price'),
                stop_loss_price=final_decision.get('stop_loss_price'),
                time_horizon=final_decision.get('time_horizon'),
                reasoning=final_decision.get('reasoning')
            )

            decision = await self.stock_service.create_decision(decision_data)

            # 创建投票结果记录
            for vote in vote_results:
                vote_result_data = VoteResultCreate(
                    decision_id=decision.id,
                    model_id=vote['model_id'],
                    vote_type=vote['vote_type'],
                    confidence=vote['confidence'],
                    signal_strength=vote['signal_strength'],
                    reasoning=vote.get('reasoning')
                )
                await self.stock_service.create_vote_result(vote_result_data)

            return decision

        except Exception as e:
            print(f"为股票 {stock_id} 生成决策失败: {e}")
            return None

    async def _generate_model_vote(self, model: AIModel, stock_id: str, price_data: List[Dict]) -> Optional[Dict]:
        """生成单个模型的投票"""
        try:
            # 获取模型实例
            model_instance = self.model_instances.get(model.name.lower())
            if not model_instance:
                print(f"模型 {model.name} 实例不存在")
                return None

            # 生成信号
            signal = model_instance.generate_signal(price_data)
            
            return {
                'model_id': model.id,
                'vote_type': signal['decision'],
                'confidence': signal['confidence'],
                'signal_strength': signal['signal_strength'],
                'reasoning': signal.get('reasoning', ''),
                'target_price': signal.get('target_price'),
                'stop_loss_price': signal.get('stop_loss_price')
            }

        except Exception as e:
            print(f"模型 {model.name} 生成投票失败: {e}")
            return None

    async def get_decision_details(self, decision_id: str) -> Optional[Dict[str, Any]]:
        """获取决策详情"""
        try:
            # 获取决策
            result = await self.session.execute(
                Decision.__table__.select().where(Decision.id == decision_id)
            )
            decision = result.fetchone()
            
            if not decision:
                return None

            # 获取投票结果
            vote_results = await self.stock_service.get_vote_results_for_decision(decision_id)
            
            # 获取股票信息
            stock = await self.stock_service.get_stock_by_id(decision.stock_id)
            
            # 获取模型信息
            model_details = []
            for vote in vote_results:
                model_result = await self.session.execute(
                    AIModel.__table__.select().where(AIModel.id == vote.model_id)
                )
                model = model_result.fetchone()
                
                if model:
                    model_details.append({
                        'model': model,
                        'vote': vote
                    })

            return {
                'decision': decision,
                'stock': stock,
                'vote_results': vote_results,
                'model_details': model_details,
                'vote_summary': {
                    'total_votes': len(vote_results),
                    'buy_votes': len([v for v in vote_results if v.vote_type == DecisionType.BUY]),
                    'sell_votes': len([v for v in vote_results if v.vote_type == DecisionType.SELL]),
                    'hold_votes': len([v for v in vote_results if v.vote_type == DecisionType.HOLD]),
                    'avg_confidence': sum(v.confidence for v in vote_results) / len(vote_results) if vote_results else 0
                }
            }

        except Exception as e:
            print(f"获取决策详情失败: {e}")
            return None

    async def update_model_weights(self, weights: Dict[str, float]):
        """更新模型权重"""
        for model_name, weight in weights.items():
            # 更新数据库中的模型权重
            await self.session.execute(
                AIModel.__table__.update()
                .where(AIModel.name == model_name)
                .values(weight=weight)
            )
        
        await self.session.commit()

    async def add_model(self, model_data: Dict[str, Any]) -> bool:
        """添加新模型"""
        try:
            model = AIModel(
                name=model_data['name'],
                model_type=model_data['model_type'],
                description=model_data.get('description'),
                weight=model_data.get('weight', 1.0),
                is_active=model_data.get('is_active', True)
            )
            
            self.session.add(model)
            await self.session.commit()
            
            # 如果提供了模型类，也添加到实例缓存
            if 'model_class' in model_data:
                self.model_instances[model_data['name'].lower()] = model_data['model_class']()
            
            return True
            
        except Exception as e:
            print(f"添加模型失败: {e}")
            await self.session.rollback()
            return False

    async def deactivate_model(self, model_id: str) -> bool:
        """停用模型"""
        try:
            await self.session.execute(
                AIModel.__table__.update()
                .where(AIModel.id == model_id)
                .values(is_active=False)
            )
            await self.session.commit()
            return True
            
        except Exception as e:
            print(f"停用模型失败: {e}")
            await self.session.rollback()
            return False

    async def get_model_performance(self, model_id: str) -> Optional[Dict[str, Any]]:
        """获取模型性能统计"""
        try:
            # 获取模型的投票结果
            result = await self.session.execute(
                VoteResult.__table__.select().where(VoteResult.model_id == model_id)
            )
            votes = result.fetchall()
            
            if not votes:
                return None

            # 计算性能指标
            total_votes = len(votes)
            correct_votes = 0
            total_confidence = 0
            
            for vote in votes:
                total_confidence += vote.confidence
                # 这里需要实现正确性验证逻辑
                # 暂时假设所有投票都是正确的
                correct_votes += 1

            accuracy = correct_votes / total_votes if total_votes > 0 else 0
            avg_confidence = total_confidence / total_votes if total_votes > 0 else 0

            return {
                'total_votes': total_votes,
                'correct_votes': correct_votes,
                'accuracy': accuracy,
                'avg_confidence': avg_confidence,
                'performance_score': accuracy * avg_confidence  # 简单的性能评分
            }

        except Exception as e:
            print(f"获取模型性能失败: {e}")
            return None

    async def refresh_recommendations(self) -> int:
        """刷新所有推荐（重新生成决策）"""
        try:
            # 获取所有活跃模型
            active_models = await self.get_active_models()
            if not active_models:
                return 0

            # 获取所有股票
            stocks = await self.stock_service.get_stocks(limit=200)
            generated_count = 0

            for stock in stocks:
                try:
                    decision = await self.generate_decision_for_stock(stock.id, active_models)
                    if decision:
                        generated_count += 1
                except Exception as e:
                    print(f"为股票 {stock.symbol} 生成决策失败: {e}")
                    continue

            return generated_count

        except Exception as e:
            print(f"刷新推荐失败: {e}")
            return 0


    async def analyze_decision_points(self, stock_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """分析决策点"""
        try:
            # 获取股票信息
            stock = await self.stock_service.get_stock_by_id(stock_id)
            if not stock:
                raise ValueError(f"股票 {stock_id} 不存在")
            
            # 获取价格数据
            stock_prices = await self.stock_service.get_stock_prices(stock_id, start_date, end_date)
            if not stock_prices:
                return {
                    'stock': stock,
                    'decision_points': [],
                    'summary': {
                        'total_decisions': 0,
                        'buy_decisions': 0,
                        'sell_decisions': 0,
                        'hold_decisions': 0,
                        'avg_confidence': 0
                    }
                }
            
            # 获取该时间段内的决策
            decisions = await self.stock_service.get_decisions_by_stock_and_date_range(
                stock_id, start_date, end_date
            )
            
            # 分析决策点
            decision_points = []
            for decision in decisions:
                # 获取投票结果
                vote_results = await self.stock_service.get_vote_results_for_decision(decision.id)
                
                # 计算决策点前后的价格变化
                price_changes = await self._calculate_decision_price_changes(decision, stock_prices)
                
                decision_points.append({
                    'decision': decision,
                    'vote_results': vote_results,
                    'vote_summary': {
                        'total_votes': len(vote_results),
                        'buy_votes': len([v for v in vote_results if v.vote_type == DecisionType.BUY]),
                        'sell_votes': len([v for v in vote_results if v.vote_type == DecisionType.SELL]),
                        'hold_votes': len([v for v in vote_results if v.vote_type == DecisionType.HOLD]),
                        'avg_confidence': sum(v.confidence for v in vote_results) / len(vote_results) if vote_results else 0
                    },
                    'price_changes': price_changes,
                    'performance': await self._calculate_decision_performance(decision, price_changes)
                })
            
            # 计算汇总统计
            summary = {
                'total_decisions': len(decision_points),
                'buy_decisions': len([d for d in decision_points if d['decision'].decision_type == DecisionType.BUY]),
                'sell_decisions': len([d for d in decision_points if d['decision'].decision_type == DecisionType.SELL]),
                'hold_decisions': len([d for d in decision_points if d['decision'].decision_type == DecisionType.HOLD]),
                'avg_confidence': sum(d['decision'].confidence for d in decision_points) / len(decision_points) if decision_points else 0,
                'success_rate': self._calculate_success_rate(decision_points)
            }
            
            return {
                'stock': stock,
                'decision_points': decision_points,
                'summary': summary
            }
            
        except Exception as e:
            print(f"分析决策点失败: {e}")
            raise

    async def _calculate_decision_price_changes(self, decision: Decision, stock_prices: List) -> Dict[str, float]:
        """计算决策点前后的价格变化"""
        decision_date = decision.generated_at.date()
        
        # 找到决策日期的价格
        decision_price = None
        for price in stock_prices:
            if price.date == decision_date:
                decision_price = price.close_price
                break
        
        if not decision_price:
            return {}
        
        # 计算前后时间段的价格变化
        price_changes = {}
        
        # 决策后1天
        next_day_price = self._find_price_after_days(stock_prices, decision_date, 1)
        if next_day_price:
            price_changes['next_day_change'] = (next_day_price - decision_price) / decision_price
        
        # 决策后1周
        week_price = self._find_price_after_days(stock_prices, decision_date, 7)
        if week_price:
            price_changes['week_change'] = (week_price - decision_price) / decision_price
        
        # 决策后1月
        month_price = self._find_price_after_days(stock_prices, decision_date, 30)
        if month_price:
            price_changes['month_change'] = (month_price - decision_price) / decision_price
        
        # 决策后3月
        quarter_price = self._find_price_after_days(stock_prices, decision_date, 90)
        if quarter_price:
            price_changes['quarter_change'] = (quarter_price - decision_price) / decision_price
        
        return price_changes

    def _find_price_after_days(self, stock_prices: List, start_date: date, days: int) -> Optional[float]:
        """查找指定天数后的价格"""
        target_date = start_date + timedelta(days=days)
        
        # 找到目标日期或之后最近的价格
        for price in stock_prices:
            if price.date >= target_date:
                return price.close_price
        
        return None

    async def _calculate_decision_performance(self, decision: Decision, price_changes: Dict[str, float]) -> Dict[str, Any]:
        """计算决策性能"""
        performance = {
            'is_correct': False,
            'accuracy_score': 0.0,
            'profitability': 0.0
        }
        
        if not price_changes:
            return performance
        
        # 使用1周变化作为主要性能指标
        week_change = price_changes.get('week_change', 0)
        
        # 判断决策是否正确
        if decision.decision_type == DecisionType.BUY:
            performance['is_correct'] = week_change > 0
            performance['profitability'] = week_change
        elif decision.decision_type == DecisionType.SELL:
            performance['is_correct'] = week_change < 0
            performance['profitability'] = -week_change  # 卖出决策的盈利是价格下跌
        else:  # HOLD
            performance['is_correct'] = abs(week_change) < 0.02  # 持有决策正确如果价格变化不大
            performance['profitability'] = 0
        
        # 计算准确度分数（置信度 * 正确性）
        performance['accuracy_score'] = decision.confidence if performance['is_correct'] else (1 - decision.confidence)
        
        return performance

    def _calculate_success_rate(self, decision_points: List[Dict]) -> float:
        """计算决策成功率"""
        if not decision_points:
            return 0.0
        
        correct_decisions = sum(1 for d in decision_points if d['performance']['is_correct'])
        return correct_decisions / len(decision_points)

    async def get_decision_timeline(self, stock_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """获取决策时间线"""
        try:
            # 获取最近的决策
            decisions = await self.stock_service.get_decisions_by_stock(stock_id, limit)
            
            timeline = []
            for decision in decisions:
                # 获取投票结果
                vote_results = await self.stock_service.get_vote_results_for_decision(decision.id)
                
                timeline.append({
                    'decision': decision,
                    'vote_summary': {
                        'total_votes': len(vote_results),
                        'buy_votes': len([v for v in vote_results if v.vote_type == DecisionType.BUY]),
                        'sell_votes': len([v for v in vote_results if v.vote_type == DecisionType.SELL]),
                        'hold_votes': len([v for v in vote_results if v.vote_type == DecisionType.HOLD])
                    },
                    'timestamp': decision.generated_at
                })
            
            return timeline
            
        except Exception as e:
            print(f"获取决策时间线失败: {e}")
            return []

    async def get_decision_insights(self, stock_id: str) -> Dict[str, Any]:
        """获取决策洞察"""
        try:
            # 获取所有决策
            decisions = await self.stock_service.get_decisions_by_stock(stock_id, 100)
            
            if not decisions:
                return {
                    'total_decisions': 0,
                    'insights': []
                }
            
            insights = []
            
            # 分析决策模式
            buy_decisions = [d for d in decisions if d.decision_type == DecisionType.BUY]
            sell_decisions = [d for d in decisions if d.decision_type == DecisionType.SELL]
            hold_decisions = [d for d in decisions if d.decision_type == DecisionType.HOLD]
            
            # 洞察1: 决策分布
            insights.append({
                'type': 'decision_distribution',
                'title': '决策分布',
                'description': f'买入决策: {len(buy_decisions)}, 卖出决策: {len(sell_decisions)}, 持有决策: {len(hold_decisions)}',
                'data': {
                    'buy': len(buy_decisions),
                    'sell': len(sell_decisions),
                    'hold': len(hold_decisions)
                }
            })
            
            # 洞察2: 平均置信度
            avg_confidence = sum(d.confidence for d in decisions) / len(decisions)
            insights.append({
                'type': 'confidence_analysis',
                'title': '置信度分析',
                'description': f'平均决策置信度: {avg_confidence:.2f}',
                'data': {
                    'avg_confidence': avg_confidence,
                    'max_confidence': max(d.confidence for d in decisions),
                    'min_confidence': min(d.confidence for d in decisions)
                }
            })
            
            # 洞察3: 决策频率
            if len(decisions) > 1:
                dates = [d.generated_at for d in decisions]
                dates.sort()
                time_spans = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                avg_frequency = sum(time_spans) / len(time_spans)
                
                insights.append({
                    'type': 'decision_frequency',
                    'title': '决策频率',
                    'description': f'平均每 {avg_frequency:.1f} 天生成一次决策',
                    'data': {
                        'avg_frequency_days': avg_frequency,
                        'total_period_days': (dates[-1] - dates[0]).days
                    }
                })
            
            return {
                'total_decisions': len(decisions),
                'insights': insights
            }
            
        except Exception as e:
            print(f"获取决策洞察失败: {e}")
            return {
                'total_decisions': 0,
                'insights': []
            }


# 全局决策引擎管理器实例（需要在使用时传入session）
# decision_engine_manager = DecisionEngineManager()