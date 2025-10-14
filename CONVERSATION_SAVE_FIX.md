# 对话保存失败问题修复

## 问题描述

用户在创建新对话并发送消息后，对话无法保存到数据库，浏览器控制台显示"保存对话失败"错误。

## 根本原因

后端服务器的请求体大小限制过小（默认 100kb），当对话包含大量消息时，保存请求的数据量超过限制，导致服务器返回 `PayloadTooLargeError: request entity too large` 错误。

### 错误日志示例

```
[2025-10-13T23:08:53.141Z] [ERROR] 未知错误: PayloadTooLargeError: request entity too large
[2025-10-13T23:08:54.831Z] [ERROR] 未知错误: PayloadTooLargeError: request entity too large
```

## 解决方案

### 1. 增加后端请求体大小限制

修改 `server/index.cjs` 文件，将 `express.json()` 的大小限制从默认的 100kb 增加到 50mb：

```javascript
// 修改前
app.use(express.json());

// 修改后
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 2. 增强前端错误日志

修改 `src/hooks/useConversationsDB.js` 文件，增加详细的调试日志，帮助快速定位问题：

```javascript
const saveConversations = useCallback(async (conversationsToSave) => {
  console.log('[useConversationsDB] saveConversations called:', {
    isAuthenticated,
    hasToken: !!token,
    conversationsCount: Object.keys(conversationsToSave || {}).length
  });

  if (!isAuthenticated || !token) {
    console.warn('[useConversationsDB] Skip saving: not authenticated or no token');
    return;
  }

  try {
    console.log('[useConversationsDB] Sending save request...');
    const response = await fetch('/api/user-data/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ conversations: conversationsToSave })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[useConversationsDB] Save failed:', response.status, errorText);
      throw new Error(`保存对话失败: ${response.status}`);
    }
    
    console.log('[useConversationsDB] Conversations saved successfully');
  } catch (error) {
    console.error('[useConversationsDB] Error saving conversations:', error);
    throw error;
  }
}, [token, isAuthenticated]);
```

## 影响范围

- **文件修改**:
  1. `server/index.cjs` - 增加请求体大小限制
  2. `src/hooks/useConversationsDB.js` - 增强错误日志

- **功能改进**:
  - 支持保存包含大量消息的对话
  - 更好的错误提示和调试信息
  - 不再出现静默失败

## 测试验证

### 测试步骤

1. 启动应用：`./start.sh`
2. 登录到系统
3. 创建新对话
4. 发送多条消息（建议 10+ 条）
5. 检查浏览器控制台日志
6. 刷新页面，验证对话是否被保存

### 预期结果

- 浏览器控制台应显示：
  ```
  [useConversationsDB] saveConversations called: {isAuthenticated: true, hasToken: true, conversationsCount: X}
  [useConversationsDB] Sending save request...
  [useConversationsDB] Conversations saved successfully
  ```

- 后端日志应显示：
  ```
  [INFO] POST /api/user-data/conversations
  ```

- 刷新页面后对话依然存在

## 技术细节

### Express.js 请求体大小限制

Express.js 的 `body-parser` 中间件默认限制：
- JSON: 100kb
- URL-encoded: 100kb

对于包含大量消息、附件或长文本的对话，100kb 很容易超限。

### 建议的大小限制

- **开发环境**: 50mb（当前设置）
- **生产环境**: 10-20mb（根据实际需求调整）

### 安全考虑

虽然增加了请求体大小限制，但应该在前端实现以下保护措施：

1. **分页保存**: 对于超大对话，考虑分批保存
2. **压缩传输**: 对大型数据使用 gzip 压缩
3. **定期清理**: 提示用户归档或删除旧对话
4. **大小监控**: 在前端显示对话大小，提醒用户

## 相关问题

- [x] 修复 PayloadTooLargeError 错误
- [x] 增加详细的错误日志
- [ ] 实现对话数据压缩（Future Enhancement）
- [ ] 添加对话大小提示（Future Enhancement）

## 修复时间

2025-10-14

## 修复作者

AI Assistant
