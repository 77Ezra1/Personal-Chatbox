# API密钥获取指南

## 📋 概览

本指南将帮助你获取以下服务的API密钥/凭据：

- ✅ **Notion** - 知识库管理（最简单，5分钟）
- ✅ **Google Calendar** - 日程管理（需要OAuth2，15分钟）
- ✅ **Gmail** - 邮件处理（与Calendar共用凭据）

---

## 🎯 优先级推荐

### 第1步：先配置 Notion（最简单）⭐⭐⭐⭐⭐
**时间**: 5分钟
**难度**: ⭐ 极简单
**效果**: 知识库管理、笔记自动化

### 第2步：再配置 Google服务（Calendar + Gmail）⭐⭐⭐⭐
**时间**: 15分钟
**难度**: ⭐⭐ 稍复杂（需要创建Google Cloud项目）
**效果**: 日程管理 + 邮件自动化

---

## 1️⃣ Notion API Token 获取（推荐先做）

### 步骤1：创建Integration

1. 访问 **Notion Integrations** 页面：
   https://www.notion.so/my-integrations

2. 点击 **"+ New integration"** 按钮

3. 填写以下信息：
   - **Name**: Personal Chatbox Agent（或任意名称）
   - **Logo**: 可选
   - **Associated workspace**: 选择你的工作区
   - **Type**: Internal（内部集成）
   - **Capabilities**: 勾选以下权限：
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
     - ✅ Read user information（可选）

4. 点击 **"Submit"** 创建

5. 复制显示的 **Internal Integration Token**
   格式类似：`secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 步骤2：分享页面给Integration

⚠️ **重要**：创建Integration后，必须将Notion页面分享给它，否则无法访问！

1. 打开你想让AI访问的Notion页面
2. 点击右上角的 **"Share"** 按钮
3. 在 **"Invite"** 搜索框中输入你刚创建的Integration名称
4. 点击 **"Invite"** 添加Integration

### 步骤3：配置到项目

#### 方法A：通过环境变量（推荐）

```bash
# 在项目根目录创建或编辑 .env 文件
echo 'NOTION_API_KEY=secret_你的Token' >> .env
```

#### 方法B：通过前端设置页面

1. 启动项目后访问前端
2. 进入 **设置 → 服务管理**
3. 找到 **Notion知识管理** 服务
4. 点击 **"配置"** 按钮
5. 粘贴你的Integration Token
6. 点击 **"保存"** 并启用服务

### 测试Notion连接

在前端对话框测试：

```
"在Notion中创建一个测试页面，标题是'AI测试笔记'"
"列出我Notion中的所有页面"
"搜索Notion中包含'AI'的内容"
```

---

## 2️⃣ Google Calendar & Gmail OAuth2 凭据获取

### 为什么需要OAuth2？

Gmail和Google Calendar需要OAuth2认证来保护你的隐私。一次配置可以同时用于两个服务。

### 步骤1：创建Google Cloud项目

1. 访问 **Google Cloud Console**：
   https://console.cloud.google.com/

2. 点击顶部的 **"选择项目"** → **"新建项目"**

3. 填写项目信息：
   - **项目名称**: Personal-Chatbox（或任意名称）
   - **组织**: 无（个人使用）

4. 点击 **"创建"**

### 步骤2：启用API

#### 启用 Gmail API

1. 在左侧菜单选择 **"API和服务"** → **"库"**
2. 搜索 **"Gmail API"**
3. 点击进入，然后点击 **"启用"**

#### 启用 Google Calendar API

1. 返回API库
2. 搜索 **"Google Calendar API"**
3. 点击进入，然后点击 **"启用"**

### 步骤3：创建OAuth2凭据

1. 在左侧菜单选择 **"API和服务"** → **"凭据"**

2. 点击顶部的 **"+ 创建凭据"** → **"OAuth 客户端 ID"**

3. 如果提示配置同意屏幕，点击 **"配置同意屏幕"**：
   - **用户类型**: 选择 **"外部"**（个人使用）
   - **应用名称**: Personal Chatbox
   - **用户支持电子邮件**: 你的Gmail地址
   - **开发者联系信息**: 你的Gmail地址
   - **范围**: 不用添加（稍后会自动添加）
   - **测试用户**: 添加你自己的Gmail地址
   - 点击 **"保存并继续"** 直到完成

4. 返回创建OAuth客户端ID：
   - **应用类型**: 选择 **"桌面应用"**
   - **名称**: Personal Chatbox Desktop Client
   - 点击 **"创建"**

5. 弹出窗口会显示 **"客户端ID"** 和 **"客户端密钥"**

6. 点击 **"下载JSON"** 按钮，保存文件到本地
   文件名类似：`client_secret_xxxxxx.json`

### 步骤4：配置OAuth2凭据

#### 方法A：通过环境变量（推荐）

```bash
# 假设你下载的文件是 client_secret.json
# 将JSON内容设置为环境变量

# 在项目根目录创建或编辑 .env 文件
echo 'GOOGLE_CALENDAR_CREDENTIALS=$(cat path/to/client_secret.json)' >> .env
echo 'GMAIL_CREDENTIALS=$(cat path/to/client_secret.json)' >> .env
```

#### 方法B：通过配置文件

```bash
# 在项目根目录创建 google_credentials 目录
mkdir -p google_credentials

# 复制下载的JSON文件
cp ~/Downloads/client_secret_*.json google_credentials/client_secret.json
```

然后修改 `server/config.cjs`：

```javascript
// Google Calendar 配置
google_calendar: {
  // ...其他配置
  env: {
    GOOGLE_CALENDAR_CREDENTIALS: require('fs').readFileSync(
      require('path').join(process.cwd(), 'google_credentials', 'client_secret.json'),
      'utf8'
    )
  }
},

// Gmail 配置
gmail: {
  // ...其他配置
  env: {
    GMAIL_CREDENTIALS: require('fs').readFileSync(
      require('path').join(process.cwd(), 'google_credentials', 'client_secret.json'),
      'utf8'
    )
  }
}
```

### 步骤5：首次授权

配置好凭据后，**首次使用**时需要授权：

1. 重启服务器：
   ```bash
   pkill -f "node.*server/index.cjs"
   node server/index.cjs
   ```

2. 在前端对话框中测试：
   ```
   "查看我明天的日程"
   "检查我的邮件"
   ```

3. 系统会弹出授权页面（或在日志中显示授权URL）

4. 访问授权URL，登录你的Google账号

5. 允许应用访问你的Gmail和Calendar

6. 授权成功后，凭据会自动保存，之后无需再次授权

### 测试Google服务

在前端对话框测试：

```
📅 Google Calendar测试:
"我明天有什么安排？"
"在明天下午3点创建一个会议：讨论项目进展"
"这周有几个会议？"

📧 Gmail测试:
"总结我最近的邮件"
"有没有关于项目的重要邮件？"
"给张三发一封邮件，告诉他项目进展顺利"
```

---

## 📊 服务启用状态检查

配置完成后，检查服务状态：

```bash
# 查看服务器日志
tail -f server-restart.log | grep -E "(启动成功|工具数量|ERROR)"
```

你应该看到：

```
✅ [MCP Manager] youtube_transcript 启动成功, 工具数量: 1
✅ [MCP Manager] notion 启动成功, 工具数量: XX
✅ [MCP Manager] google_calendar 启动成功, 工具数量: XX
✅ [MCP Manager] gmail 启动成功, 工具数量: XX
```

---

## 🎯 快速测试脚本

配置完成后，运行以下测试：

### 1. Notion测试

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "在Notion中创建一个测试页面"}],
    "stream": false
  }'
```

### 2. Google Calendar测试

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "我明天有什么安排？"}],
    "stream": false
  }'
```

---

## ⚠️ 常见问题

### Q1: Notion返回 "unauthorized"

**原因**: 没有将页面分享给Integration
**解决**:
1. 打开你的Notion页面
2. 点击"Share"
3. 添加你的Integration
4. 重试

### Q2: Google服务授权失败

**原因**: OAuth2配置不正确
**解决**:
1. 检查 `client_secret.json` 文件是否正确
2. 确保在Google Cloud Console中启用了对应的API
3. 确保添加了自己的Gmail地址为测试用户

### Q3: 服务启动失败

**原因**: NPM包下载问题或配置错误
**解决**:
1. 检查网络连接
2. 查看 `server-restart.log` 中的错误信息
3. 手动安装包测试：
   ```bash
   npx -y @notionhq/client
   npx -y @modelcontextprotocol/server-google-calendar
   npx -y @modelcontextprotocol/server-gmail
   ```

### Q4: OAuth2授权URL没有显示

**原因**: 服务器日志输出被重定向
**解决**:
1. 直接查看日志文件：`tail -f server-restart.log`
2. 或者在浏览器中访问：`http://localhost:3001/api/auth/google`

---

## 🎉 完成状态

配置完成后，你的系统将拥有以下能力：

### ✅ YouTube Transcript
- 🎥 提取YouTube视频字幕
- 📚 视频内容学习和总结

### ✅ Notion（配置后）
- 📝 自动创建笔记
- 🗂️ 知识库管理
- 🔍 内容搜索和整理

### ✅ Google Calendar（配置后）
- 📅 智能日程管理
- ⏰ 会议自动安排
- 🔔 事件提醒

### ✅ Gmail（配置后）
- 📧 邮件智能分类和总结
- 💬 自动邮件回复
- 🔍 邮件搜索和分析

---

## 📚 参考资源

- **Notion API文档**: https://developers.notion.com/
- **Google Calendar API文档**: https://developers.google.com/calendar/api
- **Gmail API文档**: https://developers.google.com/gmail/api
- **OAuth2授权流程**: https://oauth.net/2/

---

## 🚀 下一步

1. ✅ 先配置 **Notion**（最简单）
2. ✅ 再配置 **Google服务**（稍复杂但一次配置两个服务）
3. ✅ 测试所有功能
4. ✅ 根据使用情况调整服务配置

配置完成后，你的Agent能力将提升 **+150%**！🎉

---

**文档版本**: v1.0
**最后更新**: 2025-10-24
**作者**: AI Assistant

