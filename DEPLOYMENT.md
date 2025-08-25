# Jobs Search 微服务部署指南

## 架构概览

项目已改造为微服务架构：

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Python 爬虫    │ ──────────────> │   Node.js API   │
│   (jobs-scraper) │                 │   (jobs-api)    │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
    ┌─────────┐                         ┌─────────┐
    │  定时调度  │                         │ MongoDB  │
    │ (CronJob) │                         │ 数据库   │
    └─────────┘                         └─────────┘
```

## 服务说明

### 1. Node.js API 服务 (jobs-api)
- **端口**: 8081
- **功能**: 
  - 提供职位查询API
  - 接收爬虫数据
  - JWT认证
  - 数据统计分析
- **技术栈**: Node.js + TypeScript + Express + MongoDB

### 2. Python 爬虫服务 (jobs-scraper)
- **功能**:
  - 爬取Boss直聘等网站职位信息
  - 通过HTTP API推送数据到Node.js服务
  - 定时任务调度
- **技术栈**: Python + Selenium + BeautifulSoup

## 部署步骤

### 准备工作

1. **确保已安装工具**:
   ```bash
   # Docker
   docker --version
   
   # kubectl (Sealos 环境)
   kubectl version --client
   ```

2. **配置镜像仓库**:
   - 替换 `scripts/deploy-sealos.sh` 中的 `REGISTRY` 变量
   - 替换 `k8s/*.yaml` 文件中的镜像地址

3. **配置环境变量**:
   - 修改 `k8s/secrets.yaml` 中的数据库连接等配置
   - 修改 `k8s/jobs-api.yaml` 中的域名配置

### 自动部署

```bash
# 运行部署脚本
./scripts/deploy-sealos.sh
```

### 手动部署

1. **构建镜像**:
   ```bash
   # API 服务镜像
   docker build -t your-registry/jobs-api:latest .
   docker push your-registry/jobs-api:latest
   
   # 爬虫服务镜像
   cd scrapers
   docker build -t your-registry/jobs-scraper:latest .
   docker push your-registry/jobs-scraper:latest
   ```

2. **部署到 Sealos**:
   ```bash
   # 创建 secrets
   kubectl apply -f k8s/secrets.yaml -n your-namespace
   
   # 部署服务
   kubectl apply -f k8s/jobs-api.yaml -n your-namespace
   kubectl apply -f k8s/jobs-scraper.yaml -n your-namespace
   
   # 创建 Sealos 应用
   kubectl apply -f sealos/jobs-api-app.yaml
   kubectl apply -f sealos/jobs-scraper-app.yaml
   ```

## 配置说明

### 环境变量

#### Node.js API 服务
- `NODE_ENV`: 运行环境 (production)
- `PORT`: 服务端口 (8081)
- `MONGODB_URI`: MongoDB 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `JWT_EXPIRES_IN`: Token 过期时间
- `ALLOWED_ORIGINS`: 允许的CORS源

#### Python 爬虫服务
- `API_BASE_URL`: Node.js API 服务地址
- `API_TOKEN`: API 访问令牌 (可选)

### 资源配置

#### API 服务资源限制
```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi
```

#### 爬虫服务资源限制
```yaml
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi
```

## 监控与维护

### 查看部署状态
```bash
# 查看 Pod 状态
kubectl get pods -n your-namespace

# 查看服务状态
kubectl get services -n your-namespace

# 查看 Ingress
kubectl get ingress -n your-namespace
```

### 查看日志
```bash
# API 服务日志
kubectl logs -f deployment/jobs-api -n your-namespace

# 爬虫服务日志
kubectl logs -f deployment/jobs-scraper -n your-namespace
```

### 健康检查
- API 服务: `GET /health`
- 自动健康检查间隔: 30秒

### 扩缩容
```bash
# 扩展 API 服务实例
kubectl scale deployment jobs-api --replicas=3 -n your-namespace

# 爬虫服务建议保持单实例避免重复爬取
```

## API 接口

### 公开接口
- `GET /api/jobs` - 获取职位列表
- `GET /api/jobs/:id` - 获取职位详情
- `GET /api/jobs/stats` - 获取统计信息

### 爬虫接口 (内部)
- `POST /api/jobs/scraper/save` - 保存职位数据
- `POST /api/jobs/scraper/start` - 爬取开始通知
- `POST /api/jobs/scraper/finish` - 爬取完成通知
- `POST /api/jobs/scraper/trigger` - 手动触发爬取

## 常见问题

### 1. 镜像拉取失败
- 检查镜像仓库访问权限
- 确认镜像标签是否正确

### 2. 服务无法启动
- 检查环境变量配置
- 查看 Pod 日志排查错误

### 3. 数据库连接失败
- 确认 MongoDB 服务状态
- 检查连接字符串配置
- 验证网络连通性

### 4. 爬虫服务异常
- 检查 Chrome 驱动程序
- 确认目标网站访问性
- 查看反爬虫策略影响

## 开发环境

### 本地开发
```bash
# API 服务
npm run dev

# 爬虫服务 (需要先启动 API 服务)
cd scrapers
python src/scheduler.py
```

### 环境变量配置
复制 `.env.example` 为 `.env` 并配置相应值。

## 更新部署

```bash
# 重新构建并推送镜像
./scripts/deploy-sealos.sh

# 或者滚动更新
kubectl rollout restart deployment/jobs-api -n your-namespace
kubectl rollout restart deployment/jobs-scraper -n your-namespace
```