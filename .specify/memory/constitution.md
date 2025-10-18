# Stock Trading Backtest Decision System Constitution

<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles: All principles replaced with new focus areas
- Added sections: Code Quality Standards, Testing Standards, User Experience Consistency, Performance Requirements
- Removed sections: Original placeholder principles
- Templates requiring updates:
  ✅ plan-template.md (Constitution Check section)
  ✅ spec-template.md (Success Criteria alignment)
  ✅ tasks-template.md (Testing and quality gates)
- Follow-up TODOs: None
-->

## Core Principles

### I. Code Quality Standards (NON-NEGOTIABLE)

所有代码必须遵循统一的编码标准和最佳实践：

- 后端使用 Python 3.9+ 和 FastAPI，遵循 PEP 8 编码规范
- 前端使用 Vue 3 Composition API 和 TypeScript，禁止使用 Options API
- 数据库操作必须使用异步模式（async/await），同步查询会阻塞事件循环
- 所有模型必须继承自 `BaseBacktestModel` 并实现 `generate_signal()` 方法
- API 响应必须遵循标准格式：`{"data": ..., "message": ..., "status": ...}`
- 代码必须通过 ESLint 和 Pylint 检查，无警告和错误

**理由**：统一的代码标准确保代码可维护性、可读性和团队协作效率，避免技术债务积累。

### II. Testing Standards (NON-NEGOTIABLE)

测试驱动开发是强制性的，所有功能必须包含适当的测试：

- 后端测试需要 PostgreSQL 测试数据库，内存数据库无法工作
- API 测试使用 `api_test.js` 进行全面的端点验证
- 模型测试必须包含历史数据的回测验证
- 前端测试可以使用 chrome-devtools MCP 进行浏览器自动化
- 测试覆盖率目标：后端 ≥80%，前端 ≥70%
- 所有用户故事必须能够独立测试和部署

**理由**：全面的测试确保系统稳定性，防止回归错误，支持持续集成和部署。

### III. User Experience Consistency

用户体验必须保持一致性和直观性：

- 前端组件使用统一的 UI 设计系统（Element Plus + UnoCSS）
- 所有用户交互必须有明确的反馈和加载状态
- 错误处理必须提供用户友好的错误信息
- 响应式设计必须支持桌面和移动设备
- 性能指标和图表必须清晰易懂，支持数据导出
- 导航和布局必须保持一致性，减少用户学习成本

**理由**：一致的用户体验提高用户满意度，降低培训成本，增强系统专业性。

### IV. Performance Requirements

系统性能必须满足实时交易决策需求：

- API 响应时间：95% 的请求 <200ms
- 数据库查询：复杂查询 <500ms
- 前端页面加载：首屏 <3 秒，交互响应 <100ms
- 内存使用：后端 <512MB，前端 <100MB
- 并发支持：至少 1000 个并发用户
- 数据更新：股票数据批量处理 <5 分钟

**理由**：性能要求确保系统能够处理实时交易数据，提供流畅的用户体验。

### V. Data Integrity and Security

数据完整性和安全性是首要考虑：

- 所有数据库操作必须包含事务处理
- 敏感数据必须加密存储
- API 端点必须包含适当的认证和授权
- 输入数据必须经过验证和清理
- 审计日志必须记录所有关键操作
- 备份和恢复机制必须到位

**理由**：金融数据的安全性和完整性是系统可信度的基础。

## Development Workflow

### Code Review Process

所有代码变更必须经过代码审查：

- 至少需要一名团队成员审查
- 审查必须检查代码质量、测试覆盖率和性能影响
- 违反章程原则的代码必须拒绝合并
- 审查意见必须在合并前解决

### Quality Gates

质量门控确保代码质量：

- 所有测试必须通过
- 代码覆盖率必须达标
- 静态代码分析必须无错误
- 性能基准测试必须通过
- 安全扫描必须无高危漏洞

## Governance

章程优先于所有其他实践；修订需要文档记录、批准和迁移计划。

所有 PR/审查必须验证合规性；复杂性必须得到合理解释；使用 AGENTS.md 进行运行时开发指导。

**版本**: 1.1.0 | **批准日期**: 2025-10-18 | **最后修订**: 2025-10-18
