#!/bin/bash

# 手动迁移 Sessions 和邀请码（使用现有表结构）

SQLITE_DB="data/app.db"

echo "🔄 手动迁移 Sessions 和邀请码..."

# 使用 Python 来处理
python3 - <<'PYTHON'
import json
import sqlite3

# 读取 JSON 数据
with open('data/database.json', 'r') as f:
    data = json.load(f)

# 连接到 SQLite
conn = sqlite3.connect('data/app.db')
cursor = conn.cursor()

# 迁移 Sessions - 使用实际的表结构 (id, user_id, expires_at, data)
sessions = data.get('sessions', [])
print(f"找到 {len(sessions)} 个 Sessions")

for session in sessions:
    session_id = f"session_{session.get('id')}"
    user_id = session.get('user_id')
    expires_at = session.get('expires_at', '')
    
    # 将额外的数据（token, ip_address, user_agent, created_at）存储为 JSON
    session_data = json.dumps({
        'token': session.get('token', ''),
        'ip_address': session.get('ip_address', ''),
        'user_agent': session.get('user_agent', ''),
        'created_at': session.get('created_at', '')
    })
    
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO sessions 
            (id, user_id, expires_at, data)
            VALUES (?, ?, ?, ?)
        ''', (session_id, user_id, expires_at, session_data))
        print(f"  ✓ 迁移 Session: {session_id}")
    except Exception as e:
        print(f"  ✗ 失败: {e}")

# 迁移邀请码 - 使用实际的表结构 (code, max_uses, used_count, description, created_at, expires_at, is_active)
invite_codes = data.get('invite_codes', [])
print(f"\n找到 {len(invite_codes)} 个邀请码")

for invite in invite_codes:
    code = invite.get('code', '')
    max_uses = invite.get('max_uses', -1)
    used_count = invite.get('used_count', 0)
    description = invite.get('description', '')
    created_at = invite.get('created_at', '')
    expires_at = invite.get('expires_at')
    is_active = invite.get('is_active', 1)
    
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO invite_codes 
            (code, max_uses, used_count, description, created_at, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (code, max_uses, used_count, description, created_at, expires_at, is_active))
        print(f"  ✓ 迁移邀请码: {code}")
    except Exception as e:
        print(f"  ✗ 失败: {e}")

conn.commit()
conn.close()

# 验证
conn = sqlite3.connect('data/app.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM sessions')
session_count = cursor.fetchone()[0]
print(f"\n✅ Sessions 总数: {session_count}")

cursor.execute('SELECT COUNT(*) FROM invite_codes')
invite_count = cursor.fetchone()[0]
print(f"✅ 邀请码总数: {invite_count}")

conn.close()
PYTHON

echo ""
echo "✅ 完成！"
