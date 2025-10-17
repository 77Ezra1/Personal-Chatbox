# 核心功能测试计划 (Core Features Test Plan)

**预计测试时间 / Estimated Time**: 15 分钟 / 15 minutes
**测试日期 / Test Date**: 2025-10-17

## 测试前准备 / Pre-Test Setup

### 1. 启动应用 / Start Application
```bash
./start-dev.sh
# 或 / or
npm run dev
```

### 2. 准备测试数据 / Prepare Test Data
- DeepSeek API Key (获取地址 / Get from: https://platform.deepseek.com/)
- 测试账号 / Test Account:
  - Email: test@example.com
  - Password: Test123456

---

## 核心功能测试清单 / Core Features Checklist

### ✅ 1. 用户登录 (User Login) - 1 分钟

**测试步骤 / Test Steps:**

1. [ ] 打开应用首页 / Open application homepage
   - URL: http://localhost:5173

2. [ ] 测试登录表单 / Test login form
   - [ ] 输入邮箱 / Enter email
   - [ ] 输入密码 / Enter password
   - [ ] 点击登录按钮 / Click login button

3. [ ] 验证登录成功 / Verify successful login
   - [ ] 跳转到聊天界面 / Redirects to chat interface
   - [ ] 显示用户信息 / Shows user information
   - [ ] Token 存储正常 / Token stored correctly

**预期结果 / Expected Result:**
- 登录成功后进入主聊天界面
- 右上角显示用户邮箱或头像
- 本地存储包含 JWT token

---

### ✅ 2. 配置 DeepSeek API (Configure DeepSeek API) - 2 分钟

**测试步骤 / Test Steps:**

1. [ ] 打开设置页面 / Open settings page
   - 点击侧边栏"设置"或"Settings"

2. [ ] 配置 API / Configure API
   - [ ] 选择 DeepSeek 提供商 / Select DeepSeek provider
   - [ ] 输入 API Key
   - [ ] 选择模型 (deepseek-chat)
   - [ ] 点击保存 / Click save

3. [ ] 验证配置 / Verify configuration
   - [ ] 配置保存成功提示 / Success message appears
   - [ ] 刷新页面后配置仍然存在 / Config persists after refresh

**预期结果 / Expected Result:**
- API 配置成功保存
- 可以选择 DeepSeek 模型
- 配置持久化存储

---

### ✅ 3. 发送对话并获得回复 (Send Message & Get Response) - 2 分钟

**测试步骤 / Test Steps:**

1. [ ] 创建新对话 / Create new conversation
   - 点击"新对话"或"New Chat"按钮

2. [ ] 发送测试消息 / Send test messages
   - [ ] **测试 1**: "你好，请介绍一下你自己" / "Hello, please introduce yourself"
   - [ ] **测试 2**: "1+1等于多少？" / "What is 1+1?"
   - [ ] **测试 3**: "解释一下什么是人工智能" / "Explain what AI is"

3. [ ] 验证响应 / Verify responses
   - [ ] AI 回复显示正常 / AI response displays correctly
   - [ ] 消息格式正确 (Markdown 渲染) / Message formatted correctly
   - [ ] 响应时间合理 (<5秒) / Response time reasonable
   - [ ] 可以看到 thinking process (如果模型支持) / Thinking process visible

**预期结果 / Expected Result:**
- 所有消息都能收到 AI 回复
- Markdown 格式正确渲染
- 代码块高亮显示
- 无错误提示

---

### ✅ 4. 测试 MCP 工具 (Test MCP Tools) - 3 分钟

#### 4.1 Memory 工具 / Memory Tool

**测试步骤 / Test Steps:**

1. [ ] 存储信息 / Store information
   - 发送: "请记住: 我的名字是张三，我喜欢编程"
   - 或: "Please remember: My name is John, I like programming"

2. [ ] 检索信息 / Retrieve information
   - 发送: "我的名字是什么？"
   - 或: "What is my name?"

3. [ ] 验证 / Verify
   - [ ] AI 能正确回忆之前存储的信息
   - [ ] Memory 工具在对话中显示

**预期结果 / Expected Result:**
- Memory 功能正常工作
- AI 能记住之前的信息
- 工具调用可见

#### 4.2 天气工具 / Weather Tool

**测试步骤 / Test Steps:**

1. [ ] 查询天气 / Query weather
   - 发送: "北京现在的天气怎么样？"
   - 或: "What's the weather in New York?"

2. [ ] 验证 / Verify
   - [ ] 返回天气信息
   - [ ] 天气工具调用可见
   - [ ] 信息准确

**预期结果 / Expected Result:**
- 返回实时天气数据
- 显示温度、湿度等信息

#### 4.3 Wikipedia 工具 / Wikipedia Tool

**测试步骤 / Test Steps:**

1. [ ] 搜索维基百科 / Search Wikipedia
   - 发送: "帮我查一下人工智能的维基百科"
   - 或: "Search Wikipedia for artificial intelligence"

2. [ ] 验证 / Verify
   - [ ] 返回维基百科摘要
   - [ ] Wikipedia 工具调用可见
   - [ ] 内容相关

**预期结果 / Expected Result:**
- 返回维基百科内容
- 内容准确且格式良好

---

### ✅ 5. 创建和管理对话 (Create & Manage Conversations) - 2 分钟

**测试步骤 / Test Steps:**

1. [ ] 创建多个对话 / Create multiple conversations
   - [ ] 创建对话 1: "技术讨论"
   - [ ] 创建对话 2: "生活助手"
   - [ ] 创建对话 3: "学习笔记"

2. [ ] 对话操作 / Conversation operations
   - [ ] 重命名对话 / Rename conversation
   - [ ] 搜索对话 / Search conversations
   - [ ] 删除对话 / Delete conversation
   - [ ] 切换对话 / Switch between conversations

3. [ ] 验证 / Verify
   - [ ] 对话列表正确显示
   - [ ] 切换对话时内容正确加载
   - [ ] 搜索功能正常
   - [ ] 删除后对话消失

**预期结果 / Expected Result:**
- 所有对话管理功能正常
- 对话内容正确保存和加载
- UI 响应流畅

---

### ✅ 6. 笔记功能 (Notes Feature) - 2 分钟

**测试步骤 / Test Steps:**

1. [ ] 创建笔记 / Create note
   - 点击侧边栏"笔记"或"Notes"
   - [ ] 创建笔记 1: "技术要点"
   - [ ] 创建笔记 2: "项目计划"
   - [ ] 添加标签: #技术, #计划

2. [ ] 编辑笔记 / Edit note
   - [ ] 修改标题
   - [ ] 修改内容 (支持 Markdown)
   - [ ] 添加/删除标签

3. [ ] 搜索笔记 / Search notes
   - [ ] 按标题搜索
   - [ ] 按标签过滤
   - [ ] 按内容搜索

4. [ ] 删除笔记 / Delete note
   - [ ] 删除测试笔记
   - [ ] 验证删除成功

**预期结果 / Expected Result:**
- 笔记创建、编辑、搜索、删除功能正常
- Markdown 渲染正确
- 标签系统工作正常

---

### ✅ 7. 文档管理 (Document Management) - 1 分钟

**测试步骤 / Test Steps:**

1. [ ] 添加文档链接 / Add document links
   - 点击侧边栏"文档"或"Documents"
   - [ ] 添加链接 1: "React 文档" - https://react.dev
   - [ ] 添加链接 2: "MDN Web Docs" - https://developer.mozilla.org

2. [ ] 分类管理 / Categorize
   - [ ] 创建分类: "前端开发"
   - [ ] 将文档分配到分类
   - [ ] 按分类过滤

3. [ ] 文档操作 / Document operations
   - [ ] 编辑文档信息
   - [ ] 搜索文档
   - [ ] 删除文档

**预期结果 / Expected Result:**
- 文档链接正确保存
- 分类系统正常工作
- 搜索和过滤功能正常

---

### ✅ 8. 分析页面 (Analytics Page) - 1 分钟

**测试步骤 / Test Steps:**

1. [ ] 打开分析页面 / Open analytics page
   - 点击侧边栏"分析"或"Analytics"

2. [ ] 查看统计信息 / View statistics
   - [ ] 对话总数 / Total conversations
   - [ ] 消息总数 / Total messages
   - [ ] Token 使用量 / Token usage
   - [ ] 模型使用分布 / Model usage distribution
   - [ ] 时间趋势图表 / Time-based charts

3. [ ] 验证数据 / Verify data
   - [ ] 数据准确性
   - [ ] 图表渲染正常
   - [ ] 响应速度

**预期结果 / Expected Result:**
- 统计数据准确显示
- 图表清晰可读
- 数据实时更新

---

### ✅ 9. 主题切换 (Theme Toggle) - 30 秒

**测试步骤 / Test Steps:**

1. [ ] 切换主题 / Toggle theme
   - [ ] 点击主题切换按钮 (月亮/太阳图标)
   - [ ] 切换到暗色模式 / Switch to dark mode
   - [ ] 切换回亮色模式 / Switch back to light mode

2. [ ] 验证 / Verify
   - [ ] 主题立即生效
   - [ ] 所有组件颜色正确
   - [ ] 刷新后主题保持
   - [ ] 对比度和可读性良好

**预期结果 / Expected Result:**
- 主题切换流畅无闪烁
- 所有 UI 元素适配正确
- 用户偏好持久化

---

### ✅ 10. 语言切换 (Language Toggle) - 30 秒

**测试步骤 / Test Steps:**

1. [ ] 切换语言 / Toggle language
   - [ ] 找到语言切换按钮 (通常在设置或顶部栏)
   - [ ] 切换到英文 / Switch to English
   - [ ] 切换到中文 / Switch to Chinese

2. [ ] 验证翻译 / Verify translations
   - [ ] 侧边栏菜单项
   - [ ] 按钮文本
   - [ ] 表单标签
   - [ ] 错误提示
   - [ ] 空状态文本

3. [ ] 验证持久化 / Verify persistence
   - [ ] 刷新页面后语言保持

**预期结果 / Expected Result:**
- 所有界面文本正确翻译
- 切换流畅无延迟
- 语言偏好持久化存储

---

## 测试总结 / Test Summary

### 测试结果记录 / Test Results

| 功能模块 / Feature | 状态 / Status | 备注 / Notes |
|-------------------|---------------|-------------|
| 1. 用户登录 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 2. DeepSeek API 配置 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 3. 对话功能 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 4. MCP 工具 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 5. 对话管理 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 6. 笔记功能 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 7. 文档管理 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 8. 分析页面 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 9. 主题切换 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |
| 10. 语言切换 | ⬜ 通过 / Pass<br>⬜ 失败 / Fail | |

### 问题记录 / Issues Found

1. **问题描述 / Issue Description:**
   -

2. **问题描述 / Issue Description:**
   -

3. **问题描述 / Issue Description:**
   -

---

## 快速测试脚本 / Quick Test Script

如果你想自动化部分测试，可以使用以下脚本:

```bash
#!/bin/bash
# Quick test script

echo "🚀 开始核心功能测试 / Starting core features test"

# 1. 检查服务状态 / Check service status
echo "1️⃣ 检查服务 / Checking services..."
curl -s http://localhost:3001/api/health && echo "✅ Backend OK" || echo "❌ Backend Failed"
curl -s http://localhost:5173 && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

# 2. 测试登录 API / Test login API
echo ""
echo "2️⃣ 测试登录 / Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo "✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo "❌ Login failed"
  exit 1
fi

# 3. 测试对话列表 / Test conversations list
echo ""
echo "3️⃣ 测试对话列表 / Testing conversations..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/conversations/list | grep -q "conversations" \
  && echo "✅ Conversations API OK" || echo "❌ Conversations API Failed"

# 4. 测试笔记 API / Test notes API
echo ""
echo "4️⃣ 测试笔记 / Testing notes..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/notes | grep -q "notes" \
  && echo "✅ Notes API OK" || echo "❌ Notes API Failed"

# 5. 测试文档 API / Test documents API
echo ""
echo "5️⃣ 测试文档 / Testing documents..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/documents | grep -q "documents" \
  && echo "✅ Documents API OK" || echo "❌ Documents API Failed"

echo ""
echo "✨ 测试完成 / Test completed"
```

保存为 `test-core-features.sh` 并运行:
```bash
chmod +x test-core-features.sh
./test-core-features.sh
```

---

## 常见问题排查 / Troubleshooting

### 问题 1: 登录失败
**解决方案:**
- 检查数据库是否初始化
- 确认用户是否已注册
- 查看浏览器控制台错误

### 问题 2: API 配置不生效
**解决方案:**
- 检查 API Key 是否正确
- 确认网络连接正常
- 查看后端日志

### 问题 3: MCP 工具无响应
**解决方案:**
- 确认 MCP 服务已配置
- 检查工具调用权限
- 查看后端 MCP 日志

### 问题 4: 主题/语言切换无效
**解决方案:**
- 清除浏览器缓存
- 检查 localStorage
- 刷新页面

---

## 测试完成检查清单 / Final Checklist

- [ ] 所有 10 项核心功能测试完成
- [ ] 记录所有发现的问题
- [ ] 截图保存关键功能
- [ ] 测试结果已记录
- [ ] 问题已提交到开发团队

---

**测试人员 / Tester:** _________________
**测试日期 / Date:** _________________
**版本号 / Version:** _________________

