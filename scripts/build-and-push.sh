#!/bin/bash

# 构建和推送 Docker 镜像脚本
# 用于快速构建 amd64 架构镜像并推送到 Docker Hub

set -e  # 遇到错误立即退出

echo "🚀 开始构建 Docker 镜像..."

# 镜像信息
IMAGE_NAME="henrifox37/jobs-search-backend"
TAG="sealos"
FULL_IMAGE="${IMAGE_NAME}:${TAG}"

# 构建镜像
echo "📦 构建 amd64 架构镜像: ${FULL_IMAGE}"
cd ..
docker build --platform linux/amd64 -t "${FULL_IMAGE}" .

if [ $? -eq 0 ]; then
    echo "✅ 镜像构建成功!"
else
    echo "❌ 镜像构建失败!"
    exit 1
fi

# 推送镜像
echo "📤 推送镜像到 Docker Hub..."
docker push "${FULL_IMAGE}"

if [ $? -eq 0 ]; then
    echo "✅ 镜像推送成功!"
    echo "🎉 部署完成! 镜像: ${FULL_IMAGE}"
    
    # 显示镜像信息
    echo ""
    echo "📋 镜像详情:"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.ImageID}}\t{{.CreatedAt}}\t{{.Size}}"
else
    echo "❌ 镜像推送失败!"
    exit 1
fi