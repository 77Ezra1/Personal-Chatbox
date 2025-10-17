#!/bin/bash
##############################################################################
# SQLite 数据库优化脚本
# 用途: 优化本地开发数据库,减少文件大小,提升性能
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
DATA_DIR="$PROJECT_ROOT/data"

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

# 检查 sqlite3 是否安装
if ! command -v sqlite3 &> /dev/null; then
  log_error "sqlite3 not found. Please install SQLite3 first."
  exit 1
fi

cd "$DATA_DIR"

log_info "=========================================="
log_info "  SQLite 数据库优化工具"
log_info "=========================================="
echo ""

# 1. 统一主数据库为 app.db
MAIN_DB="app.db"

if [ ! -f "$MAIN_DB" ]; then
  log_error "主数据库 $MAIN_DB 不存在!"
  exit 1
fi

log_info "主数据库: $MAIN_DB"
BEFORE_SIZE=$(du -h "$MAIN_DB" | cut -f1)
log_info "优化前大小: $BEFORE_SIZE"
echo ""

# 2. 检查数据库完整性
log_info "步骤 1/5: 检查数据库完整性..."
INTEGRITY_CHECK=$(sqlite3 "$MAIN_DB" "PRAGMA integrity_check;")

if [ "$INTEGRITY_CHECK" != "ok" ]; then
  log_error "数据库完整性检查失败: $INTEGRITY_CHECK"
  exit 1
fi
log_success "✓ 数据库完整性正常"
echo ""

# 3. 显示数据库统计信息
log_info "步骤 2/5: 数据库统计..."
sqlite3 "$MAIN_DB" << 'EOF'
.mode column
.headers on
SELECT
  name as '表名',
  (SELECT COUNT(*) FROM sqlite_master sm WHERE sm.tbl_name = m.name) as '记录数'
FROM sqlite_master m
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name;
EOF
echo ""

# 4. 优化数据库
log_info "步骤 3/5: 优化数据库..."

# 4.1 开启WAL模式 (Write-Ahead Logging)
log_info "  - 配置 WAL 模式..."
sqlite3 "$MAIN_DB" << 'EOF'
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
EOF

# 4.2 分析数据库
log_info "  - 分析查询优化器统计..."
sqlite3 "$MAIN_DB" "ANALYZE;"

# 4.3 清理和压缩
log_info "  - 清理和压缩数据库..."
sqlite3 "$MAIN_DB" "VACUUM;"

log_success "✓ 数据库优化完成"
echo ""

# 5. 处理 WAL 文件
log_info "步骤 4/5: 处理 WAL 文件..."
if [ -f "${MAIN_DB}-wal" ]; then
  WAL_SIZE=$(du -h "${MAIN_DB}-wal" | cut -f1)
  log_info "WAL 文件大小: $WAL_SIZE"

  # Checkpoint WAL to main database
  sqlite3 "$MAIN_DB" "PRAGMA wal_checkpoint(TRUNCATE);"
  log_success "✓ WAL 文件已合并到主数据库"
else
  log_info "没有 WAL 文件"
fi
echo ""

# 6. 清理其他数据库文件
log_info "步骤 5/5: 清理冗余文件..."

# 移除空的 database.db
if [ -f "database.db" ]; then
  SIZE=$(stat -f%z "database.db" 2>/dev/null || stat -c%s "database.db" 2>/dev/null || echo "0")
  if [ "$SIZE" -eq 0 ]; then
    rm -f "database.db"
    log_info "  - 删除空文件: database.db"
  fi
fi

# 检查 chatbox.db 是否需要保留
if [ -f "chatbox.db" ]; then
  log_warn "  - 发现 chatbox.db (可能是旧版本数据库)"
  log_warn "    如果不需要,可以手动删除: rm data/chatbox.db"
fi

log_success "✓ 清理完成"
echo ""

# 7. 显示最终结果
AFTER_SIZE=$(du -h "$MAIN_DB" | cut -f1)
log_info "=========================================="
log_success "优化完成!"
log_info "=========================================="
log_info "优化前: $BEFORE_SIZE"
log_info "优化后: $AFTER_SIZE"
echo ""

# 8. 验证数据库
log_info "验证优化后的数据库..."
TABLES_COUNT=$(sqlite3 "$MAIN_DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
log_success "✓ 数据库包含 $TABLES_COUNT 个表"

# 9. 显示配置建议
echo ""
log_info "=========================================="
log_info "  本地开发环境配置建议"
log_info "=========================================="
echo ""
cat << 'EOF'
1. 确保 .env 文件配置:
   DATABASE_PATH=./data/app.db
   # DATABASE_URL=postgresql://... (保持注释)

2. 如果使用 better-sqlite3,项目会自动使用 app.db

3. 数据库已优化为 WAL 模式:
   - 更好的并发性能
   - 更快的写入速度
   - 适合本地开发

4. 建议定期运行此脚本优化数据库:
   bash scripts/optimize-sqlite-db.sh
EOF
echo ""

log_success "✅ 所有操作完成!"
