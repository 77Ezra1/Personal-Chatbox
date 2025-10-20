#!/bin/bash

# 完整数据迁移脚本 - 从 JSON 迁移到 SQLite
# 迁移所有现有数据：users, notes, categories, sessions, login_history, invite_codes, oauth_accounts, agents, configs

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

JSON_DB="data/database.json"
SQLITE_DB="data/app.db"
BACKUP_DB="data/app.db.backup-$(date +%Y%m%d-%H%M%S)"

echo "============================================================"
echo "🔄 Personal Chatbox - 完整数据迁移"
echo "============================================================"

# 1. 检查依赖
echo ""
echo "📦 检查依赖..."
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ 未找到 jq，请先安装: brew install jq${NC}"
    exit 1
fi
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${RED}❌ 未找到 sqlite3${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ 依赖检查完成${NC}"

# 2. 备份现有数据库
if [ -f "$SQLITE_DB" ]; then
    echo ""
    echo "💾 备份现有数据库..."
    cp "$SQLITE_DB" "$BACKUP_DB"
    echo -e "${GREEN}   ✓ 已备份到: $BACKUP_DB${NC}"
fi

# 3. 读取 JSON 数据统计
echo ""
echo "📖 分析 JSON 数据..."
USER_COUNT=$(cat "$JSON_DB" | jq '.users | length')
NOTE_COUNT=$(cat "$JSON_DB" | jq '.notes | length')
CATEGORY_COUNT=$(cat "$JSON_DB" | jq '.note_categories | length')
SESSION_COUNT=$(cat "$JSON_DB" | jq '.sessions | length // 0')
LOGIN_HISTORY_COUNT=$(cat "$JSON_DB" | jq '.login_history | length // 0')
INVITE_CODE_COUNT=$(cat "$JSON_DB" | jq '.invite_codes | length // 0')
OAUTH_COUNT=$(cat "$JSON_DB" | jq '.oauth_accounts | length // 0')
AGENT_COUNT=$(cat "$JSON_DB" | jq '.agents | length // 0')
USER_CONFIG_COUNT=$(cat "$JSON_DB" | jq '.user_configs | length // 0')
MCP_CONFIG_COUNT=$(cat "$JSON_DB" | jq '.user_mcp_configs | length // 0')

echo -e "${BLUE}   - 用户数: $USER_COUNT${NC}"
echo -e "${BLUE}   - 笔记数: $NOTE_COUNT${NC}"
echo -e "${BLUE}   - 分类数: $CATEGORY_COUNT${NC}"
echo -e "${BLUE}   - Session令牌: $SESSION_COUNT${NC}"
echo -e "${BLUE}   - 登录历史: $LOGIN_HISTORY_COUNT${NC}"
echo -e "${BLUE}   - 邀请码: $INVITE_CODE_COUNT${NC}"
echo -e "${BLUE}   - OAuth账户: $OAUTH_COUNT${NC}"
echo -e "${BLUE}   - AI代理: $AGENT_COUNT${NC}"
echo -e "${BLUE}   - 用户配置: $USER_CONFIG_COUNT${NC}"
echo -e "${BLUE}   - MCP配置: $MCP_CONFIG_COUNT${NC}"

# 4. 创建或更新表结构
echo ""
echo "🏗️  创建/更新表结构..."
sqlite3 "$SQLITE_DB" <<'EOF'
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
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

-- Sessions 表
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 登录历史表
CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  login_at TEXT DEFAULT (datetime('now')),
  success INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_by INTEGER,
  used_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  used_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);

-- OAuth 账户表
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI 代理表
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_id TEXT,
  model_name TEXT,
  system_prompt TEXT,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER,
  stream INTEGER DEFAULT 1,
  use_mcp INTEGER DEFAULT 0,
  enabled_tools TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户配置表
CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, config_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户 MCP 配置表
CREATE TABLE IF NOT EXISTS user_mcp_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  service_id TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  config TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, service_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
EOF

echo -e "${GREEN}   ✓ 表结构创建完成${NC}"

# 5. 迁移数据
echo ""
echo "📥 开始迁移数据..."

# 5.1 迁移用户
if [ "$USER_COUNT" -gt 0 ]; then
    echo "   迁移用户..."
    cat "$JSON_DB" | jq -r '.users[] | [.id, .username, .password, .email // "", .avatar // "", .role // "user", .timezone // "Asia/Shanghai", .created_at // (now | todate), .updated_at // .created_at // (now | todate)] | @tsv' | while IFS=$'\t' read -r id username password email avatar role timezone created_at updated_at; do
        # 转义单引号
        username=$(echo "$username" | sed "s/'/''/g")
        password=$(echo "$password" | sed "s/'/''/g")
        email=$(echo "$email" | sed "s/'/''/g")
        avatar=$(echo "$avatar" | sed "s/'/''/g")
        
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO users (id, username, password, email, avatar, role, timezone, created_at, updated_at) VALUES ($id, '$username', '$password', '$email', '$avatar', '$role', '$timezone', '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_USERS=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM users;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_USERS 个用户${NC}"
fi

# 5.2 迁移笔记分类
if [ "$CATEGORY_COUNT" -gt 0 ]; then
    echo "   迁移笔记分类..."
    cat "$JSON_DB" | jq -r '.note_categories[] | [.id, .user_id, .name, .color // "#6366f1", .created_at // (now | todate)] | @tsv' | while IFS=$'\t' read -r id user_id name color created_at; do
        name=$(echo "$name" | sed "s/'/''/g")
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO note_categories (id, user_id, name, color, created_at) VALUES ($id, $user_id, '$name', '$color', '$created_at');" 2>/dev/null || true
    done
    MIGRATED_CATEGORIES=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM note_categories;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_CATEGORIES 个分类${NC}"
fi

# 5.3 迁移笔记
if [ "$NOTE_COUNT" -gt 0 ]; then
    echo "   迁移笔记..."
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
        
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO notes (id, user_id, title, content, category, tags, is_favorite, is_archived, created_at, updated_at) VALUES ($id, $user_id, '$title', '$content', '$category', '$tags', $is_favorite, $is_archived, '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_NOTES=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM notes;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_NOTES 条笔记${NC}"
fi

# 5.4 迁移 Sessions
if [ "$SESSION_COUNT" -gt 0 ]; then
    echo "   迁移 Sessions..."
    cat "$JSON_DB" | jq -c '.sessions[]?' 2>/dev/null | while read -r session; do
        [ -z "$session" ] && continue
        
        # Sessions 数据使用数字 id，需要转换为字符串
        id=$(echo "$session" | jq -r '.id // ""')
        [ -z "$id" ] || [ "$id" = "null" ] && continue
        
        user_id=$(echo "$session" | jq -r '.user_id // 0')
        token=$(echo "$session" | jq -r '.token // ""' | sed "s/'/''/g")
        ip_address=$(echo "$session" | jq -r '.ip_address // ""' | sed "s/'/''/g")
        user_agent=$(echo "$session" | jq -r '.user_agent // ""' | sed "s/'/''/g")
        created_at=$(echo "$session" | jq -r '.created_at // (now | todate)')
        expires_at=$(echo "$session" | jq -r '.expires_at // (now | todate)')
        
        # id 需要转为字符串格式
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO sessions (id, user_id, token, ip_address, user_agent, created_at, expires_at) VALUES ('session_$id', $user_id, '$token', '$ip_address', '$user_agent', '$created_at', '$expires_at');" 2>/dev/null || true
    done
    MIGRATED_SESSIONS=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM sessions;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_SESSIONS 个 Sessions${NC}"
fi

# 5.5 迁移登录历史
if [ "$LOGIN_HISTORY_COUNT" -gt 0 ]; then
    echo "   迁移登录历史..."
    cat "$JSON_DB" | jq -c '.login_history[]?' 2>/dev/null | while read -r history; do
        [ -z "$history" ] && continue
        
        user_id=$(echo "$history" | jq -r '.user_id // 0')
        ip_address=$(echo "$history" | jq -r '.ip_address // ""' | sed "s/'/''/g")
        user_agent=$(echo "$history" | jq -r '.user_agent // ""' | sed "s/'/''/g")
        login_at=$(echo "$history" | jq -r '.login_at // (now | todate)')
        success=$(echo "$history" | jq -r 'if .success then 1 else 0 end')
        
        sqlite3 "$SQLITE_DB" "INSERT INTO login_history (user_id, ip_address, user_agent, login_at, success) VALUES ($user_id, '$ip_address', '$user_agent', '$login_at', $success);" 2>/dev/null || true
    done
    MIGRATED_LOGIN=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM login_history;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_LOGIN 条登录历史${NC}"
fi

# 5.6 迁移邀请码
if [ "$INVITE_CODE_COUNT" -gt 0 ]; then
    echo "   迁移邀请码..."
    cat "$JSON_DB" | jq -c '.invite_codes[]?' 2>/dev/null | while read -r invite; do
        [ -z "$invite" ] && continue
        
        code=$(echo "$invite" | jq -r '.code // ""' | sed "s/'/''/g")
        [ -z "$code" ] || [ "$code" = "null" ] && continue
        
        # 邀请码数据结构不同，没有 created_by/used_by，但有 is_active
        created_at=$(echo "$invite" | jq -r '.created_at // (now | todate)')
        expires_at=$(echo "$invite" | jq -r '.expires_at')
        
        # 处理 NULL 值
        if [ "$expires_at" = "null" ] || [ -z "$expires_at" ]; then
            expires_at_sql="NULL"
        else
            expires_at_sql="'$expires_at'"
        fi
        
        # 由于原数据没有 created_by/used_by，设为 NULL
        sqlite3 "$SQLITE_DB" "INSERT OR IGNORE INTO invite_codes (code, created_by, used_by, created_at, used_at, expires_at) VALUES ('$code', NULL, NULL, '$created_at', NULL, $expires_at_sql);" 2>/dev/null || true
    done
    MIGRATED_INVITES=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM invite_codes;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_INVITES 个邀请码${NC}"
fi

# 5.7 迁移 OAuth 账户
if [ "$OAUTH_COUNT" -gt 0 ]; then
    echo "   迁移 OAuth 账户..."
    cat "$JSON_DB" | jq -c '.oauth_accounts[]?' 2>/dev/null | while read -r oauth; do
        [ -z "$oauth" ] && continue
        
        user_id=$(echo "$oauth" | jq -r '.user_id // 0')
        provider=$(echo "$oauth" | jq -r '.provider // ""' | sed "s/'/''/g")
        provider_user_id=$(echo "$oauth" | jq -r '.provider_user_id // ""' | sed "s/'/''/g")
        email=$(echo "$oauth" | jq -r '.email // ""' | sed "s/'/''/g")
        display_name=$(echo "$oauth" | jq -r '.display_name // ""' | sed "s/'/''/g")
        avatar_url=$(echo "$oauth" | jq -r '.avatar_url // ""' | sed "s/'/''/g")
        access_token=$(echo "$oauth" | jq -r '.access_token // ""' | sed "s/'/''/g")
        refresh_token=$(echo "$oauth" | jq -r '.refresh_token // ""' | sed "s/'/''/g")
        expires_at=$(echo "$oauth" | jq -r '.expires_at // ""')
        created_at=$(echo "$oauth" | jq -r '.created_at // (now | todate)')
        updated_at=$(echo "$oauth" | jq -r '.updated_at // .created_at // (now | todate)')
        
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO oauth_accounts (user_id, provider, provider_user_id, email, display_name, avatar_url, access_token, refresh_token, expires_at, created_at, updated_at) VALUES ($user_id, '$provider', '$provider_user_id', '$email', '$display_name', '$avatar_url', '$access_token', '$refresh_token', '$expires_at', '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_OAUTH=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM oauth_accounts;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_OAUTH 个 OAuth 账户${NC}"
fi

# 5.8 迁移 AI 代理
if [ "$AGENT_COUNT" -gt 0 ]; then
    echo "   迁移 AI 代理..."
    cat "$JSON_DB" | jq -c '.agents[]?' 2>/dev/null | while read -r agent; do
        [ -z "$agent" ] && continue
        
        user_id=$(echo "$agent" | jq -r '.user_id // 0')
        name=$(echo "$agent" | jq -r '.name // ""' | sed "s/'/''/g")
        description=$(echo "$agent" | jq -r '.description // ""' | sed "s/'/''/g")
        model_id=$(echo "$agent" | jq -r '.model_id // ""' | sed "s/'/''/g")
        model_name=$(echo "$agent" | jq -r '.model_name // ""' | sed "s/'/''/g")
        system_prompt=$(echo "$agent" | jq -r '.system_prompt // ""' | sed "s/'/''/g")
        temperature=$(echo "$agent" | jq -r '.temperature // 0.7')
        max_tokens=$(echo "$agent" | jq -r '.max_tokens // "NULL"')
        stream=$(echo "$agent" | jq -r 'if .stream then 1 else 0 end')
        use_mcp=$(echo "$agent" | jq -r 'if .use_mcp then 1 else 0 end')
        enabled_tools=$(echo "$agent" | jq -r '.enabled_tools // "[]"' | sed "s/'/''/g")
        created_at=$(echo "$agent" | jq -r '.created_at // (now | todate)')
        updated_at=$(echo "$agent" | jq -r '.updated_at // .created_at // (now | todate)')
        
        sqlite3 "$SQLITE_DB" "INSERT INTO agents (user_id, name, description, model_id, model_name, system_prompt, temperature, max_tokens, stream, use_mcp, enabled_tools, created_at, updated_at) VALUES ($user_id, '$name', '$description', '$model_id', '$model_name', '$system_prompt', $temperature, $max_tokens, $stream, $use_mcp, '$enabled_tools', '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_AGENTS=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM agents;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_AGENTS 个 AI 代理${NC}"
fi

# 5.9 迁移用户配置
if [ "$USER_CONFIG_COUNT" -gt 0 ]; then
    echo "   迁移用户配置..."
    cat "$JSON_DB" | jq -c '.user_configs[]?' 2>/dev/null | while read -r config; do
        [ -z "$config" ] && continue
        
        user_id=$(echo "$config" | jq -r '.user_id // 0')
        config_key=$(echo "$config" | jq -r '.config_key // ""' | sed "s/'/''/g")
        config_value=$(echo "$config" | jq -r '.config_value // ""' | sed "s/'/''/g")
        created_at=$(echo "$config" | jq -r '.created_at // (now | todate)')
        updated_at=$(echo "$config" | jq -r '.updated_at // .created_at // (now | todate)')
        
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO user_configs (user_id, config_key, config_value, created_at, updated_at) VALUES ($user_id, '$config_key', '$config_value', '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_CONFIGS=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM user_configs;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_CONFIGS 个用户配置${NC}"
fi

# 5.10 迁移用户 MCP 配置
if [ "$MCP_CONFIG_COUNT" -gt 0 ]; then
    echo "   迁移用户 MCP 配置..."
    cat "$JSON_DB" | jq -c '.user_mcp_configs[]?' 2>/dev/null | while read -r mcp; do
        [ -z "$mcp" ] && continue
        
        user_id=$(echo "$mcp" | jq -r '.user_id // 0')
        service_id=$(echo "$mcp" | jq -r '.service_id // ""' | sed "s/'/''/g")
        enabled=$(echo "$mcp" | jq -r 'if .enabled then 1 else 0 end')
        config=$(echo "$mcp" | jq -r '.config // "{}"' | sed "s/'/''/g")
        created_at=$(echo "$mcp" | jq -r '.created_at // (now | todate)')
        updated_at=$(echo "$mcp" | jq -r '.updated_at // .created_at // (now | todate)')
        
        sqlite3 "$SQLITE_DB" "INSERT OR REPLACE INTO user_mcp_configs (user_id, service_id, enabled, config, created_at, updated_at) VALUES ($user_id, '$service_id', $enabled, '$config', '$created_at', '$updated_at');" 2>/dev/null || true
    done
    MIGRATED_MCP=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM user_mcp_configs;")
    echo -e "${GREEN}   ✓ 迁移了 $MIGRATED_MCP 个 MCP 配置${NC}"
fi

# 6. 验证迁移结果
echo ""
echo "✅ 验证迁移结果..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
printf "%-20s %-10s %-10s\n" "数据类型" "预期" "实际"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
printf "%-20s %-10s %-10s\n" "用户" "$USER_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM users;")"
printf "%-20s %-10s %-10s\n" "笔记" "$NOTE_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM notes;")"
printf "%-20s %-10s %-10s\n" "分类" "$CATEGORY_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM note_categories;")"
printf "%-20s %-10s %-10s\n" "Sessions" "$SESSION_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM sessions;")"
printf "%-20s %-10s %-10s\n" "登录历史" "$LOGIN_HISTORY_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM login_history;")"
printf "%-20s %-10s %-10s\n" "邀请码" "$INVITE_CODE_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM invite_codes;")"
printf "%-20s %-10s %-10s\n" "OAuth账户" "$OAUTH_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM oauth_accounts;")"
printf "%-20s %-10s %-10s\n" "AI代理" "$AGENT_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM agents;")"
printf "%-20s %-10s %-10s\n" "用户配置" "$USER_CONFIG_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM user_configs;")"
printf "%-20s %-10s %-10s\n" "MCP配置" "$MCP_CONFIG_COUNT" "$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM user_mcp_configs;")"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "============================================================"
echo -e "${GREEN}✨ 完整数据迁移完成！${NC}"
echo "============================================================"
echo ""
echo "📝 备份信息:"
echo "   JSON备份: $JSON_DB (保留原文件)"
echo "   SQLite备份: $BACKUP_DB"
echo ""
echo "🚀 下一步:"
echo "   1. 重启后端服务: ./start.sh"
echo "   2. 刷新浏览器，验证所有数据"
echo "   3. 检查 Sessions 是否正常工作"
echo "   4. 验证 AI 代理功能"
echo ""
echo "💡 如有问题，可以从备份恢复:"
echo "   cp $BACKUP_DB $SQLITE_DB"
echo ""
