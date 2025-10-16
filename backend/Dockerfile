FROM python:3.11-slim as builder

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装依赖到临时目录
RUN pip install --user --no-cache-dir -r requirements.txt

# 最终阶段
FROM python:3.11-slim

WORKDIR /app

# 设置Python路径，包含src目录
ENV PYTHONPATH=/app/src
ENV PATH=/root/.local/bin:$PATH

# 从构建阶段复制已安装的包
COPY --from=builder /root/.local /root/.local

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 8000

# 启动命令 - 使用正确的模块路径
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--app-dir", "src"]