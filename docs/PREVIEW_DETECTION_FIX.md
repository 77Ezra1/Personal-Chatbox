# 预览面板检测修复

## 问题日期
2025-10-15

## 🔴 问题描述

### 用户报告
AI生成HTML页面后，前端预览面板没有正确显示生成的页面。

### 表现症状
1. 用户输入"帮我写一个简单的HTML页面"
2. 后端成功生成文件：`Successfully wrote to simple_page.html`
3. 但前端预览面板没有自动显示
4. 编程模式没有自动启用
5. 浏览器控制台显示：`Unchecked runtime.lastError: can not use with devtools`（这是无关的浏览器扩展警告）

### 问题根源

**前端检测逻辑只检查了assistant消息，忽略了tool消息**

```
后端流程:
1. AI调用工具: filesystem_write_file
2. 工具返回结果(role: 'tool'): "Successfully wrote to simple_page.html"
3. AI生成最终回复(role: 'assistant'): "我已经创建了..."

前端检测逻辑:
❌ 只检查 role === 'assistant' 的消息
✅ 应该同时检查 role === 'tool' 的消息
```

**为什么会漏检？**

1. 文件写入的成功消息在**tool消息**中
2. AI的最终回复可能不包含"Successfully wrote to"这样的关键字
3. 前端只查找assistant消息的content

## 解决方案

### 修复1: ChatContainer自动启用devMode

**文件**: `src/components/chat/ChatContainer.jsx`

**修改前**:
```javascript
// 只检查assistant消息
const lastAiMessage = [...messages].reverse().find(msg => msg.role === 'assistant')
if (!lastAiMessage || !lastAiMessage.content) return

const content = lastAiMessage.content
const hasFileWrite = /Successfully wrote to\s+[^\s]*\.html/i.test(content)
```

**修改后**:
```javascript
// 检查最近的15条消息，包括tool和assistant消息
const recentMessages = messages.slice(-15)
let hasFileWrite = false

for (const msg of recentMessages) {
  if (!msg.content) continue
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)

  // ⚡ 关键：检测工具调用结果（tool消息）
  if (msg.role === 'tool') {
    if (content.includes('Successfully wrote to') && content.includes('.html')) {
      console.log('[ChatContainer] Detected HTML file write in tool result')
      hasFileWrite = true
      break
    }
  }

  // 检测AI消息中的文件生成描述
  if (msg.role === 'assistant') {
    if (/Successfully wrote to\s+[^\s]*\.html/i.test(content) ||
        /write_file.*?\.html/i.test(content) ||
        content.includes('filesystem_write_file')) {
      hasFileWrite = true
      break
    }
  }
}

if (hasFileWrite && !devMode) {
  setDevMode(true)
  setShowPreview(true)
}
```

**效果**:
- ✅ 能从tool消息中检测到文件写入
- ✅ 自动启用编程模式
- ✅ 自动显示预览面板

---

### 修复2: CodePreview文件检测

**文件**: `src/components/chat/CodePreview.jsx`

**修改前**:
```javascript
// 只查找assistant消息
for (let i = messages.length - 1; i >= 0; i--) {
  const msg = messages[i]
  if (msg.role === 'assistant' && msg.content) {
    const content = msg.content
    // ... 检测逻辑
  }
}
```

**修改后**:
```javascript
// 查找tool和assistant消息
for (let i = messages.length - 1; i >= 0; i--) {
  const msg = messages[i]
  if (!msg.content) continue

  // ⚡ 关键：同时支持tool和assistant消息
  if (msg.role === 'tool' || msg.role === 'assistant') {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)

    // 检测 "Successfully wrote to xxx.html"
    const successMatch = content.match(/Successfully wrote to\s+([^\s\n]+\.html)/i)
    if (successMatch) {
      detectedFileName = successMatch[1].split(/[\/\\]/).pop()
      console.log('[CodePreview] Detected file:', detectedFileName, 'in', msg.role, 'message')
    }
    // ... 其他检测逻辑
  }
}
```

**效果**:
- ✅ 能从tool消息中提取文件名
- ✅ 正确显示预览URL
- ✅ 预览iframe加载正确的HTML文件

---

## 🔍 调试信息

### 修复后的控制台日志

**成功的检测流程**:
```
[ChatContainer] Detected HTML file write in tool result: {"content":[{"type":"text","text":"Successfully wrote to simple_page.html"}]}
[ChatContainer] Auto-enabling dev mode for file preview
[CodePreview] Checking messages for HTML files and code...
[CodePreview] Detected file from success message: simple_page.html in tool message
```

### 消息结构示例

```javascript
// Tool消息（工具调用结果）
{
  role: 'tool',
  tool_call_id: 'call_xxx',
  content: '{"content":[{"type":"text","text":"Successfully wrote to simple_page.html"}]}'
}

// Assistant消息（AI的最终回复）
{
  role: 'assistant',
  content: '我已经为你创建了一个简单的HTML页面...'
}
```

---

## 📊 修复效果对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| **文件生成检测** | ❌ 只检查assistant消息 | ✅ 检查tool+assistant消息 |
| **devMode自动启用** | ❌ 不生效 | ✅ 正常工作 |
| **预览面板显示** | ❌ 不显示 | ✅ 自动显示 |
| **文件名提取** | ❌ 提取失败 | ✅ 正确提取 |
| **预览URL** | ❌ 无效 | ✅ 正确加载 |

---

## 🎯 测试步骤

1. **刷新浏览器** (`Ctrl+Shift+R`)

2. **发送测试消息**:
   ```
   帮我写一个简单的HTML页面
   ```

3. **预期结果**:
   - ✅ AI开始生成代码
   - ✅ 编程模式自动启用
   - ✅ 右侧预览面板自动显示
   - ✅ 代码模式显示实时生成的HTML代码
   - ✅ 生成完成后自动切换到预览模式
   - ✅ 预览正确显示生成的HTML页面

4. **控制台日志验证**:
   ```
   [ChatContainer] Detected HTML file write in tool result
   [ChatContainer] Auto-enabling dev mode for file preview
   [CodePreview] Detected file from success message: simple_page.html in tool message
   ```

---

## 💡 关键经验

### 1. **消息类型很重要**

```javascript
// ❌ 错误：只检查一种消息类型
if (msg.role === 'assistant') {
  // 可能漏检tool消息中的重要信息
}

// ✅ 正确：检查所有相关消息类型
if (msg.role === 'tool' || msg.role === 'assistant') {
  // 能捕获所有文件生成信息
}
```

### 2. **工具调用的结果在tool消息中**

当AI使用工具时，工具的返回结果会以role='tool'的消息形式添加到对话历史中。

```
AI: 我要写一个文件 → tool call
Tool: Successfully wrote to file.html → role='tool'
AI: 我已经创建了文件 → role='assistant'
```

### 3. **检查最近的多条消息而不只是最后一条**

```javascript
// ❌ 只检查最后一条
const lastMsg = messages[messages.length - 1]

// ✅ 检查最近的N条
const recentMessages = messages.slice(-15)
```

### 4. **content可能不是字符串**

```javascript
// ✅ 安全的内容提取
const content = typeof msg.content === 'string'
  ? msg.content
  : JSON.stringify(msg.content)
```

---

## 📝 相关文件

- `src/components/chat/ChatContainer.jsx` - 自动启用devMode逻辑
- `src/components/chat/CodePreview.jsx` - 文件检测和预览逻辑
- `server/routes/chat.cjs` - 工具调用处理
- `server/services/mcp-manager.cjs` - MCP工具管理

---

## ✅ 状态

**已修复** - 2025-10-15

预览面板现在能够正确检测tool消息中的文件生成信息，自动启用编程模式并显示预览。

