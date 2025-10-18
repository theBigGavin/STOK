# 数据库迁移计划：添加 risk_level 字段

## 概述
本计划旨在为 `final_decisions` 表添加 `risk_level` 字段，以支持风险等级评估功能。

## 当前状态分析
- **数据库环境**: Docker容器中的PostgreSQL
- **表结构**: `final_decisions` 表已存在，但缺少 `risk_level` 字段
- **迁移机制**: 使用SQL脚本通过Docker exec执行
- **约束条件**: 字段需要符合CHECK约束，只允许 'LOW', 'MEDIUM', 'HIGH' 三个值

## 迁移SQL脚本
```sql
-- 为 final_decisions 表添加 risk_level 字段
ALTER TABLE final_decisions 
ADD COLUMN risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'));

-- 为现有数据设置默认风险等级
UPDATE final_decisions SET risk_level = 'MEDIUM' WHERE risk_level IS NULL;

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'final_decisions' AND column_name = 'risk_level';
```

## 执行步骤
1. **验证Docker容器状态**
   ```bash
   docker-compose ps
   ```

2. **执行迁移SQL**
   ```bash
   docker-compose exec postgres psql -U stock_user -d stock_system -c "
   ALTER TABLE final_decisions ADD COLUMN risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'));
   UPDATE final_decisions SET risk_level = 'MEDIUM' WHERE risk_level IS NULL;"
   ```

3. **验证迁移结果**
   ```bash
   docker-compose exec postgres psql -U stock_user -d stock_system -c "
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'final_decisions' AND column_name = 'risk_level';"
   ```

## 影响分析
### 已更新的组件
- **数据库模型**: [`backend/src/models/database.py`](backend/src/models/database.py:110) - 已包含risk_level字段定义
- **Pydantic模型**: [`backend/src/models/stock_models.py`](backend/src/models/stock_models.py:177) - 已包含RiskLevel枚举和字段定义

### 需要验证的API端点
- [`/api/decisions/final`](backend/src/api/decisions.py) - 综合决策API
- [`/api/backtest`](backend/src/api/backtest.py) - 回测相关API

## 风险缓解
1. **备份策略**: 执行前建议备份数据库
2. **回滚计划**: 如果迁移失败，可执行以下回滚SQL：
   ```sql
   ALTER TABLE final_decisions DROP COLUMN risk_level;
   ```
3. **测试验证**: 迁移后运行健康检查脚本验证功能正常

## 后续步骤
1. 在Code模式下执行迁移SQL
2. 验证API功能正常
3. 更新相关文档
4. 运行完整测试套件

## 责任人
- **迁移执行**: 需要在Code模式下完成
- **验证测试**: 使用现有健康检查脚本
- **文档更新**: 本计划文档

## 时间安排
- **预计执行时间**: 5分钟
- **验证时间**: 3分钟
- **总耗时**: 8分钟

---
*最后更新: 2025-10-17*