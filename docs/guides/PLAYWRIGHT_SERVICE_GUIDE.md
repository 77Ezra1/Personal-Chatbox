# Playwright浏览器自动化服务使用指南

## 📖 简介

Playwright浏览器自动化服务是集成到Personal Chatbox中的强大MCP服务,允许AI助手通过自然语言指令控制浏览器,执行各种自动化任务。

## ✨ 功能特性

### 1. **网页导航** 🌐
- 访问任何URL
- 自动等待页面加载完成
- 获取页面标题和最终URL

### 2. **内容提取** 📄
- 获取页面文本内容
- 提取页面标题
- 读取当前URL

### 3. **元素交互** 🖱️
- 点击按钮、链接等元素
- 填写表单输入框
- 支持CSS选择器和文本选择器

### 4. **截图功能** 📸
- 截取当前页面
- 支持全页面截图
- 自动保存到指定路径

### 5. **会话管理** 🔄
- 自动管理浏览器实例
- 保持页面状态
- 手动关闭浏览器

## 🛠️ 可用工具

### 1. `navigate_to_url` - 导航到URL

**描述**: 打开指定的网页

**参数**:
```json
{
  "url": "https://example.com"
}
```

**返回**:
```json
{
  "success": true,
  "message": "成功导航到: https://example.com",
  "title": "Example Domain",
  "url": "https://example.com/"
}
```

**使用示例**:
- "打开百度首页"
- "访问 https://github.com"
- "导航到 https://news.ycombinator.com"

---

### 2. `get_page_content` - 获取页面内容

**描述**: 提取当前页面的文本内容

**参数**: 无

**返回**:
```json
{
  "success": true,
  "title": "Example Domain",
  "url": "https://example.com/",
  "content": "Example Domain\nThis domain is for use in illustrative examples..."
}
```

**使用示例**:
- "读取当前页面的内容"
- "这个页面说了什么?"
- "提取页面文本"

---

### 3. `click_element` - 点击元素

**描述**: 点击页面上的按钮、链接等元素

**参数**:
```json
{
  "selector": "button.submit"
}
```

**CSS选择器示例**:
- `"button.submit"` - 点击class为submit的按钮
- `"#login"` - 点击id为login的元素
- `"a[href='/about']"` - 点击指向/about的链接

**文本选择器示例**:
- `"text=登录"` - 点击文本为"登录"的元素
- `"text=/Submit|Send/"` - 点击文本匹配正则的元素

**使用示例**:
- "点击登录按钮"
- "点击页面上的'了解更多'链接"
- "点击提交表单"

---

### 4. `fill_input` - 填写输入框

**描述**: 在输入框中填写文本

**参数**:
```json
{
  "selector": "input[name='username']",
  "text": "myusername"
}
```

**使用示例**:
- "在用户名输入框填写'admin'"
- "在搜索框输入'Playwright'"
- "填写邮箱地址"

---

### 5. `take_screenshot` - 截图

**描述**: 截取当前页面的屏幕截图

**参数**:
```json
{
  "path": "/tmp/screenshot.png"
}
```

**返回**:
```json
{
  "success": true,
  "message": "截图成功",
  "path": "/tmp/screenshot-1234567890.png"
}
```

**使用示例**:
- "截取当前页面"
- "保存页面截图"
- "给这个页面拍个照"

---

### 6. `close_browser` - 关闭浏览器

**描述**: 关闭浏览器实例,释放资源

**参数**: 无

**返回**:
```json
{
  "success": true,
  "message": "浏览器已关闭"
}
```

**使用示例**:
- "关闭浏览器"
- "结束浏览器会话"

## 💡 实际使用场景

### 场景1: 网页信息提取

**用户**: "帮我访问 https://news.ycombinator.com 并告诉我今天的热门新闻"

**AI执行流程**:
1. 调用 `navigate_to_url` 打开Hacker News
2. 调用 `get_page_content` 获取页面内容
3. 分析内容并总结热门新闻

### 场景2: 表单自动填写

**用户**: "帮我在这个网站的搜索框搜索'Playwright'"

**AI执行流程**:
1. 调用 `fill_input` 填写搜索框
2. 调用 `click_element` 点击搜索按钮
3. 调用 `get_page_content` 获取搜索结果

### 场景3: 网页截图

**用户**: "打开GitHub首页并截图"

**AI执行流程**:
1. 调用 `navigate_to_url` 打开GitHub
2. 调用 `take_screenshot` 截取页面
3. 返回截图路径

### 场景4: 多步骤自动化

**用户**: "帮我查看GitHub上Playwright项目的star数"

**AI执行流程**:
1. 调用 `navigate_to_url` 打开 https://github.com/microsoft/playwright
2. 调用 `get_page_content` 获取页面内容
3. 从内容中提取star数并返回

## ⚙️ 技术细节

### 浏览器配置
- **引擎**: Chromium (headless模式)
- **超时**: 30秒(导航), 10秒(元素操作)
- **等待策略**: networkidle (网络空闲)

### 会话管理
- 浏览器实例在首次使用时自动创建
- 多次调用工具会复用同一个浏览器实例
- 需要手动调用 `close_browser` 关闭浏览器
- 浏览器会保持页面状态,支持多步骤操作

### 安全限制
- 运行在无头模式(headless)
- 无法访问需要登录的页面(除非提供cookie)
- 某些网站可能检测并阻止自动化访问

## 🚀 快速开始

### 1. 在Mac本地环境

```bash
# 拉取最新代码
cd Personal Chatbox
git pull origin main

# 安装Playwright依赖
pnpm install

# 安装Playwright浏览器
npx playwright install chromium

# 启动后端服务器
pnpm run server

# 在新终端启动前端
pnpm run dev
```

### 2. 测试服务

在前端对话框中输入:

```
打开 https://example.com 并告诉我页面内容
```

AI应该会:
1. 调用 `navigate_to_url` 打开网页
2. 调用 `get_page_content` 获取内容
3. 总结并返回页面信息

## 📝 注意事项

### 1. **资源管理**
- 浏览器会占用系统资源
- 长时间不用建议关闭浏览器
- 每次对话结束后可以手动关闭

### 2. **网络访问**
- 需要稳定的网络连接
- 某些网站可能有访问限制
- 建议访问公开的、允许爬虫的网站

### 3. **性能考虑**
- 首次启动浏览器需要几秒钟
- 复杂页面加载可能较慢
- 截图文件会占用磁盘空间

### 4. **错误处理**
- 如果元素找不到,会抛出超时错误
- 网络问题会导致导航失败
- 建议使用明确的选择器

## 🔧 故障排除

### 问题1: "浏览器启动失败"

**解决方案**:
```bash
# 重新安装Playwright浏览器
npx playwright install chromium --force
```

### 问题2: "元素找不到"

**解决方案**:
- 检查选择器是否正确
- 使用浏览器开发者工具确认元素存在
- 尝试使用文本选择器: `text=按钮文本`

### 问题3: "页面加载超时"

**解决方案**:
- 检查网络连接
- 某些网站可能需要更长的加载时间
- 可以在代码中调整超时设置

## 🎯 最佳实践

### 1. **明确的指令**
❌ "帮我看看这个网站"
✅ "打开 https://example.com 并提取页面标题"

### 2. **分步操作**
❌ "帮我在网站上完成所有操作"
✅ "先打开网站,然后点击登录按钮,最后填写表单"

### 3. **及时关闭**
```
# 完成操作后
"关闭浏览器"
```

### 4. **使用截图验证**
```
"截取当前页面,让我确认一下"
```

## 📚 扩展阅读

- [Playwright官方文档](https://playwright.dev)
- [CSS选择器教程](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [MCP协议规范](https://modelcontextprotocol.io)

## 🤝 贡献

如果您有改进建议或发现bug,请在GitHub仓库提交Issue或Pull Request!

---

**祝您使用愉快!** 🎉

