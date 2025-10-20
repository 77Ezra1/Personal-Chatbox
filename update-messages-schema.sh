#!/bin/bash

# 更新 messages 表结构以支持数据分析

DB_PATH="./data/app.db"

echo "======================================"
echo "更新 messages 表结构"
echo "======================================"

# 添加缺失的字段
sqlite3 "$DB_PATH" << 'EOF'
-- 添加 model 字段
ALTER TABLE messages ADD COLUMN model TEXT;

-- 添加 timestamp 字段
ALTER TABLE messages ADD COLUMN timestamp TEXT DEFAULT (datetime('now'));

-- 添加 metadata 字段（存储 token 使用等信息）
ALTER TABLE messages ADD COLUMN metadata TEXT;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- 验证更新
PRAGMA table_info(messages);

EOF

echo ""
echo "✅ messages 表结构更新完成！"
echo ""
echo "新增字段："
echo "  - model: 存储使用的 AI 模型"
echo "  - timestamp: 消息时间戳"
echo "  - metadata: JSON 格式的元数据（token 使用等）"
echo ""
