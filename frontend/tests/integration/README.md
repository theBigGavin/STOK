# STOK 项目集成测试

本文档描述了 STOK 项目的完整集成测试套件，用于验证前端与后端系统的完整集成。

## 测试架构

### 测试环境

- **测试数据库**: PostgreSQL 15 (端口 5433)
- **测试缓存**: Redis 7 (端口 6380)
- **测试后端**: FastAPI 服务 (端口 8001)
- **测试前端**: Vue 3 应用 (端口 5174)
- **测试运行器**: Node.js 容器

### 测试类型

1. **API 集成测试** - 验证后端 API 的完整功能
2. **完整工作流程测试** - 测试端到端的用户工作流程
3. **系统健康检查测试** - 验证系统组件健康状态
4. **性能集成测试** - 测试系统性能和稳定性
5. **安全集成测试** - 验证安全防护机制

## 快速开始

### 1. 本地运行集成测试

```bash
# 启动测试环境
npm run test:integration:docker

# 或者手动运行测试
npm run test:integration

# 运行特定测试类型
npm run test:integration:api
npm run test:integration:workflow
npm run test:integration:health
npm run test:integration:performance
npm run test:integration:security
```

### 2. CI/CD 集成测试

集成测试会自动在 GitHub Actions 中运行：

```yaml
# 查看 .github/workflows/integration-tests.yml
```

## 测试文件结构

```
frontend/tests/integration/
├── README.md                          # 本文档
├── .env.test                          # 测试环境变量
├── setup.ts                           # 测试设置文件
├── test-helpers.ts                    # 测试辅助工具
├── api-integration.test.ts            # API 集成测试
├── full-workflow.test.ts              # 完整工作流程测试
├── health-check.test.ts               # 系统健康检查测试
├── performance.test.ts                # 性能集成测试
├── security.test.ts                   # 安全集成测试
├── docker-compose.test.yml            # Docker 测试配置
├── wait-for-services.sh               # 服务等待脚本
└── test-data/
    └── init-test-db.sql               # 测试数据库初始化
```

## 测试配置

### 环境变量

测试环境变量在 `.env.test` 中配置：

```bash
VITE_API_BASE_URL=http://localhost:8001/api/v1
TEST_TIMEOUT=120000
TEST_RETRY_COUNT=3
```

### Docker 配置

测试环境使用 Docker Compose 编排：

- `test-database`: PostgreSQL 测试数据库
- `test-redis`: Redis 测试缓存
- `test-backend`: 后端测试服务
- `test-frontend`: 前端测试服务
- `test-runner`: 测试运行器

## 测试覆盖范围

### API 集成测试

- ✅ 股票数据 API 集成
- ✅ 模型管理 API 集成
- ✅ 决策生成 API 集成
- ✅ 回测分析 API 集成
- ✅ 错误处理和恢复机制

### 完整工作流程测试

- ✅ 用户登录和认证流程
- ✅ 股票数据查询和分析
- ✅ 模型训练和评估
- ✅ 决策生成和回测
- ✅ 结果展示和导出

### 系统健康检查测试

- ✅ 数据库连接健康检查
- ✅ Redis 缓存健康检查
- ✅ 后端 API 健康检查
- ✅ 前端应用健康检查
- ✅ 外部服务集成检查

### 性能集成测试

- ✅ API 响应时间基准测试
- ✅ 并发用户性能测试
- ✅ 数据加载性能测试
- ✅ 内存使用监控
- ✅ 错误率统计

### 安全集成测试

- ✅ SQL 注入防护测试
- ✅ XSS 攻击防护测试
- ✅ 输入验证测试
- ✅ 认证授权测试
- ✅ 数据保护测试

## 测试数据管理

### 测试数据创建

测试数据通过 `TestDataManager` 类管理：

```typescript
const testData = await testDataManager.createTestStock(
  client,
  'AAPL',
  'Apple Inc.'
);
```

### 测试数据清理

测试数据自动清理：

- 每个测试用例运行前清理
- 每个测试用例运行后清理
- 所有测试运行完成后清理

## 测试报告

测试结果生成在 `test-results/` 目录：

- `integration-report.html` - HTML 测试报告
- `integration-results.json` - JSON 测试结果
- `coverage/` - 代码覆盖率报告

## 故障排除

### 常见问题

1. **测试超时**

   ```bash
   # 增加超时时间
   export TEST_TIMEOUT=180000
   npm run test:integration
   ```

2. **服务连接失败**

   ```bash
   # 检查服务状态
   docker-compose -f tests/integration/docker-compose.test.yml ps

   # 重启测试环境
   npm run test:integration:docker:clean
   npm run test:integration:docker
   ```

3. **数据库连接问题**
   ```bash
   # 检查数据库连接
   psql -h localhost -p 5433 -U test_user -d stok_test
   ```

### 调试模式

启用调试日志：

```bash
export LOG_LEVEL=debug
npm run test:integration
```

## 最佳实践

1. **测试隔离**: 每个测试用例应该独立运行，不依赖其他测试的状态
2. **数据清理**: 测试完成后自动清理所有测试数据
3. **错误处理**: 测试应该验证错误场景和边界情况
4. **性能基准**: 建立性能基准并监控性能回归
5. **安全验证**: 定期运行安全测试验证防护机制

## 扩展测试

要添加新的集成测试：

1. 在 `tests/integration/` 目录创建新的测试文件
2. 在 `package.json` 中添加对应的测试脚本
3. 更新 CI/CD 工作流包含新的测试
4. 在 README 中记录新的测试类型

## 联系方式

如有问题，请联系开发团队或查看项目文档。
