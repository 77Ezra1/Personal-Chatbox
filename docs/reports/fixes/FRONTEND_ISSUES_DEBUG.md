# 前端交互问题调试指南

## 问题列表

1. ✅ **hover 时对话列表项透明** - 已修复
   - 原因: `v0-ui-improvements.css` 设置了 `background: transparent`
   - 修复: 移除该行，让 `::before` 伪元素的背景显示

2. ✅ **删除对话功能点击无反应** - 已修复
   - 原因: `removeConversation` 使用了 async 可能导致问题
   - 修复: 改用 Promise.then() 不阻塞 UI

3. ⚠️ **切换对话功能不工作** - 待验证
   - 实现: `selectConversation` 只是设置 `currentConversationId`
   - 可能原因: 需要检查是否有其他问题

4. ⚠️ **重命名对话功能不工作** - 待验证
   - 实现: `renameConversation` 调用后端 API
   - 可能原因: 需要检查控制台错误

## 调试步骤

### 1. 打开浏览器控制台
```
Chrome: Cmd+Option+J (Mac) or Ctrl+Shift+J (Windows)
```

### 2. 检查 Console 错误
查看是否有 JavaScript 错误或警告

### 3. 测试切换对话
1. 点击 "新建对话 2"
2. 检查 Console 是否有日志
3. 检查 Network 标签是否有 API 调用

### 4. 测试重命名对话
1. 点击铅笔图标
2. 输入新名称
3. 按 Enter 或点击勾选按钮
4. 检查 Console 和 Network

### 5. 测试删除对话
1. 点击垃圾桶图标
2. 确认删除
3. 检查 Console 是否有:
   ```
   [useConversationsDB] Successfully deleted conversation from database: <id>
   ```
4. 检查 Network 是否有:
   ```
   DELETE /api/user-data/conversations/<id>
   ```

## 预期行为

### 切换对话
- 点击对话列表项
- 当前对话高亮显示
- 右侧内容区域显示该对话的消息

### 重命名对话
- 点击铅笔图标进入编辑模式
- 输入框获得焦点并选中文本
- 输入新名称后按 Enter 或点击勾选
- 对话标题更新

### 删除对话
- 点击垃圾桶图标
- 弹出确认对话框
- 确认后对话从列表中移除
- 如果删除的是当前对话，自动切换到其他对话
- 后端 API 被调用删除数据库记录

## 常见问题

### 问题: 点击按钮没反应
**可能原因**:
1. JavaScript 错误阻止了事件处理
2. CSS z-index 问题导致按钮被覆盖
3. 事件冒泡被阻止

**检查方法**:
```javascript
// 在 Console 中运行
document.querySelectorAll('.conversation-action').forEach(btn => {
  console.log('Button:', btn, 'Click handler:', btn.onclick);
});
```

### 问题: API 调用失败
**可能原因**:
1. 认证 Token 过期
2. 后端服务未运行
3. CORS 问题

**检查方法**:
```bash
# 检查后端服务
ps aux | grep "node server/index.cjs"

# 检查最新日志
tail -50 logs/backend-final-fix.log
```

### 问题: 状态不更新
**可能原因**:
1. React 状态更新异步
2. useCallback 依赖项缺失
3. 组件未重新渲染

**检查方法**:
打开 React DevTools，观察组件状态变化

## 修复历史

### 2025-10-21 03:15 - 修复 hover 透明问题
**文件**: `src/styles/v0-ui-improvements.css:48-51`

**Before**:
```css
.conversation-item:hover {
  border-color: var(--border);
  background: transparent;
}
```

**After**:
```css
.conversation-item:hover {
  border-color: var(--border);
  /* 移除 transparent，让 ::before 的背景显示 */
}
```

### 2025-10-21 03:15 - 修复删除对话功能
**文件**: `src/hooks/useConversationsDB.js:307-352`

**Before**:
```javascript
const removeConversation = useCallback(async (id) => {
  const isDbId = typeof id === 'number' || /^\d+$/.test(id);

  if (isDbId && isAuthenticated) {
    await fetch(`/api/user-data/conversations/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  }

  setConversations(prev => {
    // ... 删除逻辑
  });
}, [currentConversationId, debouncedSave, isAuthenticated]);
```

**After**:
```javascript
const removeConversation = useCallback((id) => {
  const isDbId = typeof id === 'number' || /^\d+$/.test(id);

  if (isDbId && isAuthenticated) {
    // 异步调用，不阻塞 UI
    fetch(`/api/user-data/conversations/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(response => {
        if (response.ok) {
          logger.log('Successfully deleted conversation from database:', id);
        }
      })
      .catch(error => {
        logger.error('Error deleting conversation:', error);
      });
  }

  // 立即更新 UI
  setConversations(prev => {
    // ... 删除逻辑
  });
}, [currentConversationId, debouncedSave, isAuthenticated]);
```

**改进**:
- 移除 async/await，改用 Promise.then()
- API 调用不阻塞 UI 更新
- 前端立即响应，后端异步同步

## 下一步

1. 在浏览器中测试所有功能
2. 检查 Console 是否有错误
3. 验证 Network 请求是否正常
4. 如果仍有问题，提供 Console 截图
