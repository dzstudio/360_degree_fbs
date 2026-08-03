#!/bin/bash
# 服务器端部署/重建脚本
#
# -- 初次部署 --
#   1. cd /var/data/360_degree_fbs
#   2. git clone https://github.com/dzstudio/360_degree_fbs.git .
#   3. chmod +x rebuild.sh
#   4. ./rebuild.sh
#
# -- 后续更新 --
#   git pull && ./rebuild.sh
#
set -e

echo "=== 拉取最新代码 ==="
git pull

echo ""
echo "=== 创建数据目录 ==="
mkdir -p data uploads logs

echo ""
echo "=== 构建并重启容器 ==="
docker compose up -d --build

echo ""
echo "=== 等待服务启动 ==="
sleep 5

echo ""
echo "=== 检查服务状态 ==="
docker compose ps

echo ""
echo "=== 完成 ==="
echo "服务地址: http://localhost:5176"
echo ""
echo "默认管理员账号: admin"
echo "默认管理员密码: 12345678"