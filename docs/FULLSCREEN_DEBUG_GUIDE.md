# 全屏预览调试指南

## 🔍 **快速诊断步骤**

### 步骤1：刷新浏览器
```
按 Ctrl + Shift + R（强制刷新）
```

### 步骤2：打开开发者工具
```
按 F12 或 Ctrl + Shift + I
```

### 步骤3：查看控制台日志
```
切换到 Console 标签页
查找以下日志：
- [CodePreview] Render state: { previewUrl, codeContent, fileName, viewMode }
- [CodePreview] Checking ... messages for HTML files
- [CodePreview] ✅ Detected file from success message: ...
```

---

## 🧪 **测试场景**

### 场景1：预览URL是否存在

**检查控制台输出**：
```javascript
[CodePreview] Render state: {
  previewUrl: '/demo.html',         // ✅ 应该有值
  codeContent: '5000 chars',        // ✅ 应该有值
  fileName: 'demo.html',            // ✅ 应该有值
  viewMode: 'preview',              // ✅ 应该是 'preview'
  messagesCount: 10                 // ✅ 应该大于0
}
```

**如果 `previewUrl` 是 `null`**：
- ❌ 文件检测失败
- 需要检查消息格式

**如果 `codeContent` 是 `'none'`**：
- ❌ 代码提取失败
- 需要检查消息内容

### 场景2：元素是否正确渲染

**打开 Elements 标签页**：
```
1. 查找 .chat-area--fullscreen 类
2. 查找 .code-preview-container
3. 查找 iframe 或 .code-view
4. 检查元素的高度是否为 0
```

**预期结构**：
```html
<main class="chat-area chat-area--dev chat-area--fullscreen">
  <header class="chat-header">...</header>
  <div class="chat-split">
    <div class="chat-split-left" style="display: none;">...</div>
    <div class="chat-split-right">
      <div class="devpanel-header">
        <span>编码/预览</span>
        <button class="devpanel-fullscreen">退出全屏</button>
      </div>
      <div class="devpanel-body">
        <div class="code-preview-container">
          <div class="code-preview-toolbar">...</div>
          <!-- 预览模式 -->
          <div class="code-preview-frame">
            <iframe src="/demo.html"></iframe>
          </div>
          <!-- 或代码模式 -->
          <div class="code-view">
            <pre><code>...</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
```

### 场景3：高度计算

**使用 Computed 标签页**：
```
1. 选中 .code-preview-container
2. 查看 Computed 样式
3. 检查以下属性：
   - height: 应该有实际值（如 600px），不应该是 0
   - display: 应该是 flex
   - flex-direction: 应该是 column
```

**检查父容器高度**：
```
.chat-area           → 应该有实际高度
  .chat-split        → 应该有实际高度（flex: 1）
    .chat-split-right → 应该有实际高度（height: 100%）
      .devpanel-body  → 应该有实际高度（flex: 1）
        .code-preview-container → 应该有实际高度
```

---

## 🐛 **常见问题排查**

### 问题1：预览区域高度为 0

**原因**：父容器高度未正确传递

**解决方案**：
```css
/* 检查以下CSS是否生效 */
.chat-split {
  flex: 1;           /* ✅ 必须 */
  min-height: 0;     /* ✅ 必须 */
}

.chat-split-right {
  height: 100%;      /* ✅ 必须 */
}

.code-preview-container {
  height: 100%;      /* ✅ 必须 */
  display: flex;     /* ✅ 必须 */
}
```

### 问题2：iframe 不显示

**原因**：iframe 的 src 不正确或被拦截

**检查**：
```javascript
// 在控制台执行
document.querySelector('.code-preview-frame iframe').src
// 应该输出: "http://localhost:5173/demo.html"
```

**测试访问**：
```
在浏览器新标签页直接访问：
http://localhost:5173/demo.html
```

**如果 404**：
- ❌ 文件不存在或路径不正确
- 检查项目根目录是否有 demo.html

**如果可以访问**：
- ✅ 文件存在
- ❌ iframe 渲染问题
- 检查 iframe 的高度

### 问题3：代码模式不显示

**原因**：`codeContent` 为空或模式切换失败

**检查**：
```javascript
// 在控制台查看状态
// 应该输出组件的状态
```

**手动切换模式**：
```
点击工具栏的"代码"按钮
检查按钮是否变为激活状态
```

---

## 💡 **手动测试方法**

### 方法1：直接注入 HTML

**在控制台执行**：
```javascript
// 强制设置预览URL
const codePreview = document.querySelector('.code-preview-frame iframe')
if (codePreview) {
  codePreview.src = '/demo.html'
  console.log('✅ Manually set iframe src')
} else {
  console.log('❌ iframe not found')
}
```

### 方法2：检查消息内容

**在控制台执行**：
```javascript
// 查看最后一条消息
const messages = /* 从React DevTools或组件props获取 */
console.log('Last message:', messages[messages.length - 1])
```

### 方法3：强制重新检测文件

**操作**：
```
1. 切换到非编程模式（关闭编程模式）
2. 再次切换回编程模式
3. 查看是否触发文件检测
```

---

## 📋 **调试检查清单**

### 基础检查
- [ ] 浏览器已强制刷新（Ctrl+Shift+R）
- [ ] 开发者工具已打开（F12）
- [ ] 控制台没有红色错误
- [ ] HTML 文件已成功生成（检查终端日志）

### 组件检查
- [ ] `CodePreview` 组件已渲染
- [ ] `previewUrl` 有值（如 `/demo.html`）
- [ ] `codeContent` 有值（如 `5000 chars`）
- [ ] `viewMode` 正确（`preview` 或 `code`）

### CSS 检查
- [ ] `.chat-split` 有实际高度（非 0）
- [ ] `.chat-split-right` 有实际高度（非 0）
- [ ] `.code-preview-container` 有实际高度（非 0）
- [ ] iframe 或 `.code-view` 有实际高度（非 0）

### 全屏模式检查
- [ ] `.chat-area--fullscreen` 类已应用
- [ ] `.chat-split-left` 已隐藏（display: none）
- [ ] `.chat-split-right` 占据完整宽度
- [ ] 预览内容可见

---

## 🔧 **临时修复方法**

### 如果预览URL没有检测到

**手动触发**：
```javascript
// 在控制台执行（假设 demo.html 存在）
window.location.reload()
// 或者尝试直接访问
window.open('/demo.html', '_blank')
```

### 如果高度为 0

**临时CSS修复**：
```css
/* 在浏览器开发者工具 Styles 面板手动添加 */
.code-preview-container {
  height: 600px !important;
  min-height: 600px !important;
}
```

---

## 📞 **需要提供的信息**

如果问题仍然存在，请提供以下信息：

1. **控制台日志**：
   ```
   截图或复制所有 [CodePreview] 开头的日志
   ```

2. **元素检查**：
   ```
   .code-preview-container 的 Computed 高度
   .chat-split 的 Computed 高度
   iframe 的 Computed 高度
   ```

3. **网络请求**：
   ```
   打开 Network 标签
   刷新页面
   查找 demo.html 请求
   状态码是多少？（200 / 404 / 其他）
   ```

4. **截图**：
   ```
   - 完整页面截图
   - 开发者工具 Elements 标签页截图
   - 控制台日志截图
   ```

---

**创建时间**：2025-10-15
**适用版本**：全屏预览功能v2.0

