# Implementation Plan: 股票 AI 策略回测决策系统（含图表库迁移）

**Branch**: `001-stock-ai-decision-system` | **Date**: 2025-10-20 | **Spec**: `/specs/001-stock-ai-decision-system/spec.md`
**Input**: Feature specification from `/specs/001-stock-ai-decision-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建完整的股票 AI 策略回测决策系统，包含后端 AI 模型集成、决策引擎、前端可视化界面，并同步进行前端图表库从 Unovis 到 Ant Design Charts 的迁移。系统将提供股票推荐、决策点分析、多模型投票和回测性能评估等核心功能。

## Technical Context

**Language/Version**: Python 3.9+, TypeScript 5.0+, Node.js 18+, FastAPI, Vue 3, Nuxt 3
**Primary Dependencies**:

- 后端: FastAPI, SQLAlchemy, Celery, Redis, PostgreSQL, scikit-learn
- 前端: Vue 3, Nuxt 3, Element Plus, `@ant-design/charts-vue` (最新版本)
  **Storage**: PostgreSQL (股票数据、模型配置、回测结果), Redis (缓存、任务队列)
  **Testing**: pytest, Vitest, Vue Test Utils, chrome-devtools MCP, PostgreSQL 测试数据库
  **Target Platform**: Web 浏览器 (桌面和移动端)
  **Project Type**: 全栈 Web 应用 (FastAPI + Nuxt 3)
  **Performance Goals**: API 响应时间 <200ms, 图表渲染时间 <100ms, 交互响应 <50ms
  **Constraints**: 保持现有功能完整性，遵循宪法代码质量标准
  **Scale/Scope**: 10+ 核心功能模块，4 个图表组件迁移，约 5000+ 行代码

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Code Quality Standards

- [x] 后端使用 Python 3.9+ 和 FastAPI，遵循 PEP 8 编码规范
- [x] 前端使用 Vue 3 Composition API 和 TypeScript
- [x] 数据库操作使用异步模式（async/await）
- [x] 所有模型必须继承自 `BaseBacktestModel` 并实现 `generate_signal()` 方法
- [x] API 响应遵循标准格式：`{"data": ..., "message": ..., "status": ...}`
- [x] 代码通过 ESLint 和 Pylint 检查，无警告和错误

### Testing Standards

- [x] 测试策略覆盖所有用户故事
- [x] 后端测试使用 PostgreSQL 测试数据库
- [x] 前端测试包含浏览器自动化
- [x] 测试覆盖率目标：后端 ≥80%，前端 ≥70%
- [x] 所有用户故事能够独立测试和部署

### User Experience Consistency

- [x] UI 设计遵循统一的组件库 (Element Plus + UnoCSS)
- [x] 响应式设计支持桌面和移动设备
- [x] 用户交互提供明确反馈
- [x] 错误处理提供友好信息
- [x] 图表组件保持视觉一致性

### Performance Requirements

- [x] API 响应时间 <200ms (95%)
- [x] 前端页面加载 <3 秒
- [x] 图表渲染时间 <100ms，交互响应 <50ms
- [x] 内存使用符合限制
- [x] 并发支持 ≥1000 用户

## Project Structure

### Documentation (this feature)

```
specs/001-stock-ai-decision-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── api/             # FastAPI 路由 (股票、决策、模型、回测)
│   ├── config/          # 配置管理
│   ├── decision_engine/ # 决策引擎 (投票机制、权重配置)
│   ├── ml_models/       # AI 模型 (技术指标、机器学习模型)
│   ├── models/          # 数据模型 (SQLAlchemy ORM)
│   └── services/        # 业务服务 (股票服务、回测服务)
└── tests/
    ├── contract/        # 契约测试
    ├── integration/     # 集成测试
    ├── performance/     # 性能测试
    └── unit/            # 单元测试

nuxtfrontend/
├── app/
│   ├── components/      # Vue 组件
│   │   ├── charts/      # 图表组件 (迁移目标)
│   │   ├── dashboard/   # 仪表板组件
│   │   ├── decisions/   # 决策组件
│   │   ├── models/      # 模型管理组件
│   │   └── stocks/      # 股票组件
│   ├── composables/     # 组合式函数
│   ├── layouts/         # 布局组件
│   ├── pages/           # 页面组件
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── public/              # 静态资源
└── tests/               # 前端测试
```

**Structure Decision**: 采用全栈 Web 应用结构，包含独立的后端 (FastAPI) 和前端 (Nuxt 3) 目录。后端专注于 AI 模型集成和决策逻辑，前端专注于用户界面和可视化。图表组件迁移作为前端改进的一部分进行。

## Phase 1 完成确认

### 宪法检查重新评估

经过 Phase 1 设计阶段，所有宪法要求均已满足：

- ✅ **代码质量标准**: 后端使用 FastAPI + Python 3.9+，前端使用 Vue 3 Composition API + TypeScript
- ✅ **测试标准**: 制定了全面的测试策略，包含后端 PostgreSQL 测试和前端浏览器自动化
- ✅ **用户体验一致性**: 使用统一的 UI 设计系统，确保视觉和交互一致性
- ✅ **性能要求**: 制定了明确的性能指标，满足实时交易决策需求

### 生成的设计文档

1. **研究文档** (`research.md`): 完成了技术选型研究和架构设计分析
2. **数据模型** (`data-model.md`): 定义了完整的数据库设计和实体关系
3. **API 契约** (`contracts/openapi.yaml`): 规范了前后端接口和数据格式
4. **快速开始指南** (`quickstart.md`): 提供了详细的开发环境设置和部署指南

### 代理上下文更新

已成功更新 Roo Code 代理上下文，包含完整的技术栈信息：

- 后端: Python 3.9+, FastAPI, SQLAlchemy, Celery, Redis, PostgreSQL
- 前端: TypeScript 5.0+, Node.js 18+, Vue 3, Nuxt 3, Element Plus
- 图表库: `@unovis/ts` (1.6.1), `@unovis/vue` (1.6.1) → `@ant-design/charts-vue` (最新)

## 下一步

Phase 2 任务规划将由 `/speckit.tasks` 命令处理，将基于本计划生成具体的实施任务，涵盖完整的股票 AI 决策系统和图表库迁移。
