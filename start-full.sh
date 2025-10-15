#!/usr/bin/env bash

# Personal Chatbox - 全量一键启动脚本
# - 自动检测/启用 pnpm
# - 安装依赖（遵循锁文件）
# - 启动 PostgreSQL（docker-compose）或使用外部 POSTGRES_URL
# - 执行 Prisma 生成与迁移（db push/migrate deploy）
# - 释放端口 3001/5173
# - 启动后端与前端，进行健康检查
# - 输出日志路径与访问地址

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
STARTUP_LOG="$LOG_DIR/startup.log"

log(){ echo "[$(date '+%F %T')] $*" | tee -a "$STARTUP_LOG"; }

log "========== start-full begin =========="

# 1) Node & corepack
if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js（>=18），请先安装" >&2; exit 1
fi
if command -v corepack >/dev/null 2>&1; then corepack enable >/dev/null 2>&1 || true; fi

# 2) 包管理器 pnpm/npm
if command -v pnpm >/dev/null 2>&1; then
  PKG=pnpm
else
  PKG=npm
fi
log "package manager: $PKG"

# 3) 安装依赖
log "installing deps..."
if [ "$PKG" = pnpm ]; then
  pnpm install --frozen-lockfile || pnpm install
else
  if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi
fi

# 4) 数据库准备：优先外部/本地 Postgres，其次 docker compose / docker-compose / docker run
DB_URL="${POSTGRES_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      log "starting postgres via docker compose..."
      docker compose up -d postgres || true
    elif command -v docker-compose >/dev/null 2>&1; then
      log "starting postgres via docker-compose..."
      docker-compose up -d postgres || true
    else
      log "compose 未安装，使用 docker run 启动 Postgres 容器..."
      docker rm -f chatbox-postgres >/dev/null 2>&1 || true
      docker run -d --name chatbox-postgres -p 5432:5432 \
        -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=chatbox \
        -v "$ROOT_DIR/data/pg:/var/lib/postgresql/data" postgres:16 || true
    fi
    # 等待健康/端口可用并设置连接串
    for i in {1..60}; do
      STATUS=$(docker inspect --format='{{json .State.Health.Status}}' chatbox-postgres 2>/dev/null | tr -d '"' || true)
      if [ "$STATUS" = "healthy" ] || nc -z localhost 5432 >/dev/null 2>&1; then
        DB_URL="postgres://postgres:postgres@localhost:5432/chatbox"; export POSTGRES_URL="$DB_URL"; break
      fi
      sleep 1
    done
    if [ -z "$DB_URL" ]; then
      log "postgres 容器未就绪，将继续启动（后端可能回退 SQLite），建议检查 docker 日志。"
      DB_URL="postgres://postgres:postgres@localhost:5432/chatbox"; export POSTGRES_URL="$DB_URL"
    fi
  else
    log "未检测到 docker，将回退 SQLite（dev 兜底）"
  fi
else
  export POSTGRES_URL="$DB_URL"
fi

# 5) Prisma 生成 & 推送
if [ -n "${POSTGRES_URL:-}" ]; then
  log "using postgres: $POSTGRES_URL"
  if [ "$PKG" = pnpm ]; then
    pnpm prisma generate || true
    POSTGRES_URL="$POSTGRES_URL" pnpm prisma db push --accept-data-loss || true
  else
    npx prisma generate || true
    POSTGRES_URL="$POSTGRES_URL" npx prisma db push --accept-data-loss || true
  fi
else
  log "no postgres url, backend will fallback to SQLite adapter"
fi

# 6) 释放端口
for PORT in 3001 5173; do
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "freeing port $PORT"; lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  fi
done

# 7) 启动后端
log "starting backend..."
nohup node server/index.cjs >"$BACKEND_LOG" 2>&1 &
BACK_PID=$!
for i in {1..25}; do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    log "backend ready (pid $BACK_PID)"; break
  fi
  sleep 0.5
  if [ $i -eq 25 ]; then log "backend not healthy, see $BACKEND_LOG"; exit 1; fi
done

# 8) 启动前端
log "starting frontend..."
if [ "$PKG" = pnpm ]; then nohup pnpm dev >"$FRONTEND_LOG" 2>&1 & else nohup npm run dev >"$FRONTEND_LOG" 2>&1 & fi
FRONT_PID=$!
for i in {1..40}; do
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    log "frontend ready (pid $FRONT_PID)"; break
  fi
  sleep 0.5
  if [ $i -eq 40 ]; then log "frontend not ready, see $FRONTEND_LOG"; kill $BACK_PID || true; exit 1; fi
done

echo ""
echo "✓ 启动成功"
echo "- 前端:  http://localhost:5173  (日志: $FRONTEND_LOG)"
echo "- 后端:  http://localhost:3001  (日志: $BACKEND_LOG)"
echo "- 数据库: ${POSTGRES_URL:-SQLite}"

trap 'echo; echo 停止服务...; kill $BACK_PID $FRONT_PID 2>/dev/null || true; echo 已停止。' INT TERM
wait $BACK_PID $FRONT_PID 2>/dev/null || true


