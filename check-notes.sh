#!/bin/bash

echo "📊 Personal Chatbox - 笔记数据检查"
echo "===================================="
echo ""

DB_PATH="/Users/ezra/Personal-Chatbox/data/app.db"

# 检查数据库是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库文件不存在: $DB_PATH"
    exit 1
fi

echo "✅ 数据库文件存在"
echo ""

# 1. 总笔记数
echo "📝 总笔记数："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL_NOTES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM notes;")
echo "  $TOTAL_NOTES 条笔记"
echo ""

# 2. 每个用户的笔记分布
echo "👥 用户笔记分布："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" << 'EOF'
.mode column
.headers on
SELECT 
  u.id as "用户ID",
  COALESCE(u.username, '未设置') as "用户名",
  u.email as "邮箱",
  COUNT(n.id) as "笔记数",
  MAX(n.created_at) as "最后更新"
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id
HAVING COUNT(n.id) > 0
ORDER BY COUNT(n.id) DESC;
EOF
echo ""

# 3. 最新的5条笔记
echo "🆕 最新的5条笔记："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" << 'EOF'
.mode column
.headers on
SELECT 
  n.id as "ID",
  n.user_id as "用户",
  n.title as "标题",
  n.category as "分类",
  substr(n.created_at, 1, 19) as "创建时间"
FROM notes n
ORDER BY n.created_at DESC 
LIMIT 5;
EOF
echo ""

# 4. 有笔记的用户登录信息
echo "🔑 建议登录账号："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" << 'EOF'
SELECT 
  '用户 ID: ' || u.id || char(10) ||
  '邮箱: ' || u.email || char(10) ||
  '笔记数: ' || COUNT(n.id) || ' 条' || char(10) ||
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
WHERE n.id IS NOT NULL
GROUP BY u.id
ORDER BY COUNT(n.id) DESC;
EOF
echo ""

# 5. 检查测试账号
echo "🧪 测试账号（无笔记）："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" << 'EOF'
.mode column
.headers on
SELECT 
  id as "ID",
  email as "邮箱",
  created_at as "注册时间"
FROM users 
WHERE id NOT IN (SELECT DISTINCT user_id FROM notes)
ORDER BY id DESC
LIMIT 3;
EOF
echo ""

echo "✅ 检查完成！"
echo ""
echo "💡 提示："
echo "  1. 如果看不到笔记，请检查是否用错了账号"
echo "  2. 使用有笔记的账号登录（见上方'建议登录账号'）"
echo "  3. 如果忘记密码，运行: node reset-password.cjs"
