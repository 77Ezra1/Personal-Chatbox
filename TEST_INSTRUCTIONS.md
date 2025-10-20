# 前端功能测试指南

## 问题描述
用户报告以下问题：
1. ❌ 鼠标hover对话列表项时显示透明
2. ❌ 删除对话功能点击没反应
3. ❌ 切换对话功能不工作
4. ❌ 重命名对话功能不工作

## 测试前准备

### 1. 强制刷新浏览器
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + F5
```

### 2. 清除浏览器缓存
```
Chrome:
1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"
```

### 3. 打开开发者工具 Console
```
Mac: Cmd + Option + J
Windows: Ctrl + Shift + J
```

## 详细测试步骤

### 测试 1: 检查 hover 效果

**步骤**:
1. 鼠标移动到对话列表的任意对话项上

**预期结果**:
- ✅ 应该看到背景色变化（浅色背景）
- ✅ 不应该是透明的

**如果失败**:
- 按 Cmd+Shift+R 强制刷新
- 检查 Elements 标签，找到 `.conversation-item:hover` 样式
- 截图发给我

---

### 测试 2: 检查切换对话功能

**步骤**:
1. 在 Console 中输入并回车:
```javascript
console.log('Conversations:', Object.keys(window));
```
2. 点击 "新建对话 2"
3. 观察 Console 输出

**预期结果**:
- ✅ 对话应该切换
- ✅ 右侧显示该对话的内容
- ✅ Console 不应该有红色错误

**如果失败**:
- 截图 Console 中的错误信息
- 截图 Network 标签的请求

---

### 测试 3: 检查删除对话功能

**步骤**:
1. 将鼠标移到对话列表的某个对话上
2. 点击右侧的垃圾桶图标 🗑️
3. 在弹出的确认对话框中点击确认
4. 观察 Console 输出

**预期结果**:
- ✅ 应该弹出确认对话框
- ✅ 确认后对话从列表中消失
- ✅ Console 应该显示: `[useConversationsDB] Successfully deleted conversation from database: <id>`
- ✅ Network 标签应该看到 `DELETE /api/user-data/conversations/<id>` 请求

**如果失败**:
- 检查 Console 是否有错误
- 检查是否弹出了确认对话框
- 截图 Console 和 Network 标签

---

### 测试 4: 检查重命名对话功能

**步骤**:
1. 将鼠标移到对话列表的某个对话上
2. 点击右侧的铅笔图标 ✏️
3. 输入新的对话名称，例如 "测试重命名"
4. 按 Enter 键或点击勾选按钮 ✓
5. 观察 Console 输出

**预期结果**:
- ✅ 点击铅笔后应该出现输入框
- ✅ 输入框自动获得焦点并选中文本
- ✅ 按 Enter 或点击勾选后，对话标题更新
- ✅ Console 应该显示保存日志

**如果失败**:
- 检查点击铅笔后是否出现输入框
- 截图 Console 错误信息

---

## 调试命令

### 在 Console 中运行以下命令来检查状态：

```javascript
// 1. 检查所有对话按钮
document.querySelectorAll('.conversation-item').forEach((item, index) => {
  console.log(`对话 ${index}:`, item);
  console.log('  - 主按钮:', item.querySelector('.conversation-item-main'));
  console.log('  - 操作按钮:', item.querySelectorAll('.conversation-action'));
});

// 2. 检查点击事件
const mainButton = document.querySelector('.conversation-item-main');
console.log('主按钮 onclick:', mainButton?.onclick);
console.log('主按钮 event listeners:', getEventListeners(mainButton));

// 3. 测试手动点击
const firstConv = document.querySelector('.conversation-item');
if (firstConv) {
  firstConv.querySelector('.conversation-item-main').click();
  console.log('手动点击执行完成');
}

// 4. 检查 React 属性
const reactKey = Object.keys(firstConv).find(key => key.startsWith('__react'));
console.log('React 内部状态:', firstConv[reactKey]);
```

---

## 检查文件是否最新

### 验证后端代码

运行以下命令检查删除 API 是否存在:
```bash
grep -A 10 "DELETE.*conversations" server/routes/user-data.cjs | head -15
```

应该看到:
```javascript
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conversationId = parseInt(req.params.id, 10);
  ...
```

### 验证前端代码

运行以下命令检查 removeConversation:
```bash
grep -A 5 "const removeConversation" src/hooks/useConversationsDB.js | head -10
```

应该看到:
```javascript
const removeConversation = useCallback((id) => {
  // 判断是否是数据库 ID（需要调用删除 API）
  const isDbId = typeof id === 'number' || ...
```

### 验证 CSS

运行以下命令:
```bash
grep -A 2 "conversation-item:hover {" src/styles/v0-ui-improvements.css
```

应该看到:
```css
.conversation-item:hover {
  border-color: var(--border);
  /* 移除 transparent，让 ::before 的背景显示 */
}
```

---

## 如果所有测试都失败

1. **检查前端开发服务器是否运行**:
```bash
lsof -ti:5173
```

2. **检查后端服务器是否运行**:
```bash
ps aux | grep "node server/index.cjs" | grep -v grep
```

3. **重启前端服务器**:
```bash
# 杀死现有进程
lsof -ti:5173 | xargs kill -9

# 重新启动
npm run dev
```

4. **重启后端服务器**:
```bash
# 杀死现有进程
pkill -9 -f "node server/index.cjs"

# 重新启动
NODE_ENV=development node server/index.cjs > logs/backend.log 2>&1 &
```

5. **完全清除浏览器缓存**:
   - Chrome: chrome://settings/clearBrowserData
   - 选择 "缓存的图片和文件"
   - 点击 "清除数据"

---

## 报告问题

如果测试仍然失败，请提供：

1. ✅ Console 截图（包含所有红色错误）
2. ✅ Network 标签截图（显示 API 请求）
3. ✅ Elements 标签截图（显示对话列表的 HTML 结构）
4. ✅ 具体哪个步骤失败了

我会根据这些信息进一步调试。
