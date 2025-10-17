#!/bin/bash
##############################################################################
# 本地开发数据库配置脚本
# 用途: 将项目数据库统一配置为 SQLite (本地开发最佳实践)
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

clear
echo ""
log_info "=========================================="
log_info "  本地开发数据库配置向导"
log_info "=========================================="
echo ""
log_info "此脚本将帮助您:"
log_info "  1. 统一使用 SQLite 数据库 (app.db)"
log_info "  2. 禁用 PostgreSQL 配置"
log_info "  3. 优化数据库性能"
log_info "  4. 清理冗余文件"
echo ""

# 1. 检查环境
log_info "步骤 1/6: 检查环境..."

# 检查 better-sqlite3 是否安装
if ! node -e "require('better-sqlite3')" 2>/dev/null; then
  log_warn "better-sqlite3 未安装或安装失败"
  log_info "尝试重新安装..."
  pnpm install better-sqlite3 || npm install better-sqlite3
fi

log_success "✓ 环境检查完成"
echo ""

# 2. 备份现有数据
log_info "步骤 2/6: 备份现有数据..."

mkdir -p data/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -f "data/app.db" ]; then
  cp data/app.db "data/backups/app_${TIMESTAMP}.db"
  log_success "✓ 备份 app.db → data/backups/app_${TIMESTAMP}.db"
fi

if [ -f "data/chatbox.db" ]; then
  cp data/chatbox.db "data/backups/chatbox_${TIMESTAMP}.db"
  log_info "  备份 chatbox.db → data/backups/chatbox_${TIMESTAMP}.db"
fi

if [ -f "data/database.json" ]; then
  cp data/database.json "data/backups/database_${TIMESTAMP}.json"
  log_info "  备份 database.json → data/backups/database_${TIMESTAMP}.json"
fi

echo ""

# 3. 配置 .env 文件
log_info "步骤 3/6: 配置环境变量..."

if [ ! -f ".env" ]; then
  log_warn ".env 文件不存在,从 .env.example 创建..."
  cp .env.example .env
fi

# 确保 PostgreSQL 配置被注释
if grep -q "^DATABASE_URL=postgresql" .env 2>/dev/null; then
  log_info "  禁用 PostgreSQL 配置..."
  sed -i.bak 's/^DATABASE_URL=postgresql/# DATABASE_URL=postgresql/' .env
  log_success "✓ PostgreSQL 已禁用"
elif grep -q "^POSTGRES_URL=" .env 2>/dev/null; then
  log_info "  禁用 POSTGRES_URL 配置..."
  sed -i.bak 's/^POSTGRES_URL=/# POSTGRES_URL=/' .env
  log_success "✓ POSTGRES_URL 已禁用"
else
  log_success "✓ PostgreSQL 配置已禁用"
fi

# 确保 SQLite 配置存在
if ! grep -q "DATABASE_PATH=" .env 2>/dev/null; then
  echo "" >> .env
  echo "# SQLite 数据库路径 (本地开发)" >> .env
  echo "DATABASE_PATH=./data/app.db" >> .env
  log_success "✓ 添加 SQLite 配置"
else
  log_success "✓ SQLite 配置已存在"
fi

# 确保 NODE_ENV 为 development
if ! grep -q "NODE_ENV=development" .env 2>/dev/null; then
  if grep -q "NODE_ENV=" .env 2>/dev/null; then
    sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=development/' .env
  else
    echo "NODE_ENV=development" >> .env
  fi
  log_success "✓ 设置 NODE_ENV=development"
fi

echo ""

# 4. 统一数据库文件
log_info "步骤 4/6: 统一数据库文件..."

MAIN_DB="data/app.db"

# 确保主数据库存在
if [ ! -f "$MAIN_DB" ]; then
  if [ -f "data/chatbox.db" ]; then
    log_info "  使用 chatbox.db 作为主数据库..."
    cp data/chatbox.db "$MAIN_DB"
  else
    log_info "  创建新的数据库..."
    mkdir -p data
    # 数据库会在第一次启动时自动初始化
    touch "$MAIN_DB"
  fi
fi

log_success "✓ 主数据库: $MAIN_DB"
echo ""

# 5. 优化数据库
log_info "步骤 5/6: 优化数据库..."

if command -v sqlite3 &> /dev/null && [ -f "$MAIN_DB" ]; then
  # 检查数据库大小
  BEFORE_SIZE=$(du -h "$MAIN_DB" | cut -f1)

  # 配置 PRAGMA
  sqlite3 "$MAIN_DB" << 'EOF' 2>/dev/null || true
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA cache_size = -64000;
VACUUM;
EOF

  AFTER_SIZE=$(du -h "$MAIN_DB" | cut -f1)
  log_success "✓ 数据库已优化 ($BEFORE_SIZE → $AFTER_SIZE)"
else
  log_info "  跳过优化 (sqlite3 未安装或数据库不存在)"
fi

echo ""

# 6. 清理冗余文件
log_info "步骤 6/6: 清理冗余文件..."

# 删除空的 database.db
if [ -f "data/database.db" ]; then
  SIZE=$(stat -f%z "data/database.db" 2>/dev/null || stat -c%s "data/database.db" 2>/dev/null || echo "0")
  if [ "$SIZE" -eq 0 ]; then
    rm -f "data/database.db"
    log_info "  删除空文件: database.db"
  fi
fi

# 提示用户是否删除 chatbox.db
if [ -f "data/chatbox.db" ] && [ -f "$MAIN_DB" ]; then
  log_warn "  发现旧数据库 chatbox.db"
  log_warn "  如果确认不需要,可以手动删除: rm data/chatbox.db"
fi

log_success "✓ 清理完成"
echo ""

# 7. 显示配置摘要
log_info "=========================================="
log_success "配置完成!"
log_info "=========================================="
echo ""

log_info "当前配置:"
echo "  ✓ 数据库类型: SQLite (better-sqlite3)"
echo "  ✓ 数据库文件: $MAIN_DB"
echo "  ✓ PostgreSQL: 已禁用"
echo "  ✓ 运行模式: development"
echo ""

if [ -f "$MAIN_DB" ]; then
  DB_SIZE=$(du -h "$MAIN_DB" | cut -f1)
  echo "  数据库大小: $DB_SIZE"

  if command -v sqlite3 &> /dev/null; then
    TABLE_COUNT=$(sqlite3 "$MAIN_DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "N/A")
    echo "  表数量: $TABLE_COUNT"
  fi
fi

echo ""
log_info "下一步操作:"
echo "  1. 启动开发服务器:"
echo "     bash start-dev.sh"
echo ""
echo "  2. 或手动启动:"
echo "     NODE_ENV=development node server/index.cjs"
echo ""
echo "  3. 优化数据库 (可选):"
echo "     bash scripts/optimize-sqlite-db.sh"
echo ""

log_success "✅ 本地开发环境已就绪!"
