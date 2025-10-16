# 股票回测决策系统 - 部署和运维指南

## 1. 部署架构总览

### 1.1 环境规划

#### 开发环境

- **目的**: 功能开发和测试
- **部署方式**: 单机 Docker Compose
- **数据**: 测试数据，可重置
- **访问**: 本地网络访问

#### 测试环境

- **目的**: 集成测试和预发布验证
- **部署方式**: 容器化部署
- **数据**: 模拟生产环境数据
- **访问**: 内网访问

#### 生产环境

- **目的**: 线上服务
- **部署方式**: 多节点集群部署
- **数据**: 真实业务数据
- **访问**: 公网访问，HTTPS 加密

### 1.2 基础设施要求

#### 硬件要求

| 组件 | 开发环境 | 测试环境 | 生产环境       |
| ---- | -------- | -------- | -------------- |
| CPU  | 4 核心   | 8 核心   | 16 核心+       |
| 内存 | 8GB      | 16GB     | 32GB+          |
| 存储 | 50GB     | 100GB    | 500GB+         |
| 网络 | 100Mbps  | 1Gbps    | 多线路负载均衡 |

#### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **数据库**: PostgreSQL 13+
- **缓存**: Redis 6+

## 2. 容器化部署

### 2.1 Docker 镜像构建

#### 2.1.1 后端 Dockerfile

```dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2.1.2 前端 Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

### 2.2 Docker Compose 配置

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: stock_system
      POSTGRES_USER: stock_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stock_user -d stock_system"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://stock_user:${DB_PASSWORD}@postgres:5432/stock_system
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+asyncpg://stock_user:${DB_PASSWORD}@postgres:5432/stock_system
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: celery -A app.celery worker --loglevel=info

  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+asyncpg://stock_user:${DB_PASSWORD}@postgres:5432/stock_system
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: celery -A app.celery beat --loglevel=info

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 2.3 环境变量配置

创建 `.env` 文件:

```bash
# 数据库配置
DB_PASSWORD=your_secure_password

# Redis配置
REDIS_PASSWORD=your_redis_password

# 应用配置
SECRET_KEY=your_secret_key
DEBUG=false
ENVIRONMENT=production

# 外部API配置
STOCK_DATA_API_KEY=your_api_key
STOCK_DATA_BASE_URL=https://api.example.com

# 监控配置
PROMETHEUS_MULTIPROC_DIR=/tmp
```

## 3. 生产环境部署

### 3.1 Kubernetes 部署配置

#### 3.1.1 后端 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stock-trading-api
  labels:
    app: stock-trading-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stock-trading-api
  template:
    metadata:
      labels:
        app: stock-trading-api
    spec:
      containers:
        - name: api
          image: your-registry/stock-trading-api:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: redis-url
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### 3.1.2 服务配置

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stock-trading-api
spec:
  selector:
    app: stock-trading-api
  ports:
    - port: 8000
      targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stock-trading-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: api.stock-trading.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: stock-trading-api
                port:
                  number: 8000
```

### 3.2 数据库高可用配置

#### 3.2.1 PostgreSQL 集群

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:13
          env:
            - name: POSTGRES_DB
              value: stock_system
            - name: POSTGRES_USER
              value: stock_user
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1"
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
```

## 4. 监控和日志

### 4.1 Prometheus 监控配置

#### 4.1.1 应用指标收集

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
    - job_name: 'stock-trading-api'
      static_configs:
      - targets: ['stock-trading-api:8000']
      metrics_path: /metrics
      scrape_interval: 10s
      
    - job_name: 'celery-workers'
      static_configs:
      - targets: ['celery-exporter:8000']
      scrape_interval: 10s
      
    - job_name: 'postgres'
      static_configs:
      - targets: ['postgres-exporter:9187']
      scrape_interval: 30s
      
    - job_name: 'redis'
      static_configs:
      - targets: ['redis-exporter:9121']
      scrape_interval: 30s
```

#### 4.1.2 Grafana 仪表板

```json
{
  "dashboard": {
    "title": "股票回测决策系统监控",
    "panels": [
      {
        "title": "API请求率",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "请求率"
          }
        ]
      },
      {
        "title": "模型执行时间",
        "type": "heatmap",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(model_execution_duration_seconds_bucket[5m]))",
            "legendFormat": "95分位执行时间"
          }
        ]
      }
    ]
  }
}
```

### 4.2 日志收集配置

#### 4.2.1 ELK Stack 配置

```yaml
# Filebeat配置
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
  - add_docker_metadata:
      host: "unix:///var/run/docker.sock"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  indices:
    - index: "stock-trading-logs-%{+yyyy.MM.dd}"

# Logstash配置
input {
  beats {
    port => 5044
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:loglevel} %{GREEDYDATA:message}" }
  }
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "stock-trading-logs-%{+YYYY.MM.dd}"
  }
}
```

## 5. 备份和恢复

### 5.1 数据库备份策略

#### 5.1.1 自动备份脚本

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="stock_system_${DATE}.sql"

# 创建全量备份
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d stock_system > ${BACKUP_DIR}/${BACKUP_FILE}

# 压缩备份文件
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# 保留最近7天的备份
find ${BACKUP_DIR} -name "stock_system_*.sql.gz" -mtime +7 -delete

# 上传到云存储
aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE}.gz s3://your-backup-bucket/postgres/
```

#### 5.1.2 Kubernetes CronJob 备份

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *" # 每天凌晨2点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:13
              command:
                - /bin/bash
                - -c
                - |
                  pg_dump -h postgres -U $POSTGRES_USER -d stock_system | \
                  gzip > /backup/stock_system_$(date +%Y%m%d_%H%M%S).sql.gz
              env:
                - name: POSTGRES_USER
                  valueFrom:
                    secretKeyRef:
                      name: postgres-secret
                      key: username
                - name: POSTGRES_PASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-secret
                      key: password
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
          volumes:
            - name: backup-volume
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

### 5.2 数据恢复流程

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 停止应用服务
kubectl scale deployment stock-trading-api --replicas=0

# 恢复数据库
gunzip -c $BACKUP_FILE | psql -h $POSTGRES_HOST -U $POSTGRES_USER -d stock_system

# 重启应用服务
kubectl scale deployment stock-trading-api --replicas=3

echo "数据库恢复完成"
```

## 6. 安全配置

### 6.1 网络安全

#### 6.1.1 网络策略

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: stock-trading-network-policy
spec:
  podSelector:
    matchLabels:
      app: stock-trading
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
      ports:
        - protocol: TCP
          port: 8000
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8
      ports:
        - protocol: TCP
          port: 5432
        - protocol: TCP
          port: 6380
```

#### 6.1.2 TLS 证书配置

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: stock-trading-tls
spec:
  secretName: stock-trading-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: api.stock-trading.example.com
  dnsNames:
    - api.stock-trading.example.com
    - app.stock-trading.example.com
```

### 6.2 访问控制

#### 6.2.1 RBAC 配置

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: stock-trading
  name: app-role
rules:
  - apiGroups: [""]
    resources:
```
