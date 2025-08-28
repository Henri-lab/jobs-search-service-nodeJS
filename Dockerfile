# 构建阶段
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY src/ ./src/
COPY tsconfig.json ./

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 更改文件所有权
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV PORT=3001

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# 启动应用
CMD ["node", "dist/app.js"]