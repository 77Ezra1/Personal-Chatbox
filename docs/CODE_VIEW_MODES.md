# 代码视图模式功能文档

## 概述

实现了代码查看和预览的双模式切换功能，优化了编程模式的用户体验。

## 实现日期

2025-10-15

## 功能特性

### 1. 编程模式自动管理

**位置**: `src/components/chat/ChatContainer.jsx`

**功能**:
- ✅ 自动检测HTML代码生成，启用编程模式
- ✅ 当关闭编程模式时，布局自动恢复正常
- ✅ 新对话或无消息时，自动关闭编程模式

**触发条件**:
```javascript
const hasHtmlGeneration =
  /Successfully wrote to\s+[^\s]*\.html/i.test(content) ||
  /创建.*?\.html/i.test(content) ||
  /生成.*?\.html/i.test(content) ||
  /write_file.*?\.html/i.test(content) ||
  (content.includes('```html') && content.length > 500)
```

### 2. 代码/预览双模式切换

**位置**: `src/components/chat/CodePreview.jsx`

**两种模式**:

#### 代码模式 (`code`)
- **用途**: 查看AI实时生成的代码
- **显示**: 语法高亮的代码块
- **适用场景**:
  - AI正在生成代码时
  - 想要查看代码实现细节
  - 复制代码片段

#### 预览模式 (`preview`)
- **用途**: 查看HTML文件的实际效果
- **显示**: iframe渲染的页面
- **适用场景**:
  - 文件生成完成后
  - 查看页面交互效果
  - 测试响应式布局

### 3. 智能模式切换

**自动切换逻辑**:
```javascript
// 如果正在生成代码 -> 代码模式
if (detectedCode && !isGenerationComplete(content)) {
  setViewMode('code')
}
// 如果生成完成 -> 预览模式
else if (detectedFileName) {
  setViewMode('preview')
}
```

**判断生成完成的条件**:
- 包含 "Successfully wrote to"
- 包含 "创建完成"
- 包含 "生成完成"

## UI/UX设计

### 工具栏布局

```
┌────────────────────────────────────────────────────────┐
│ [文件图标] filename.html  [代码][预览] | [刷新][新标签] │
└────────────────────────────────────────────────────────┘
```

### 模式切换按钮

**设计特点**:
- 📱 按钮组样式，带圆角背景
- 🎨 激活状态使用主题色高亮
- 🚫 不可用状态自动禁用（灰色）
- ⚡ 平滑过渡动画

**CSS实现**:
```css
.view-mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--muted);
  padding: 2px;
  border-radius: 8px;
}
```

### 代码视图样式

**特点**:
- 🌑 深色背景 (#1e1e1e)
- 💡 浅色文本 (#d4d4d4)
- 🔤 等宽字体 (Monaco, Menlo, Consolas)
- 📏 自动换行，保持格式

**CSS实现**:
```css
.code-view {
  flex: 1;
  overflow: auto;
  background: #1e1e1e;
  padding: 16px;
}

.code-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-wrap: break-word;
}
```

## 代码提取逻辑

### 文件名检测

**优先级**:
1. "Successfully wrote to xxx.html" (最高优先级)
2. 文件名直接提及 `filename.html`
3. 工具调用结果 (MCP filesystem)

### 代码内容提取

**正则匹配**:
```javascript
const htmlCodeMatch = content.match(/```html\n([\s\S]*?)```/i)
```

**提取范围**:
- 匹配 \`\`\`html 到 \`\`\` 之间的内容
- 自动trim()去除首尾空白
- 保留原始格式（缩进、换行）

## 用户交互流程

### 场景1: AI正在生成代码

```
1. 用户: "创建一个响应式登录页面"
2. AI开始生成代码...
3. 系统自动:
   - ✅ 启用编程模式
   - ✅ 显示右侧面板
   - ✅ 切换到"代码"模式
   - ✅ 实时显示代码
```

### 场景2: 代码生成完成

```
1. AI完成文件写入
2. 消息包含: "Successfully wrote to login.html"
3. 系统自动:
   - ✅ 切换到"预览"模式
   - ✅ 加载iframe预览
   - ✅ 显示文件名
```

### 场景3: 用户手动切换

```
1. 点击"代码"按钮 -> 查看代码实现
2. 点击"预览"按钮 -> 查看页面效果
3. 禁用状态:
   - 代码未生成 -> "代码"按钮禁用
   - 文件未写入 -> "预览"按钮禁用
```

### 场景4: 关闭编程模式

```
1. 用户点击头部的"编程模式"按钮关闭
2. 系统自动:
   - ✅ 隐藏右侧面板
   - ✅ 布局恢复正常聊天模式
   - ✅ 主聊天区域扩展到全宽
```

## 技术实现

### 状态管理

```javascript
const [viewMode, setViewMode] = useState('code')      // 视图模式
const [codeContent, setCodeContent] = useState('')    // 代码内容
const [fileName, setFileName] = useState('')          // 文件名
const [previewUrl, setPreviewUrl] = useState(null)    // 预览URL
```

### 条件渲染

```javascript
{/* 代码视图 */}
{viewMode === 'code' && codeContent && (
  <div className="code-view">
    <pre className="code-content">
      <code>{codeContent}</code>
    </pre>
  </div>
)}

{/* 预览视图 */}
{viewMode === 'preview' && previewUrl && (
  <div className="code-preview-frame">
    <iframe src={previewUrl} ... />
  </div>
)}
```

## 文件变更

### 新增功能

1. **ChatContainer.jsx**
   - 添加空消息检测
   - 自动关闭dev模式逻辑

2. **CodePreview.jsx**
   - viewMode状态管理
   - 代码内容提取
   - 智能模式切换
   - 双模式UI渲染

3. **CodePreview.css**
   - 代码视图样式
   - 模式切换按钮样式
   - 工具栏分隔线

### 导入的图标

```javascript
import { Code2, Monitor } from 'lucide-react'
```

- `Code2`: 代码模式图标
- `Monitor`: 预览模式图标

## 测试场景

### 测试1: 代码实时查看

```
1. 发送: "创建一个HTML页面"
2. 观察: AI生成代码时，右侧显示代码视图
3. 验证: 代码内容实时更新
```

### 测试2: 预览模式切换

```
1. 等待AI完成文件写入
2. 观察: 自动切换到预览模式
3. 验证: iframe正确加载页面
```

### 测试3: 手动切换

```
1. 点击"代码"按钮
2. 验证: 显示代码内容
3. 点击"预览"按钮
4. 验证: 显示页面预览
```

### 测试4: 布局恢复

```
1. 关闭编程模式
2. 验证: 右侧面板消失
3. 验证: 聊天区域恢复全宽
4. 验证: 样式正常
```

## 已知限制

1. **代码高亮**: 当前使用基础样式，未集成语法高亮库
2. **多文件支持**: 仅显示最后检测到的文件
3. **语言支持**: 主要针对HTML，其他语言需扩展

## 未来优化建议

### 短期优化

1. **语法高亮**: 集成 `prism.js` 或 `highlight.js`
2. **代码复制**: 添加"复制代码"按钮
3. **行号显示**: 在代码视图添加行号

### 中期优化

1. **多文件标签**: 支持同时查看多个生成的文件
2. **代码编辑**: 允许在代码视图中直接编辑
3. **热重载**: 代码修改后自动更新预览

### 长期优化

1. **多语言支持**: CSS, JS, JSON等文件
2. **差异对比**: 显示代码修改前后的差异
3. **版本历史**: 保存代码生成的历史版本

## 总结

本次更新实现了以下关键功能：

✅ **灵活的编程模式**: 自动启用/关闭，不影响正常聊天
✅ **双模式查看**: 代码和预览自由切换
✅ **智能切换**: 根据生成状态自动选择最佳模式
✅ **优秀体验**: 平滑过渡，清晰的视觉反馈

这些功能使得用户可以更方便地查看AI生成的代码，同时保持了良好的布局灵活性。

