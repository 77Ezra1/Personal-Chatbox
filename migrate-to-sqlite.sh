#!/bin/bash

# 数据库迁移脚本: JSON -> SQLite
# 使用 sqlite3 命令行工具和 jq 处理 JSON

set -e  # 遇到错误立即退出

JSON_DB="data/database.json"
SQLITE_DB="data/app.db"
BACKUP_DB="data/app.db.backup-$(date +%Y%m%d-%H%M%S)"

echo "============================================================"
echo "数据库迁移工具: JSON -> SQLite"
echo "============================================================"

# 1. 备份现有数据库
if [ -f "$SQLITE_DB" ]; then
    echo ""
    echo "📦 备份现有 SQLite 数据库..."
    cp "$SQLITE_DB" "$BACKUP_DB"
    echo "   备份到: $BACKUP_DB"
    rm -f "$SQLITE_DB"
    rm -f "${SQLITE_DB}-shm"
    rm -f "${SQLITE_DB}-wal"
    echo "   ✓ 已删除旧数据库"
fi

# 2. 读取 JSON 数据统计
echo ""
echo "📖 读取 JSON 数据库..."
USER_COUNT=$(cat "$JSON_DB" | jq '.users | length')
NOTE_COUNT=$(cat "$JSON_DB" | jq '.notes | length')
CATEGORY_COUNT=$(cat "$JSON_DB" | jq '.note_categories | length')
CONV_COUNT=$(cat "$JSON_DB" | jq '.conversations | length // 0')
MSG_COUNT=$(cat "$JSON_DB" | jq '.messages | length // 0')
SESSION_COUNT=$(cat "$JSON_DB" | jq '.sessions | length // 0')
LOGIN_HISTORY_COUNT=$(cat "$JSON_DB" | jq '.login_history | length // 0')
INVITE_CODE_COUNT=$(cat "$JSON_DB" | jq '.invite_codes | length // 0')
OAUTH_COUNT=$(cat "$JSON_DB" | jq '.oauth_accounts | length // 0')
AGENT_COUNT=$(cat "$JSON_DB" | jq '.agents | length // 0')
USER_CONFIG_COUNT=$(cat "$JSON_DB" | jq '.user_configs | length // 0')
MCP_CONFIG_COUNT=$(cat "$JSON_DB" | jq '.user_mcp_configs | length // 0')

echo "   - 用户数: $USER_COUNT"
echo "   - 笔记数: $NOTE_COUNT"
echo "   - 分类数: $CATEGORY_COUNT"
echo "   - 会话数: $CONV_COUNT"
echo "   - 消息数: $MSG_COUNT"
echo "   - Session令牌: $SESSION_COUNT"
echo "   - 登录历史: $LOGIN_HISTORY_COUNT"
echo "   - 邀请码: $INVITE_CODE_COUNT"
echo "   - OAuth账户: $OAUTH_COUNT"
echo "   - AI代理: $AGENT_COUNT"
echo "   - 用户配置: $USER_CONFIG_COUNT"
echo "   - MCP配置: $MCP_CONFIG_COUNT"

# 3. 创建数据库和表结构
echo ""
echo "🔨 创建 SQLite 数据库..."

sqlite3 "$SQLITE_DB" <<EOF
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  timezone TEXT DEFAULT 'Asia/Shanghai',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 笔记表
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 笔记分类表
CREATE TABLE IF NOT EXISTS note_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 笔记标签表
CREATE TABLE IF NOT EXISTS note_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 会话表
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  model TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  data TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
EOF

echo "   ✓ 表结构创建完成"

# 4. 迁移用户数据
echo ""
echo "📥 迁移数据..."

cat "$JSON_DB" | jq -r '.users[] | [.id, .username, .password, .email // "", .avatar // "", .role // "user", .timezone // "Asia/Shanghai", .created_at // (now | todate), .updated_at // .created_at // (now | todate)] | @tsv' | while IFS=$'\t' read -r id username password email avatar role timezone created_at updated_at; do
    sqlite3 "$SQLITE_DB" "INSERT INTO users (id, username, password, email, avatar, role, timezone, created_at, updated_at) VALUES ($id, '$username', '$password', '$email', '$avatar', '$role', '$timezone', '$created_at', '$updated_at');"
done 2>/dev/null || true

MIGRATED_USERS=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM users;")
echo "   ✓ 迁移了 $MIGRATED_USERS 个用户"

# 5. 迁移笔记分类
cat "$JSON_DB" | jq -r '.note_categories[] | [.id, .user_id, .name, .color // "#6366f1", .created_at // (now | todate)] | @tsv' | while IFS=$'\t' read -r id user_id name color created_at; do
    # 转义单引号
    name_escaped=$(echo "$name" | sed "s/'/''/g")
    sqlite3 "$SQLITE_DB" "INSERT INTO note_categories (id, user_id, name, color, created_at) VALUES ($id, $user_id, '$name_escaped', '$color', '$created_at');"
done 2>/dev/null || true

MIGRATED_CATEGORIES=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM note_categories;")
echo "   ✓ 迁移了 $MIGRATED_CATEGORIES 个分类"

# 6. 迁移笔记
cat "$JSON_DB" | jq -c '.notes[]' | while read -r note; do
    id=$(echo "$note" | jq -r '.id')
    user_id=$(echo "$note" | jq -r '.user_id')
    title=$(echo "$note" | jq -r '.title // "Untitled"' | sed "s/'/''/g")
    content=$(echo "$note" | jq -r '.content // ""' | sed "s/'/''/g")
    category=$(echo "$note" | jq -r '.category // "default"' | sed "s/'/''/g")
    tags=$(echo "$note" | jq -r '.tags // "[]"' | sed "s/'/''/g")
    is_favorite=$(echo "$note" | jq -r 'if .is_favorite then 1 else 0 end')
    is_archived=$(echo "$note" | jq -r 'if .is_archived then 1 else 0 end')
    created_at=$(echo "$note" | jq -r '.created_at // (now | todate)')
    updated_at=$(echo "$note" | jq -r '.updated_at // .created_at // (now | todate)')
    
    sqlite3 "$SQLITE_DB" "INSERT INTO notes (id, user_id, title, content, category, tags, is_favorite, is_archived, created_at, updated_at) VALUES ($id, $user_id, '$title', '$content', '$category', '$tags', $is_favorite, $is_archived, '$created_at', '$updated_at');"
done 2>/dev/null || true

MIGRATED_NOTES=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM notes;")
echo "   ✓ 迁移了 $MIGRATED_NOTES 条笔记"

# 7. 验证迁移结果
echo ""
echo "✅ 验证迁移结果..."
FINAL_USER_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM users;")
FINAL_NOTE_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM notes;")
FINAL_CATEGORY_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM note_categories;")

echo "   - 用户: $FINAL_USER_COUNT (预期: $USER_COUNT)"
echo "   - 笔记: $FINAL_NOTE_COUNT (预期: $NOTE_COUNT)"
echo "   - 分类: $FINAL_CATEGORY_COUNT (预期: $CATEGORY_COUNT)"

# 显示示例笔记
echo ""
echo "📝 示例笔记数据:"
sqlite3 "$SQLITE_DB" "SELECT '   ID: ' || id || CHAR(10) || '   标题: ' || title || CHAR(10) || '   分类: ' || category || CHAR(10) || '   标签: ' || tags || CHAR(10) || '   创建时间: ' || created_at || CHAR(10) || '   更新时间: ' || updated_at FROM notes LIMIT 1;"

echo ""
echo "============================================================"
echo "✨ 迁移完成！"
echo "============================================================"
echo ""
echo "下一步:"
echo "1. 重启后端服务: ./start.sh"
echo "2. 刷新浏览器，验证数据是否正常显示"
echo "3. 如果有问题，可以从备份恢复:"
echo "   cp $BACKUP_DB $SQLITE_DB"
echo ""
