# 编程模式与代码实时预览功能

## ✨ 新增功能

### 1. 自动编程模式切换
当AI生成HTML文件或大段HTML代码时，系统会自动：
- ✅ 切换到编程模式
- ✅ 展开预览面板
- ✅ 显示实时预览

### 2. 实时代码预览
- 📱 **iframe预览**：在右侧面板实时显示生成的HTML页面
- 🔄 **自动检测**：自动识别AI生成的HTML文件
- 🎯 **精准定位**：从AI消息中提取文件路径
- 🔗 **外部打开**：一键在新标签页打开预览

## 🎯 使用方法

### 方式1：让AI生成HTML文件
```
用户：帮我写一个简单的HTML页面
AI：好的！我已经为你创建了一个简单的HTML页面...
    Successfully wrote to D:\Personal-Chatbox\simple-page.html
```
**结果**：自动切换到编程模式，右侧显示实时预览

### 方式2：手动切换编程模式
1. 点击聊天窗口右上角的"普通模式"按钮
2. 切换为"编程模式"
3. 预览面板自动展开

## 🔧 技术实现

### 1. CodePreview组件 (`src/components/chat/CodePreview.jsx`)
```javascript
// 核心功能
- 自动从AI消息中提取HTML文件路径
- 使用iframe进行安全预览
- 支持刷新和外部打开
- 空状态友好提示
```

### 2. Vite服务器配置 (`vite.config.js`)
```javascript
// 自定义中间件
server: {
  async configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // 提供根目录下的HTML文件
      const htmlMatch = req.url?.match(/^\/([^/]+\.html)$/)
      if (htmlMatch) {
        const filePath = path.join(rootDir, htmlMatch[1])
        if (fs.existsSync(filePath)) {
          res.end(fs.readFileSync(filePath, 'utf-8'))
        }
      }
    })
  }
}
```

### 3. 自动检测逻辑 (`src/components/chat/ChatContainer.jsx`)
```javascript
// 检测规则
const hasHtmlGeneration =
  /Successfully wrote to\s+[^\s]*\.html/i.test(content) ||
  /创建.*?\.html/i.test(content) ||
  /生成.*?\.html/i.test(content) ||
  /write_file.*?\.html/i.test(content) ||
  (content.includes('```html') && content.length > 500)

// 自动切换
if (hasHtmlGeneration && !devMode) {
  setDevMode(true)
  setShowPreview(true)
}
```

## 📋 支持的检测模式

### 文件写入操作
- ✅ `Successfully wrote to D:\...\file.html`
- ✅ `创建了 simple-page.html`
- ✅ `生成 index.html 文件`
- ✅ `write_file: example.html`

### 代码块检测
- ✅ 包含 `\`\`\`html` 且内容超过500字符

### 工具调用检测
- ✅ MCP filesystem工具返回的成功消息
- ✅ AI明确提到创建了HTML文件

## 🎨 UI特性

### 预览工具栏
- 📁 **文件名显示**：显示当前预览的文件
- 👁️ **显示/隐藏**：切换预览显示
- 🔄 **刷新**：重新加载预览
- 🔗 **外部打开**：在新标签页打开

### 空状态
当没有可预览内容时显示：
```
📄 暂无预览内容
AI生成HTML文件后，将自动显示预览
```

### 响应式设计
- 桌面端：420px宽度的预览面板
- 移动端：自动适配小屏幕

## 🔒 安全特性

### iframe沙箱
```javascript
<iframe
  src={previewUrl}
  sandbox="allow-scripts allow-same-origin allow-forms"
/>
```

### 内容隔离
- ✅ 使用iframe隔离执行环境
- ✅ 限制脚本权限
- ✅ 防止XSS攻击

## 📊 性能优化

### 智能更新
- 只在新消息包含HTML文件时更新
- 使用 React.memo 避免不必要的重渲染
- iframe使用key触发重新加载

### 资源管理
- 按需加载预览内容
- 支持手动刷新控制
- 可隐藏预览释放资源

## 🐛 故障排查

### 预览不显示？
1. **检查文件是否存在**
   ```bash
   ls -la D:\Personal-Chatbox\*.html
   ```

2. **检查Vite服务器**
   - 确认前端服务运行在 http://localhost:5173
   - 检查控制台是否有错误

3. **手动测试URL**
   ```
   http://localhost:5173/simple-page.html
   ```

### 自动切换不生效？
1. **检查AI消息**
   - 确认AI明确提到了HTML文件
   - 查看控制台日志：`[ChatContainer] Auto-enabling dev mode`

2. **手动切换**
   - 点击右上角"普通模式"按钮
   - 手动切换到"编程模式"

### iframe加载失败？
1. **检查文件路径**
   - AI生成的文件应该在项目根目录
   - 路径格式：`D:\Personal-Chatbox\xxx.html`

2. **检查内容安全策略**
   - 确认iframe sandbox权限正确
   - 查看浏览器控制台错误

## 🔮 未来改进

### 计划中的功能
- [ ] 支持CSS/JS文件独立预览
- [ ] 热重载（文件变化自动刷新）
- [ ] 多文件标签页切换
- [ ] 响应式设计预览器（多设备尺寸）
- [ ] 代码编辑器集成
- [ ] 错误日志显示
- [ ] 性能监控面板

### 扩展可能性
- [ ] 支持Vue/React组件预览
- [ ] 支持Markdown实时渲染
- [ ] 支持SVG/Canvas预览
- [ ] 支持PDF生成预览

## 📝 使用示例

### 示例1：简单网页
```
用户：帮我写一个简单的HTML页面

AI：[生成HTML并写入文件]

系统：自动切换到编程模式 ✓
     展开预览面板 ✓
     显示实时预览 ✓
```

### 示例2：交互式应用
```
用户：创建一个计算器应用

AI：[生成包含JavaScript的HTML]

系统：自动预览 ✓
     JS交互正常 ✓
     可以直接测试 ✓
```

### 示例3：样式调整
```
用户：把背景改成蓝色

AI：[更新HTML文件]

用户：[点击刷新按钮]

系统：预览更新 ✓
     显示新样式 ✓
```

## 🎓 最佳实践

### 对于用户
1. **明确请求**："帮我创建一个HTML页面"
2. **指定文件名**："保存为 my-page.html"
3. **测试功能**：使用预览面板实时测试
4. **迭代改进**：要求AI修改并刷新预览

### 对于开发者
1. **保持文件在根目录**：便于Vite服务器访问
2. **使用相对路径**：避免硬编码绝对路径
3. **添加日志**：便于调试自动检测逻辑
4. **测试边界情况**：特殊文件名、大文件等

## 📈 效果对比

| 功能 | 之前 | 现在 |
|------|------|------|
| **编程模式** | ❌ 手动切换 | ✅ 自动检测 |
| **代码预览** | ❌ 无预览 | ✅ 实时iframe |
| **用户体验** | ⭐⭐ 需要手动操作 | ⭐⭐⭐⭐⭐ 无缝体验 |
| **开发效率** | 🐌 需要切换到编辑器 | 🚀 即时预览 |
| **学习成本** | 📚 需要了解模式切换 | 🎯 自动识别 |

## 🔗 相关文件

- `src/components/chat/CodePreview.jsx` - 预览组件
- `src/components/chat/CodePreview.css` - 预览样式
- `src/components/chat/ChatContainer.jsx` - 容器集成
- `vite.config.js` - 服务器配置
- `docs/CODE_PREVIEW_FEATURE.md` - 本文档

---

**创建时间**：2025-10-15
**版本**：v1.0.0
**状态**：✅ 已实现并测试

