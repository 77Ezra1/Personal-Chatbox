#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

echo "== Personal Chatbox 快速启动 =="

# 选择包管理器（优先 pnpm）
if command -v pnpm >/dev/null 2>&1; then
  PKG=pnpm
elif command -v npm >/dev/null 2>&1; then
  PKG=npm
else
  echo "未检测到 pnpm/npm，请先安装包管理器" >&2
  exit 1
fi

# 安装依赖（如缺失）
if [ ! -d node_modules ]; then
  echo "安装依赖..."
  if [ "$PKG" = pnpm ]; then pnpm install; else npm install; fi
fi

# 释放端口
for PORT in 3001 5173; do
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "释放端口 $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  fi
done

# 启动后端
echo "启动后端 (日志: $BACKEND_LOG) ..."
nohup node server/index.cjs >"$BACKEND_LOG" 2>&1 &
BACK_PID=$!

# 等待后端健康检查
for i in {1..20}; do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    echo "后端已就绪 (PID $BACK_PID)"
    break
  fi
  sleep 0.6
  if [ $i -eq 20 ]; then
    echo "后端启动超时，查看日志: tail -50 $BACKEND_LOG" >&2
    exit 1
  fi
done

# 启动前端
echo "启动前端 (日志: $FRONTEND_LOG) ..."
if [ "$PKG" = pnpm ]; then
  nohup pnpm dev >"$FRONTEND_LOG" 2>&1 &
else
  nohup npm run dev >"$FRONTEND_LOG" 2>&1 &
fi
FRONT_PID=$!

# 等待前端就绪
for i in {1..40}; do
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    echo "前端已就绪 (PID $FRONT_PID)"
    break
  fi
  sleep 0.5
  if [ $i -eq 40 ]; then
    echo "前端启动超时，查看日志: tail -50 $FRONTEND_LOG" >&2
    kill $BACK_PID || true
    exit 1
  fi
done

echo "\n✓ 启动成功"
echo "- 前端:  http://localhost:5173 (日志: $FRONTEND_LOG)"
echo "- 后端:  http://localhost:3001 (日志: $BACKEND_LOG)"
echo "\n按 Ctrl+C 停止，或运行: kill $BACK_PID $FRONT_PID"

trap 'echo; echo 停止服务...; kill $BACK_PID $FRONT_PID 2>/dev/null || true; echo 已停止。' INT TERM
wait $BACK_PID $FRONT_PID 2>/dev/null || true


