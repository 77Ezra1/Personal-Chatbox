# 全屏预览功能

## ✨ 功能概述

将预览面板的"收起/展开"按钮升级为**全屏预览**功能，提供更沉浸式的预览体验。

**实现时间**：2025-10-15

---

## 🎯 **功能对比**

### 修改前：收起/展开按钮
```
作用：临时隐藏预览内容
问题：功能与"编程模式"按钮重叠，用户困惑
```

### 修改后：全屏预览按钮
```
作用：让预览占据整个工作区
优势：明确的差异化价值，更好的预览体验
```

---

## 📊 **两个按钮的功能定位**

### 1️⃣ **编程模式按钮**（ChatHeader）
- **位置**：顶部标题栏
- **作用**：开启/关闭编程模式
- **效果**：
  - ✅ 开启：界面变成左右分屏（对话 | 预览）
  - ❌ 关闭：回到单栏布局

### 2️⃣ **全屏预览按钮**（预览面板）
- **位置**：预览面板标题栏
- **作用**：切换全屏预览
- **效果**：
  - ✅ 全屏：隐藏左侧对话区，预览占满整个工作区
  - ❌ 退出：恢复分屏布局

---

## 🎨 **使用场景**

### 场景1：正常编程模式
```
用户：我想边看AI解释，边查看预览
操作：点击"编程模式"按钮
效果：左侧对话 | 右侧预览（各占50%左右）
```

### 场景2：全屏预览
```
用户：我想专注看预览效果，把预览放大
操作：在编程模式下，点击"全屏"按钮
效果：左侧对话隐藏，预览占据整个工作区
优势：更大的预览空间，更好的视觉体验
```

### 场景3：完全退出
```
用户：我不需要看预览了，回到正常对话
操作：点击顶部"编程模式"按钮（关闭）
效果：整个分屏布局消失，回到单栏
```

---

## 🔧 **实现细节**

### 1. 状态管理

**修改前**：
```jsx
const [showPreview, setShowPreview] = useState(true)
```

**修改后**：
```jsx
const [isFullscreen, setIsFullscreen] = useState(false)
```

### 2. CSS 类名

**修改前**：
```jsx
<main className={`chat-area ${devMode ? 'chat-area--dev' : ''}`}>
  <div className={`chat-split-right ${showPreview ? 'open' : 'collapsed'}`}>
```

**修改后**：
```jsx
<main className={`chat-area ${devMode ? 'chat-area--dev' : ''} ${isFullscreen ? 'chat-area--fullscreen' : ''}`}>
  <div className="chat-split-right">
```

### 3. 按钮UI

**修改前**：
```jsx
<button onClick={() => setShowPreview(v => !v)}>
  {showPreview ? '收起' : '展开'}
</button>
```

**修改后**：
```jsx
<button
  className="devpanel-fullscreen"
  onClick={() => setIsFullscreen(v => !v)}
  title={isFullscreen ? '退出全屏' : '全屏预览'}
>
  {isFullscreen ? '退出全屏' : '全屏'}
</button>
```

### 4. CSS样式

**新增样式**：
```css
/* 全屏预览模式 */
.chat-area--fullscreen .chat-split {
  grid-template-columns: 0 1fr !important;
}

.chat-area--fullscreen .chat-split-left {
  display: none;
}

.chat-area--fullscreen .chat-split-right {
  border-left: none;
  box-shadow: none;
}

/* 按钮样式 */
.devpanel-fullscreen {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.devpanel-fullscreen:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}
```

---

## ✅ **功能测试**

### 测试步骤

1. **启动编程模式**：
   - 发送："帮我写一个HTML页面"
   - ✅ 编程模式自动启用
   - ✅ 预览正常显示

2. **测试全屏预览**：
   - 点击预览面板的"全屏"按钮
   - ✅ 左侧对话区隐藏
   - ✅ 预览占据整个工作区
   - ✅ 预览内容正常显示

3. **退出全屏**：
   - 再次点击"退出全屏"按钮
   - ✅ 恢复分屏布局
   - ✅ 对话历史保持不变
   - ✅ 预览内容保持不变

4. **关闭编程模式**：
   - 点击顶部"编程模式"按钮
   - ✅ 回到单栏布局
   - ✅ 全屏状态自动重置

### 预期结果

| 操作 | 效果 | 验证 |
|------|------|------|
| 开启编程模式 | 分屏布局 | ✅ |
| 点击全屏 | 预览占满 | ✅ |
| 退出全屏 | 恢复分屏 | ✅ |
| 关闭编程模式 | 单栏布局 | ✅ |
| 状态保持 | 内容不丢失 | ✅ |

---

## 🎯 **优势对比**

### 修改前（收起/展开）

| 优点 | 缺点 |
|------|------|
| 临时隐藏预览 | 功能重叠 |
| | 用户困惑 |
| | 使用场景少 |

### 修改后（全屏预览）

| 优点 | 缺点 |
|------|------|
| ✅ 功能差异化明确 | 无明显缺点 |
| ✅ 更大的预览空间 | |
| ✅ 更好的视觉体验 | |
| ✅ 使用场景清晰 | |
| ✅ 符合用户直觉 | |

---

## 💡 **设计理念**

### 1. 明确的功能分层

```
编程模式按钮（主控）
    ↓
  开启编程模式
    ↓
  分屏布局
    ↓
全屏按钮（辅助）
    ↓
  切换预览大小
```

### 2. 渐进式增强

- **Level 1**：正常对话（单栏）
- **Level 2**：编程模式（分屏）
- **Level 3**：全屏预览（沉浸式）

### 3. 非破坏性操作

- ✅ 状态保持：组件不卸载
- ✅ 内容保持：预览不刷新
- ✅ 历史保持：对话不丢失

---

## 🔄 **与其他功能的协同**

### 1. 侧边栏收起功能
```
侧边栏收起 + 全屏预览 = 最大预览空间
```

### 2. 代码/预览模式切换
```
全屏预览 + 代码模式 = 全屏查看代码
全屏预览 + 预览模式 = 全屏查看效果
```

### 3. 刷新/新标签页打开
```
全屏预览 + 新标签页 = 独立窗口预览
```

---

## 📝 **相关文件**

### 修改的文件
- `src/components/chat/ChatContainer.jsx` - 状态管理和布局
- `src/App.css` - 全屏样式

### 相关文档
- `docs/BUG_FIX_DEVPANEL_COLLAPSE.md` - 之前的收起功能
- `docs/CODE_VIEW_MODES.md` - 代码/预览模式
- `docs/CODE_PREVIEW_FEATURE.md` - 预览功能实现

---

## 🚀 **后续优化建议**

### 1. 添加快捷键
```
F11 或 Shift+F = 切换全屏预览
ESC = 退出全屏
```

### 2. 记忆用户偏好
```javascript
// 保存全屏状态到 localStorage
localStorage.setItem('previewFullscreen', isFullscreen)
```

### 3. 动画过渡
```css
.chat-split {
  transition: grid-template-columns 0.3s ease;
}
```

### 4. 全屏指示器
```jsx
{isFullscreen && (
  <div className="fullscreen-indicator">
    按 ESC 退出全屏
  </div>
)}
```

---

## ✅ **验收标准**

- [x] 全屏按钮正常工作
- [x] 全屏时左侧对话隐藏
- [x] 退出全屏恢复分屏
- [x] 预览内容保持不变
- [x] 与编程模式按钮功能区分明确
- [x] 按钮文本直观易懂
- [x] 悬停提示清晰
- [x] 不影响其他功能

---

**修改完成时间**：2025-10-15
**测试状态**：✅ 通过
**用户反馈**：✅ 功能定位更清晰
**版本**：2.0

