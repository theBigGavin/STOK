# Stock Trading Backtest Decision System

一个基于多模型投票机制的股票交易决策系统，支持从数据库获取股票交易数据，通过多个回测模型获得每日买卖点决策。

## 系统架构

### 核心功能

- 多模型投票决策：系统运行多个回测模型，根据投票结果生成交易决策
- 实时数据处理：支持实时股票数据采集和处理
- 可扩展模型框架：支持技术指标模型和机器学习模型
- 决策引擎：基于权重配置的投票机制

### 技术栈

- **后端**: Python + FastAPI + PostgreSQL + Redis + Celery
- **前端**: Vue.js 3 + TypeScript + Element Plus
- **数据处理**: Pandas + NumPy + scikit-learn
- **部署**: Docker + Docker Compose

## 快速开始

### 环境要求

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### 安装和运行

1. **克隆项目**

```bash
git clone <repository-url>
cd stock-trading-system
```

2. **后端设置**

```bash
cd backend
pip install -r requirements.txt
python scripts/setup_database.py
python -m uvicorn main:app --reload
```

3. **前端设置**

```bash
cd frontend
npm install
npm run dev
```

4. **数据更新**

```bash
cd backend
python scripts/update_stock_data.py
```

## 项目结构

```
stock-trading-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务服务
│   │   ├── ml_models/      # 回测模型
│   │   ├── decision_engine/ # 决策引擎
│   │   └── data/           # 数据处理
│   ├── tests/              # 测试文件
│   └── scripts/            # 脚本文件
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── views/          # 页面视图
│   │   ├── store/          # 状态管理
│   │   └── api/            # API调用
│   └── tests/              # 测试文件
├── data/                   # 数据文件
│   ├── migrations/         # 数据库迁移
│   └── seeds/              # 种子数据
├── docs/                   # 文档
└── scripts/                # 部署脚本
```

## 核心概念

### 决策流程

1. **数据采集**: 获取股票历史数据和实时数据
2. **特征工程**: 计算技术指标和特征
3. **模型预测**: 多个回测模型生成买卖信号
4. **投票决策**: 根据模型投票结果生成最终决策
5. **风险控制**: 应用风险控制规则

### 模型接口

所有回测模型必须实现 `BaseBacktestModel` 接口：

```python
class BaseBacktestModel(ABC):
    @abstractmethod
    def generate_signal(self, data: pd.DataFrame) -> Dict[str, Any]
```

### API 响应格式

```json
{
    "data": {...},
    "message": "操作成功",
    "status": "success"
}
```

## 开发指南

详细开发指南请参考 [AGENTS.md](AGENTS.md) 文件。

## 许可证

MIT License
