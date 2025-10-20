# 对话数据持久化问题修复报告

## 问题描述

用户反馈刷新页面后,对话数据会消失,即使数据已经保存到数据库。

## 根本原因分析

发现了两个关键问题:

### 1. 前端 Race Condition (竞态条件)
- 页面加载时,conversations 状态初始化为空对象 `{}`
- `loadConversations()` 开始从 API 获取数据
- 在 API 响应返回之前,某些操作触发了 `debouncedSave`
- `debouncedSave` 使用空状态调用后端保存 API
- 后端执行删除操作,清空了数据库

### 2. 后端使用 "删除全部 + 重新插入" 模式
- 原来的保存逻辑:先执行 `DELETE FROM conversations WHERE user_id = ?`
- 然后重新插入所有对话
- 如果前端发送空对话列表,会导致数据库被清空

## 修复方案

### 修复 1: 前端防止加载期间的保存操作

**文件**: `src/hooks/useConversationsDB.js`

**修改位置**: 第 155-195 行,`saveConversations` 函数

**改动**:
```javascript
// 防止在初始加载期间保存空数据导致数据库被清空
if (loading) {
  logger.warn('[useConversationsDB] Skip saving: still loading initial data');
  return;
}
```

**作用**: 阻止在数据加载完成之前的任何保存操作,避免用空状态覆盖数据库。

### 修复 2: 后端改用增量更新模式

**文件**: `server/routes/user-data.cjs`

**修改位置**: 第 73-178 行,保存对话的逻辑

**原来的逻辑**:
1. 删除用户所有对话: `DELETE FROM conversations WHERE user_id = ?`
2. 重新插入所有对话和消息

**新的基于 ID 的增量更新逻辑**:
1. 查询数据库中已存在的对话 ID 列表
2. 对于前端发送的每个对话:
   - 判断 `conv.id` 是数据库整数 ID（如 `61`）还是前端临时字符串 ID（如 `"1734567890-abc123"`）
   - 如果是数据库 ID 且存在于数据库中 → **UPDATE** 对话信息（标题、更新时间）
   - 如果是前端临时 ID 或数据库中不存在 → **INSERT** 新对话
3. 对于每个对话的消息:
   - 查询现有消息数量
   - 只插入新增的消息(跳过已存在的)

**ID 识别规则**:
```javascript
// 数据库 ID: 纯数字字符串 "61" 或数字 61
const isDbId = typeof conv.id === 'number' || /^\d+$/.test(conv.id);

// 前端临时 ID: 带时间戳的字符串 "1734567890-abc123"
const isTempId = typeof conv.id === 'string' && conv.id.includes('-');
```

**优势**:
- ✅ 不会因为空请求而清空数据库
- ✅ 减少数据库写入操作(只更新变化的部分)
- ✅ **保持数据库 ID 稳定性** - 数据分析面板可以正确引用 `conversation_id`
- ✅ 防止重复插入相同的消息
- ✅ 前端加载数据后使用数据库 ID,保存时不会重复插入
- ✅ 兼容新建对话（使用临时 ID）和已有对话（使用数据库 ID）

## 代码变更详情

### 前端修改

```javascript
// src/hooks/useConversationsDB.js:155-171
const saveConversations = useCallback(async (conversationsToSave) => {
  logger.log('[useConversationsDB] saveConversations called:', {
    isAuthenticated,
    loading,  // 添加 loading 状态日志
    conversationsCount: Object.keys(conversationsToSave || {}).length
  });

  if (!isAuthenticated) {
    logger.warn('[useConversationsDB] Skip saving: not authenticated');
    return;
  }

  // 新增: 防止在初始加载期间保存空数据导致数据库被清空
  if (loading) {
    logger.warn('[useConversationsDB] Skip saving: still loading initial data');
    return;
  }
  // ... 其余保存逻辑
}, [isAuthenticated, loading]);  // 依赖数组添加 loading
```

### 后端修改

```javascript
// server/routes/user-data.cjs:84-179 (基于 ID 的增量更新)

// 获取数据库中现有的对话 ID
const existingConversations = await db.prepare(
  'SELECT id FROM conversations WHERE user_id = ?'
).all(userId);

// 创建现有对话 ID 的 Set
const existingIds = new Set(existingConversations.map(c => c.id));

let updatedCount = 0;
let insertedCount = 0;

// 遍历前端传来的对话,进行增量更新
for (const conv of conversationList) {
  const title = conv.title || '新对话';
  let dbId = null;

  // 判断 conv.id 是否是数据库整数 ID（从数据库加载的）还是前端临时 ID（新创建的）
  const isDbId = typeof conv.id === 'number' || (typeof conv.id === 'string' && /^\d+$/.test(conv.id));
  const convIdAsInt = isDbId ? parseInt(conv.id, 10) : null;

  // 如果 ID 是数据库 ID 且存在于数据库中，则更新
  if (convIdAsInt && existingIds.has(convIdAsInt)) {
    dbId = convIdAsInt;
    await db.prepare(
      `UPDATE conversations SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    ).run(title, conv.updatedAt || new Date().toISOString(), dbId, userId);
    updatedCount++;
    logger.info(`[User Data] Updated conversation: ${title} (ID: ${dbId})`);
  } else {
    // 插入新对话（前端临时 ID，或者数据库中不存在的 ID）
    const result = await db.prepare(
      `INSERT INTO conversations (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).run(userId, title, conv.createdAt || new Date().toISOString(), conv.updatedAt || new Date().toISOString());
    dbId = result.lastInsertRowid || result.lastID;
    existingIds.add(dbId);
    insertedCount++;
    logger.info(`[User Data] Inserted new conversation: ${title} (ID: ${dbId}, frontend ID: ${conv.id})`);
  }

  // 获取该对话现有的消息数量
  const existingMessageCount = await db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?'
  ).get(dbId);

  const currentMessageCount = existingMessageCount.count || 0;
  const newMessages = conv.messages || [];

  // 只插入新增的消息
  if (newMessages.length > currentMessageCount) {
    const messagesToInsert = newMessages.slice(currentMessageCount);

    for (const msg of messagesToInsert) {
      await db.prepare(
        `INSERT INTO messages (conversation_id, role, content, timestamp, metadata, model)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(dbId, msg.role || 'user', msg.content || '', msg.timestamp || new Date().toISOString(),
            msg.metadata ? JSON.stringify(msg.metadata) : null, msg.model || null);
    }

    logger.info(`[User Data] Added ${messagesToInsert.length} new messages to conversation: ${title}`);
  }
}

logger.info(`✅ Saved: ${insertedCount} new, ${updatedCount} updated conversations`);
```

## 测试计划

请按以下步骤验证修复:

1. **登录系统**
   - 使用邮箱: `test123@example.com`
   - 需要重置密码或使用正确密码

2. **创建测试对话**
   - 创建一个新对话 "修复测试"
   - 发送几条消息
   - 观察侧边栏显示对话

3. **刷新页面测试**
   - 按 F5 或 Cmd+R 刷新页面
   - **预期结果**: 对话仍然存在,消息保留

4. **增量更新测试**
   - 在现有对话中添加新消息
   - 刷新页面
   - **预期结果**: 所有消息(包括新消息)都保留

5. **多次刷新测试**
   - 连续刷新页面 3-5 次
   - **预期结果**: 数据不会丢失或重复

6. **数据库验证**
   ```bash
   # 检查对话数量
   sqlite3 data/app.db "SELECT COUNT(*) FROM conversations WHERE user_id = 11;"

   # 检查消息数量
   sqlite3 data/app.db "SELECT c.title, COUNT(m.id) as msg_count FROM conversations c LEFT JOIN messages m ON c.id = m.conversation_id WHERE c.user_id = 11 GROUP BY c.id;"
   ```

## 日志监控

修复后,后端日志会显示:

```
[User Data] Saving conversations for user: 11
[User Data] Conversations count: 2
[User Data] Updated conversation: 测试对话 (ID: 61)
[User Data] Added 1 new messages to conversation: 测试对话
[User Data] Inserted new conversation: 新对话 (ID: 64)
[User Data] ✅ Saved: 1 new, 1 updated conversations with 1 new messages
```

**不会再看到**:
```
[User Data] Deleted old conversations for user: 11  ❌ (已移除)
```

## 数据一致性保证

### 数据分析面板兼容性
修复后的保存逻辑确保：
- ✅ 数据库中的 `conversation_id` 保持稳定
- ✅ Analytics 路由可以正确关联 `messages.conversation_id` 和 `conversations.id`
- ✅ 统计数据（对话数量、消息数量、模型使用）准确无误
- ✅ 导出功能可以正确获取完整的对话数据

### ID 映射流程
```
1. 用户创建新对话
   前端: 生成临时ID "1734567890-abc123"

2. 保存到数据库
   后端: 识别为临时ID → INSERT → 获得数据库ID 61

3. 下次加载
   后端: 返回 conversations 带有 id=61
   前端: 使用 61 作为 key

4. 用户添加消息
   前端: 发送对话 id=61
   后端: 识别为数据库ID → UPDATE conversation 61 → INSERT messages

5. 数据分析
   Analytics: JOIN messages ON conversation_id=61 ✓
```

## 已知限制

1. **消息去重**: 目前基于消息数量判断,如果用户删除了中间的消息,可能导致不一致
   - **影响**: 可能重复插入已存在的消息
   - **未来改进**: 使用消息 ID 或 timestamp 进行精确匹配

2. **删除对话**: 前端删除对话后,不会同步删除数据库中的对话
   - **影响**: 数据库中可能存在"孤儿"对话
   - **未来改进**: 添加专门的删除 API,或在保存时发送完整的对话列表并清理不存在的

3. **并发保存**: 多个标签页同时编辑同一对话可能导致数据覆盖
   - **影响**: 后保存的数据会覆盖先保存的
   - **未来改进**: 添加乐观锁或版本号机制

## 文件变更清单

- ✅ `src/hooks/useConversationsDB.js` (第 168-171 行) - 添加 loading 状态检查,防止初始化期间的保存
- ✅ `server/routes/user-data.cjs` (第 84-179 行) - 改用基于 ID 的增量更新逻辑
  - 移除 `DELETE FROM conversations` 危险操作
  - 添加 ID 类型判断（数据库 ID vs 临时 ID）
  - UPDATE 现有对话而不是重新插入
  - 保持 `conversation_id` 稳定性供 Analytics 使用

## 部署说明

1. 重启后端服务器以应用修改
2. 前端会自动热更新(Vite HMR)
3. 无需数据库迁移,新逻辑兼容现有数据

---

**修复时间**: 2025-10-21
**修复版本**: v1.1.0
**测试状态**: 待用户验证
