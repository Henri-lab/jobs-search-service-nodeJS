# Jobs Search Backend API

基于 Node.js + TypeScript + Express + MongoDB 的招聘信息爬虫和API服务

## 项目特性

- 🚀 **现代技术栈**: TypeScript + Express + MongoDB + Mongoose
- 🔐 **用户认证**: JWT token + bcrypt密码加密
- 🕷️ **智能爬虫**: Python + Selenium + BeautifulSoup4，支持Boss直聘等主流网站
- 🛡️ **安全防护**: Helmet + CORS + Rate Limiting
- 📊 **数据分析**: 职位统计和分析功能
- 🔧 **开发友好**: 完整的错误处理和日志系统
- 🐳 **容器化部署**: Docker + Kubernetes 支持
- ☁️ **多环境配置**: 自动环境检测和配置加载

## 项目结构

```
back/
├── src/                    # TypeScript源码
│   ├── models/            # 数据模型
│   ├── routes/            # 路由定义
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   ├── services/          # 业务服务
│   ├── config/            # 配置文件
│   └── app.ts            # 应用入口
├── scrapers/              # Python爬虫模块
│   ├── src/               # Python源码
│   ├── requirements.txt   # Python依赖
│   └── setup_conda.sh    # conda环境设置
├── k8s/                   # Kubernetes部署配置
├── scripts/               # 工具脚本
├── dist/                  # 编译输出
├── Dockerfile            # Docker构建文件
└── package.json          # Node.js依赖配置
```

## 快速开始

### 1. 安装依赖

```bash
# 安装Node.js依赖
npm install

# 设置Python爬虫环境（可选）
cd scrapers
chmod +x setup_conda.sh
./setup_conda.sh
```

### 2. 环境配置

项目支持多环境自动配置：

```bash
# 本地开发环境
.env.local          # 最高优先级，本地开发专用
.env.development    # 开发环境配置
.env.production     # 生产环境配置
.env               # 默认配置
```

环境变量配置示例：
```bash
# 服务器配置
PORT=3001
NODE_ENV=development

# MongoDB 数据库配置
MONGODB_URI=mongodb://localhost:27017/jobs-search

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 允许的来源域名（CORS）
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### 3. 数据库初始化

```bash
# 初始化测试数据
npm run seed
```

### 4. 启动服务

```bash
# 本地开发模式
npm run dev

# 生产环境
npm run start:prod

# 构建项目
npm run build
```

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 职位接口
- `GET /api/jobs` - 获取职位列表（支持搜索和筛选）
- `GET /api/jobs/:id` - 获取职位详情
- `GET /api/jobs/stats` - 获取职位统计数据

### 爬虫接口
- `POST /api/jobs/scraper/save` - 爬虫保存职位数据
- `POST /api/jobs/scraper/start` - 爬虫开始通知
- `POST /api/jobs/scraper/finish` - 爬虫完成通知
- `POST /api/jobs/scraper/trigger` - 手动触发爬虫

### 健康检查
- `GET /health` - 服务健康状态
- `GET /api` - API文档

## Docker 部署

### 构建镜像

```bash
# 构建 amd64 架构镜像（Sealos/K8s 部署）
docker build --platform linux/amd64 -t henrifox37/jobs-search-backend:sealos .

# 推送镜像到 Docker Hub
docker push henrifox37/jobs-search-backend:sealos

# 构建多架构镜像（可选）
docker buildx build --platform linux/amd64,linux/arm64 -t henrifox37/jobs-search-backend:latest .
```

**一键构建和推送脚本**：
```bash
# 运行部署脚本
./scripts/build-and-push.sh
```

### 运行容器

```bash
# 使用Docker Compose
docker-compose up -d

# 或单独运行
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://localhost:27017/jobs-search \
  -e JWT_SECRET=your_secret_key \
  henrifox37/jobs-search-backend:sealos
```

## Kubernetes 部署

### 部署到Sealos

1. **配置Secrets**：
```bash
kubectl apply -f k8s/secrets.yaml
```

2. **部署API服务**：
```bash
kubectl apply -f k8s/jobs-api.yaml
```

3. **检查部署状态**：
```bash
kubectl get pods -l app=jobs-api
kubectl get services jobs-api-service
```

### 镜像仓库

项目支持多种容器镜像仓库：

- **Docker Hub**: `henrifox37/jobs-search-backend:sealos`

## 爬虫使用

### 手动运行爬虫

```bash
# 激活conda环境
conda activate jobs-scraper

# 运行爬虫
cd scrapers/src
python job_scraper.py
```

### 定时任务

```bash
# 运行调度器（支持定时爬取）
python scheduler.py
```

## 技术栈

### 后端框架
- **Node.js 18** - 运行环境
- **TypeScript** - 类型安全的JavaScript
- **Express.js** - Web应用框架
- **MongoDB** - NoSQL数据库
- **Mongoose** - MongoDB对象建模工具

### 爬虫技术
- **Python 3.11** - 爬虫开发语言
- **Selenium** - 浏览器自动化
- **BeautifulSoup4** - HTML解析
- **requests** - HTTP客户端
- **pandas** - 数据处理

### 安全和工具
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **helmet** - 安全headers
- **CORS** - 跨域资源共享
- **express-rate-limit** - 请求限制
- **Joi** - 数据验证

### 部署工具
- **Docker** - 容器化
- **Kubernetes** - 容器编排
- **esbuild** - 快速构建工具

## 开发指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 RESTful API 设计原则
- 完整的错误处理和日志记录
- 异步操作使用 async/await

### 环境配置优先级
1. `.env.${NODE_ENV}.local` (如：.env.development.local)
2. `.env.local` (所有环境的本地配置)
3. `.env.${NODE_ENV}` (如：.env.development)
4. `.env` (默认配置)

### 数据库设计
- **用户表**: 用户认证和权限管理
- **职位表**: 招聘信息存储，支持全文搜索和索引优化

### 安全考虑
- JWT token 认证
- 密码bcrypt加密
- API请求频率限制
- SQL注入防护
- XSS攻击防护

## 部署架构

```
┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   Python爬虫    │
│   (UniApp)      │    │   (Selenium)    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │ HTTP API             │ 数据推送
          │                      │
┌─────────▼──────────────────────▼───────┐
│         Node.js API 服务               │
│    (Express + TypeScript + JWT)       │
└─────────┬─────────────────────────────┘
          │
          │ MongoDB连接
          │
┌─────────▼─────────────────────────────┐
│         MongoDB 数据库                │
│      (职位数据 + 用户数据)           │
└───────────────────────────────────────┘
```

## 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0  
- **MongoDB**: >= 4.4
- **Python**: >= 3.10 (爬虫服务)
- **Docker**: >= 20.0 (容器部署)

## 许可证

MIT License