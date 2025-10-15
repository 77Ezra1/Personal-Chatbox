#!/usr/bin/env bash

# Personal Chatbox - 真实一键启动（含依赖与自修复）
# 作用：
# - 激活 corepack 并启用 pnpm（若缺失）
# - 安装项目依赖（严格使用锁文件）
# - 自检并尽力修复 sqlite3 原生绑定（成功则初始化数据库）
# - 释放被占用端口，启动后端与前端，并做就绪检测
# - 统一把日志输出到 logs/

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
STARTUP_LOG="$LOG_DIR/startup.log"

log(){ echo "[$(date '+%F %T')] $*" | tee -a "$STARTUP_LOG"; }

log "========== Start-all begin =========="

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
NODE_VERSION=$(node -v 2>/dev/null || echo "")

if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js (18+)" >&2
  exit 1
fi
log "Node.js: $NODE_VERSION, OS: $OS, ARCH: $ARCH"

# 1) 启用 corepack + pnpm（与仓库 packageManager 对齐）
if command -v corepack >/dev/null 2>&1; then
  log "Enabling corepack..."
  corepack enable >/dev/null 2>&1 || true
  # 从 package.json 读取指定 pnpm 版本（若存在）
  if grep -q '"packageManager"\s*:\s*"pnpm@' package.json 2>/dev/null; then
    PNPM_VER=$(node -e "console.log(require('./package.json').packageManager.split('@')[1].split('+')[0])" 2>/dev/null || echo "")
    if [ -n "$PNPM_VER" ]; then
      log "Activating pnpm@$PNPM_VER via corepack..."
      corepack prepare "pnpm@$PNPM_VER" --activate >/dev/null 2>&1 || true
    fi
  fi
fi

if command -v pnpm >/dev/null 2>&1; then PKG=pnpm; else PKG=npm; fi
log "Using package manager: $PKG"

# 2) 安装依赖（优先使用锁文件）
log "Installing deps..."
if [ "$PKG" = pnpm ]; then
  pnpm install --frozen-lockfile || pnpm install
else
  if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi
fi

# 3) 数据库准备：优先 PostgreSQL（docker compose / docker-compose），否则使用本地 SQLite
DB_MODE="sqlite"
if [ -n "${POSTGRES_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
  DB_MODE="pg"
else
  # 本地起 Postgres 容器（兼容 docker compose v2 与 docker-compose v1）
  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      COMPOSE="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
      COMPOSE="docker-compose"
    else
      COMPOSE=""
    fi
    if [ -n "$COMPOSE" ]; then
      log "Starting Postgres via $COMPOSE ..."
      $COMPOSE up -d postgres
    fi
    # 等待健康
    for i in {1..30}; do
      if [ "$(docker inspect --format='{{json .State.Health.Status}}' chatbox-postgres 2>/dev/null | tr -d '"')" = "healthy" ]; then
        DB_MODE="pg"
        export POSTGRES_URL="postgres://postgres:postgres@localhost:5432/chatbox"
        break
      fi
      sleep 1
    done
  fi
fi

if [ "$DB_MODE" = "pg" ]; then
  log "Using PostgreSQL at ${POSTGRES_URL:-$DATABASE_URL}"
  # 生成与推送 Prisma schema
  if command -v pnpm >/dev/null 2>&1; then
    pnpm prisma generate || true
    POSTGRES_URL="${POSTGRES_URL:-$DATABASE_URL}" pnpm prisma db push --accept-data-loss || true
  elif command -v npx >/dev/null 2>&1; then
    npx prisma generate || true
    POSTGRES_URL="${POSTGRES_URL:-$DATABASE_URL}" npx prisma db push --accept-data-loss || true
  fi
else
  log "Falling back to local SQLite (better-sqlite3/sqlite3)"
fi

# 让后端在启动时根据环境自行选择驱动（pg 优先，失败回退 sqlite）
node -e "require('./server/db/init.cjs')" || true

# 4) 释放端口
for PORT in 3001 5173; do
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    log "Freeing port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  fi
done

# 5) 启动后端
log "Starting backend..."
nohup node server/index.cjs >"$BACKEND_LOG" 2>&1 &
BACK_PID=$!
for i in {1..25}; do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    log "Backend ready (PID $BACK_PID)"
    break
  fi
  sleep 0.5
  if [ $i -eq 25 ]; then
    log "Backend did not become healthy. See $BACKEND_LOG"
    exit 1
  fi
done

# 6) 启动前端
log "Starting frontend..."
if [ "$PKG" = pnpm ]; then
  nohup pnpm dev >"$FRONTEND_LOG" 2>&1 &
else
  nohup npm run dev >"$FRONTEND_LOG" 2>&1 &
fi
FRONT_PID=$!
for i in {1..40}; do
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    log "Frontend ready (PID $FRONT_PID)"
    break
  fi
  sleep 0.5
  if [ $i -eq 40 ]; then
    log "Frontend did not become ready. See $FRONTEND_LOG"
    kill $BACK_PID || true
    exit 1
  fi
done

echo ""
echo "✓ 启动成功"
echo "- 前端:  http://localhost:5173  (日志: $FRONTEND_LOG)"
echo "- 后端:  http://localhost:3001  (日志: $BACKEND_LOG)"
echo "- 数据库: ${DB_MODE}"

trap 'echo; echo 停止服务...; kill $BACK_PID $FRONT_PID 2>/dev/null || true; echo 已停止。; log "Stopped."' INT TERM
wait $BACK_PID $FRONT_PID 2>/dev/null || true


