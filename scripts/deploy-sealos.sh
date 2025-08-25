#!/bin/bash

# Jobs Search 微服务部署脚本 for Sealos

echo "🚀 开始部署 Jobs Search 微服务到 Sealos..."

# 设置变量
NAMESPACE="ns-4dawiaba"  # 替换为你的命名空间
REGISTRY="your-registry.com"  # 替换为你的镜像仓库地址

echo "📦 构建 Docker 镜像..."

# 构建 Node.js API 镜像
echo "构建 Node.js API 服务镜像..."
docker build -t $REGISTRY/jobs-api:latest .
docker push $REGISTRY/jobs-api:latest

# 构建 Python 爬虫镜像
echo "构建 Python 爬虫服务镜像..."
cd scrapers
docker build -t $REGISTRY/jobs-scraper:latest .
docker push $REGISTRY/jobs-scraper:latest
cd ..

echo "🔧 更新 Kubernetes 配置中的镜像地址..."

# 更新镜像地址
sed -i.bak "s|your-registry/jobs-api:latest|$REGISTRY/jobs-api:latest|g" k8s/jobs-api.yaml
sed -i.bak "s|your-registry/jobs-scraper:latest|$REGISTRY/jobs-scraper:latest|g" k8s/jobs-scraper.yaml

echo "🚀 部署到 Sealos..."

# 应用 Secrets
echo "创建 Secrets..."
kubectl apply -f k8s/secrets.yaml -n $NAMESPACE

# 部署 API 服务
echo "部署 Node.js API 服务..."
kubectl apply -f k8s/jobs-api.yaml -n $NAMESPACE

# 部署爬虫服务
echo "部署 Python 爬虫服务..."
kubectl apply -f k8s/jobs-scraper.yaml -n $NAMESPACE

# 应用 Sealos App 配置
echo "创建 Sealos 应用..."
kubectl apply -f sealos/jobs-api-app.yaml
kubectl apply -f sealos/jobs-scraper-app.yaml

echo "⏳ 等待部署完成..."
kubectl wait --for=condition=available --timeout=300s deployment/jobs-api -n $NAMESPACE
kubectl wait --for=condition=available --timeout=300s deployment/jobs-scraper -n $NAMESPACE

echo "✅ 部署完成！"

echo "📋 部署状态："
kubectl get pods -n $NAMESPACE -l app=jobs-api
kubectl get pods -n $NAMESPACE -l app=jobs-scraper

echo "🌐 服务地址："
kubectl get ingress -n $NAMESPACE

echo "📝 查看日志："
echo "  API 服务日志: kubectl logs -f deployment/jobs-api -n $NAMESPACE"
echo "  爬虫服务日志: kubectl logs -f deployment/jobs-scraper -n $NAMESPACE"

echo "🎉 Jobs Search 微服务部署完成！"