#!/bin/bash
##############################################################################
# 清理旧数据库文件脚本
# 用途: 清理冗余的数据库文件,保持data目录整洁
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/data"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

echo ""
log_info "=========================================="
log_info "  数据库文件清理工具"
log_info "=========================================="
echo ""

# 主数据库文件
MAIN_DB="app.db"

if [ ! -f "$MAIN_DB" ]; then
  log_warn "主数据库 $MAIN_DB 不存在!"
  exit 1
fi

log_info "保留主数据库: $MAIN_DB ($(du -h $MAIN_DB | cut -f1))"
echo ""

# 统计要清理的文件
TO_CLEAN=()

# 检查 chatbox.db
if [ -f "chatbox.db" ]; then
  TO_CLEAN+=("chatbox.db ($(du -h chatbox.db | cut -f1)) - 旧版本数据库")
fi

# 检查空的 database.db
if [ -f "database.db" ]; then
  SIZE=$(stat -f%z "database.db" 2>/dev/null || stat -c%s "database.db" 2>/dev/null || echo "0")
  if [ "$SIZE" -eq 0 ]; then
    TO_CLEAN+=("database.db (空文件)")
  fi
fi

# 检查 WAL 文件 (如果很大的话可以checkpoint)
if [ -f "${MAIN_DB}-wal" ]; then
  WAL_SIZE=$(du -k "${MAIN_DB}-wal" | cut -f1)
  if [ "$WAL_SIZE" -gt 10240 ]; then  # > 10MB
    log_warn "WAL 文件很大: $(du -h ${MAIN_DB}-wal | cut -f1)"
    log_info "建议运行: bash scripts/optimize-sqlite-db.sh"
  fi
fi

# 显示要清理的文件
if [ ${#TO_CLEAN[@]} -eq 0 ]; then
  log_success "✓ 没有需要清理的文件"
  exit 0
fi

log_warn "发现以下文件可以清理:"
for file in "${TO_CLEAN[@]}"; do
  echo "  - $file"
done
echo ""

# 询问用户确认
read -p "是否删除这些文件? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log_info "已取消"
  exit 0
fi

echo ""
log_info "开始清理..."

# 删除文件
CLEANED_COUNT=0

if [ -f "chatbox.db" ]; then
  rm -f chatbox.db
  log_success "✓ 删除: chatbox.db"
  CLEANED_COUNT=$((CLEANED_COUNT + 1))
fi

if [ -f "database.db" ]; then
  SIZE=$(stat -f%z "database.db" 2>/dev/null || stat -c%s "database.db" 2>/dev/null || echo "0")
  if [ "$SIZE" -eq 0 ]; then
    rm -f database.db
    log_success "✓ 删除: database.db"
    CLEANED_COUNT=$((CLEANED_COUNT + 1))
  fi
fi

echo ""
log_success "✅ 清理完成! 删除了 $CLEANED_COUNT 个文件"
echo ""

log_info "当前数据库文件:"
ls -lh *.db *.json 2>/dev/null | awk '{print "  " $9, "(" $5 ")"}'
