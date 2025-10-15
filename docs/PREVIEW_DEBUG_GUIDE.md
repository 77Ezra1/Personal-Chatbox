# 预览功能调试指南

## 🔍 如何调试预览不显示的问题

### 第1步：打开浏览器开发者工具

1. 在浏览器中按 **F12** 打开开发者工具
2. 切换到 **Console（控制台）** 标签页
3. 清空控制台（点击清除按钮🚫）

### 第2步：测试HTML生成

1. 在聊天框输入：`帮我写一个简单的HTML页面`
2. 等待AI生成完成
3. 观察控制台输出

### 第3步：检查控制台日志

**正常的日志输出应该是这样的：**

```
[ChatContainer] Checking 5 messages for HTML file generation
[ChatContainer] Checking message: user 帮我写一个简单的HTML页面
[ChatContainer] Checking message: assistant <thinking>...
[ChatContainer] Checking message: tool {"content":[{"type":"text","text":"Successfully wrote to simple-page.html"}]}
[ChatContainer] ✅ Detected HTML file write in tool result: {"content":[{"type":"text","text":"Successfully wrote to simple-page.html"}]}
[ChatContainer] hasFileWrite: true devMode: false
[ChatContainer] Auto-enabling dev mode for file preview
[CodePreview] Checking 5 messages for HTML files and code...
[CodePreview] Checking tool message: {"content":[{"type":"text","text":"Successfully wrote to simple-page.html"}]}...
[CodePreview] ✅ Detected file from success message: simple-page.html in tool message
```

### 第4步：检查问题

#### ❌ 如果看到 "Checking 0 messages"
**问题**：messages数组为空
**原因**：对话历史没有正确加载
**解决**：刷新页面（Ctrl+Shift+R）

#### ❌ 如果没有看到 tool 消息
**问题**：tool消息没有被前端接收
**原因**：后端返回的消息格式问题
**解决**：检查后端日志，确认tool消息是否返回

#### ❌ 如果看到 "hasFileWrite: false"
**问题**：检测逻辑没有匹配到文件生成
**原因**：消息内容格式不符合预期
**解决**：查看具体的消息内容，调整检测正则表达式

#### ❌ 如果看到 "hasFileWrite: true" 但没有自动启用devMode
**问题**：devMode切换失败
**原因**：状态更新异常
**解决**：手动点击"编程模式"按钮

### 第5步：手动验证文件

在地址栏访问生成的文件：

```
http://localhost:5173/simple-page.html
```

**预期结果**：
- ✅ 显示生成的HTML页面
- ❌ 如果404，说明文件没有生成或路径错误

---

## 🐛 常见问题和解决方案

### 问题1：右侧面板显示"暂无预览内容"

**可能原因**：
1. devMode没有自动启用
2. CodePreview没有检测到文件名
3. 文件路径不正确

**排查步骤**：
```
1. 检查控制台是否有 "[ChatContainer] Auto-enabling dev mode"
2. 检查控制台是否有 "[CodePreview] ✅ Detected file from success message"
3. 手动点击"编程模式"按钮，看是否出现预览
```

### 问题2：devMode启用了但没有内容

**可能原因**：
- CodePreview组件没有提取到文件名

**排查步骤**：
```
1. 在控制台查找 "[CodePreview]" 开头的日志
2. 确认是否有 "✅ Detected file from success message"
3. 检查提取的文件名是否正确
```

### 问题3：文件生成了但预览不显示

**可能原因**：
- Vite中间件没有正确服务HTML文件
- 文件路径包含特殊字符

**排查步骤**：
```
1. 打开网络(Network)标签页
2. 查看是否有对 /<filename>.html 的请求
3. 检查响应状态码
   - 200: 文件正常加载
   - 404: 文件不存在或路径错误
   - 500: 服务器错误
```

---

## 🔧 调试技巧

### 技巧1：查看messages数组

在控制台执行：
```javascript
// 找到ChatContainer组件
const containers = document.querySelectorAll('[class*="chat-area"]')
console.log('Found containers:', containers.length)
```

### 技巧2：手动触发devMode

在控制台执行：
```javascript
// 点击编程模式按钮
document.querySelector('button[title*="编程"]')?.click()
```

### 技巧3：检查生成的文件

在控制台执行：
```javascript
// 测试文件是否可访问
fetch('/simple-page.html')
  .then(r => r.text())
  .then(html => console.log('File content:', html.substring(0, 200)))
  .catch(e => console.error('File not accessible:', e))
```

---

## 📝 报告问题时需要提供的信息

如果问题仍未解决，请提供以下信息：

1. **控制台完整日志**（从发送消息到生成完成）
2. **网络请求日志**（Network标签页的截图）
3. **后端日志**（包含工具调用和返回）
4. **浏览器版本**
5. **问题复现步骤**

---

## ✅ 快速测试清单

- [ ] 后端服务器运行正常 (http://localhost:3001)
- [ ] 前端服务器运行正常 (http://localhost:5173)
- [ ] 浏览器控制台打开
- [ ] 发送测试消息
- [ ] 观察到 "[ChatContainer]" 日志
- [ ] 观察到 "[CodePreview]" 日志
- [ ] 看到 "✅ Detected" 成功消息
- [ ] devMode自动启用
- [ ] 右侧面板显示内容

---

## 🎯 成功的标志

当一切正常工作时，你应该看到：

1. ✅ 发送消息后，AI开始生成
2. ✅ 控制台显示检测到HTML文件
3. ✅ 编程模式自动启用
4. ✅ 右侧面板自动显示
5. ✅ 代码模式显示实时生成的HTML
6. ✅ 生成完成后切换到预览模式
7. ✅ 预览正确显示HTML页面

---

**更新时间**: 2025-10-15
**版本**: 1.0

