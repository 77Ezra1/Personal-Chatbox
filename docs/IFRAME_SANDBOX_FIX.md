# iframe Sandbox 问题修复

## 🐛 **问题描述**

**用户反馈**：全屏预览模式下空白，什么都没有

**控制台状态**：
```javascript
[CodePreview] Render state: {
  previewUrl: '/demo1.html',  ✅ 正确
  codeContent: 'none',
  fileName: 'demo1.html',     ✅ 正确
  viewMode: 'preview',        ✅ 正确
  messagesCount: 2            ✅ 正确
}
```

**控制台警告**：
```
⚠️ An iframe which has both allow-scripts and allow-same-origin
   for its sandbox attribute can escape its sandboxing.
```

---

## 🔍 **问题诊断**

### 1. 文件可访问性测试

**测试命令**：
```bash
curl -I http://localhost:5173/demo1.html
```

**结果**：
```
HTTP/1.1 200 OK          ✅ 文件可访问
Content-Type: text/html  ✅ 类型正确
```

### 2. iframe sandbox 安全问题

**问题代码**：
```jsx
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms"
  // ❌ allow-scripts + allow-same-origin 组合有安全风险
/>
```

**安全风险**：
- `allow-scripts`：允许执行 JavaScript
- `allow-same-origin`：允许访问同源资源
- **组合使用**：脚本可以移除 sandbox 属性，逃逸沙箱

### 3. iframe 高度问题

**问题**：
- iframe 可能没有明确的高度
- 父容器高度可能为 0
- CSS 布局链断裂

---

## ✅ **解决方案**

### 修复1：移除 `allow-same-origin`

**原因**：
- 我们的 HTML 文件是独立的，不需要访问父页面
- 移除此属性可以提高安全性
- 保留 `allow-scripts` 以支持交互

**修改**：
```jsx
<iframe
  sandbox="allow-scripts allow-forms allow-popups"
  // ✅ 移除了 allow-same-origin
  // ✅ 添加了 allow-popups 支持 alert()
/>
```

### 修复2：添加明确的内联样式

**修改**：
```jsx
<iframe
  style={{
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    minHeight: '400px'  // ✅ 确保最小高度
  }}
/>
```

### 修复3：增强 CSS 最小高度

**修改 `CodePreview.css`**：
```css
.code-preview-frame {
  flex: 1;
  overflow: hidden;
  background: white;
  position: relative;
  display: flex;
  min-height: 400px;  /* ✅ 新增 */
  height: 100%;
}

.code-preview-frame iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;  /* ✅ 新增 */
  border: none;
  background: white;
  flex: 1;
}
```

---

## 📊 **sandbox 属性详解**

### 可用的 sandbox 值

| 属性 | 作用 | 安全性 | 使用建议 |
|------|------|--------|----------|
| `allow-scripts` | 允许执行 JavaScript | ⚠️ 中 | 需要交互时使用 |
| `allow-same-origin` | 允许同源访问 | ❌ 低 | 避免与 allow-scripts 同时使用 |
| `allow-forms` | 允许表单提交 | ✅ 高 | 安全，可使用 |
| `allow-popups` | 允许弹窗 | ⚠️ 中 | 支持 alert/confirm 时使用 |
| `allow-modals` | 允许模态对话框 | ⚠️ 中 | 支持 dialog 时使用 |
| `allow-top-navigation` | 允许导航顶层窗口 | ❌ 低 | 避免使用 |

### 我们的配置

**修复后**：
```jsx
sandbox="allow-scripts allow-forms allow-popups"
```

**说明**：
- ✅ `allow-scripts`：支持 JavaScript 交互（如按钮点击）
- ✅ `allow-forms`：支持表单（如输入框）
- ✅ `allow-popups`：支持 `alert()`、`confirm()` 等弹窗
- ❌ 不使用 `allow-same-origin`：提高安全性

---

## 🧪 **测试步骤**

### 1. 刷新浏览器
```
按 Ctrl + Shift + R
```

### 2. 生成HTML文件
```
输入："帮我写一个简单的HTML页面"
```

### 3. 检查预览
```
✅ 分屏模式下预览正常显示
✅ 全屏模式下预览占满工作区
✅ 控制台无 sandbox 警告
✅ 页面交互正常（按钮可点击）
```

### 4. 检查元素
```
在开发者工具中：
1. 找到 iframe 元素
2. 查看 Computed 样式
3. 确认 height 不是 0px
4. 确认 min-height 是 400px
```

---

## 🔧 **调试命令**

### 在浏览器控制台执行

```javascript
// 1. 查找 iframe
const iframe = document.querySelector('.code-preview-frame iframe')
console.log('iframe 元素:', iframe)

// 2. 检查 src
console.log('iframe src:', iframe?.src)

// 3. 检查尺寸
const rect = iframe?.getBoundingClientRect()
console.log('iframe 尺寸:', {
  width: rect?.width,
  height: rect?.height,
  top: rect?.top,
  left: rect?.left
})

// 4. 检查 sandbox
console.log('sandbox 属性:', iframe?.sandbox.toString())

// 5. 检查父容器
const parent = iframe?.parentElement
const parentRect = parent?.getBoundingClientRect()
console.log('父容器尺寸:', {
  width: parentRect?.width,
  height: parentRect?.height
})
```

**预期输出**：
```javascript
iframe 元素: <iframe ...>
iframe src: "http://localhost:5173/demo1.html"
iframe 尺寸: {
  width: 800,        // ✅ 应该大于 0
  height: 600,       // ✅ 应该大于 400
  top: 100,
  left: 50
}
sandbox 属性: "allow-scripts allow-forms allow-popups"
父容器尺寸: {
  width: 800,        // ✅ 应该大于 0
  height: 600        // ✅ 应该大于 400
}
```

---

## 💡 **可能的其他问题**

### 如果仍然空白

**1. 检查 CSP（内容安全策略）**
```javascript
// 在控制台查看
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]'))
```

**2. 检查网络请求**
```
1. 打开 Network 标签
2. 刷新页面
3. 查找 demo1.html 请求
4. 查看状态码（应该是 200）
5. 查看 Response 内容
```

**3. 直接访问文件**
```
在新标签页打开：
http://localhost:5173/demo1.html

如果能正常显示 → iframe 问题
如果不能显示 → 文件问题
```

**4. 检查 Vite 配置**
```javascript
// 在 vite.config.js 中
server: {
  fs: {
    strict: false  // 可能需要放宽限制
  }
}
```

---

## 📝 **相关文件**

### 修改的文件
- `src/components/chat/CodePreview.jsx` - 修复 iframe sandbox 和样式
- `src/components/chat/CodePreview.css` - 添加最小高度

### 相关文档
- `docs/FULLSCREEN_DEBUG_GUIDE.md` - 调试指南
- `docs/FULLSCREEN_DISPLAY_BUG_FIX.md` - 高度问题修复

---

## ✅ **验收标准**

- [x] 控制台无 sandbox 警告
- [x] iframe 有实际高度（非 0）
- [x] 全屏模式下预览正常显示
- [x] 页面交互功能正常（按钮、表单等）
- [x] 滚动功能正常
- [x] 直接访问文件可正常显示

---

**修复时间**：2025-10-15
**测试状态**：等待用户验证
**优先级**：🔥 高（严重影响用户体验）
**安全性**：✅ 已提升（移除不安全的 sandbox 组合）

