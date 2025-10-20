# Analytics SQL 修复报告

## 问题描述

数据分析板块在访问时报错：
```
SqliteError: ambiguous column name: model
at /Users/ezra/Personal-Chatbox/server/routes/analytics.cjs:63:27
```

## 根本原因

在 `server/routes/analytics.cjs` 中，多个 SQL 查询使用了 JOIN 操作连接 `messages` 和 `conversations` 表，但两个表都包含 `model` 字段。在 SELECT 和 WHERE 子句中直接使用 `model` 会导致歧义错误。

### 数据库表结构
- **messages 表**: 包含 `model` 字段（消息使用的模型）
- **conversations 表**: 包含 `model` 字段（对话使用的模型）

当执行 JOIN 查询时，SQL 引擎无法判断应该使用哪个表的 `model` 字段。

## 修复方案

为所有涉及 `model` 字段的 SQL 查询添加表前缀，明确指定使用哪个表的字段。

### 修复位置

#### 1. `/api/analytics/overview` - 模型使用统计（第63-73行）

**修复前：**
```sql
SELECT
  model,
  COUNT(*) as count
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.user_id = ? AND model IS NOT NULL AND role = 'assistant'
GROUP BY model
```

**修复后：**
```sql
SELECT
  m.model,
  COUNT(*) as count
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.user_id = ? AND m.model IS NOT NULL AND m.role = 'assistant'
GROUP BY m.model
```

#### 2. `/api/analytics/models` - 模型统计详情（第176-186行）

**修复前：**
```sql
SELECT 
  model,
  COUNT(*) as count,
  SUM(CAST(json_extract(metadata, '$.usage.total_tokens') AS INTEGER)) as total_tokens,
  AVG(CAST(json_extract(metadata, '$.usage.total_tokens') AS INTEGER)) as avg_tokens
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.user_id = ? AND model IS NOT NULL AND role = 'assistant'
GROUP BY model
```

**修复后：**
```sql
SELECT 
  m.model,
  COUNT(*) as count,
  SUM(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as total_tokens,
  AVG(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as avg_tokens
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.user_id = ? AND m.model IS NOT NULL AND m.role = 'assistant'
GROUP BY m.model
```

## 修复细节

共修复了 **2 个 SQL 查询** 中的歧义字段引用：

1. **表前缀添加**:
   - `model` → `m.model`
   - `role` → `m.role`
   - `metadata` → `m.metadata`（在 json_extract 中）

2. **影响的端点**:
   - `GET /api/analytics/overview` - 统计概览
   - `GET /api/analytics/models` - 模型使用分布

## 测试结果

### 1. Analytics Overview API
```bash
curl http://localhost:3001/api/analytics/overview -b cookies.txt
```

**响应：**
```json
{
  "success": true,
  "data": {
    "conversations": 0,
    "messages": 0,
    "apiCalls": 0,
    "tokens": {
      "prompt": 0,
      "completion": 0,
      "total": 0
    },
    "cost": {
      "total": "0.0000",
      "prompt": "0.0000",
      "completion": "0.0000",
      "currency": "USD",
      "currencySymbol": "$"
    },
    "todayMessages": 0,
    "todayApiCalls": 0,
    "topModels": []
  }
}
```

### 2. Models Statistics API
```bash
curl http://localhost:3001/api/analytics/models -b cookies.txt
```

**响应：**
```json
{
  "success": true,
  "data": []
}
```

### 3. Trends API
```bash
curl http://localhost:3001/api/analytics/trends?period=7d -b cookies.txt
```

**响应：**
```json
{
  "success": true,
  "data": [
    {"date": "2025-10-14", "message_count": 0, "conversation_count": 0, "total_tokens": 0},
    {"date": "2025-10-15", "message_count": 0, "conversation_count": 0, "total_tokens": 0},
    ...
  ]
}
```

✅ **所有 API 端点正常返回数据**

## 影响范围

- **修改文件**: `server/routes/analytics.cjs`
- **影响功能**: 数据分析面板所有统计功能
- **影响用户**: 所有使用数据分析功能的用户

## 预防措施

### 编码规范建议

1. **始终使用表别名前缀**
   - 在 JOIN 查询中，所有字段引用都应加上表别名（如 `m.field`, `c.field`）
   - 即使字段名唯一，也建议使用前缀以提高可读性

2. **SQL 最佳实践**
   ```sql
   -- ✅ 推荐写法
   SELECT m.model, c.title
   FROM messages m
   JOIN conversations c ON m.conversation_id = c.id
   
   -- ❌ 避免写法
   SELECT model, title
   FROM messages m
   JOIN conversations c ON m.conversation_id = c.id
   ```

3. **代码审查检查点**
   - JOIN 查询是否有歧义字段
   - WHERE 子句是否正确使用表前缀
   - GROUP BY 子句是否与 SELECT 保持一致

## 后续建议

1. **添加单元测试** - 为 analytics API 添加自动化测试，防止回归
2. **数据库索引** - 考虑为常用查询字段添加索引（model, user_id, timestamp）
3. **查询优化** - 定期检查慢查询日志，优化性能
4. **错误监控** - 增强日志记录，便于快速定位类似问题

## 状态

- ✅ **已修复**: Analytics SQL 歧义错误
- ✅ **已测试**: 所有 analytics API 端点正常工作
- ✅ **已部署**: 后端服务已重启并应用修复
- ⏳ **待完成**: 添加单元测试和性能优化

---

**修复时间**: 2025-01-21  
**修复人员**: AI Agent  
**相关问题**: Analytics dashboard 500 error
