# MCP 自定义配置 - 快速开始

## 🚀 5分钟快速上手

### 第1步: 访问配置页面

启动应用后,在浏览器中访问:
```
http://localhost:5173/mcp-custom
```

### 第2步: 浏览服���模板

页面显示了20+个优质MCP服务模板,包括:
- GitHub (代码管理)
- PostgreSQL (数据库)
- Slack (团队协作)
- Notion (笔记管理)
- 等等...

### 第3步: 添加你的第一个服务

让我们添加一个**Filesystem**服务作为示例:

1. 在"服务模板"标签页找到 📁 **Filesystem** 服务
2. 点击卡片上的"添加服务"按钮
3. 无需配置环境变量,直接完成添加
4. 切换到"我的服务"标签页,打开服务开关启用它

### 第4步: 测试服务

在"我的服务"中:
1. 找到刚添加的Filesystem服务
2. 点击刷新图标按钮测试连接
3. 看到"连接成功"提示即表示服务可用

### 第5步: 在对话中使用

现在你可以在聊天对话中让AI使用文件系统功能了:

```
你: 帮我创建一个文件夹叫做"test"
AI: [调用Filesystem服务创建文件夹]
```

## 📝 添加需要API Key的服务

以**GitHub**服务为例:

### 1. 获取GitHub Token

访问 https://github.com/settings/tokens 并:
- 点击"Generate new token" → "Generate new token (classic)"
- 勾选权限: `repo`, `workflow`, `read:org`
- 点击"Generate token"
- 复制生成的token(只显示一次!)

### 2. 添加服务

1. 在模板页面找到 🔧 **GitHub** 服务
2. 点击"添加服务"
3. 在弹出的对话框中粘贴你的GitHub Token
4. 点击"添加服务"

### 3. 启用并测试

1. 在"我的服务"中启用GitHub服务
2. 点击测试按钮验证连接
3. 开始使用!

## 🎯 推荐服务组合

### 组合1: 开发者工具包
- ✅ GitHub (代码管理)
- ✅ Git (版本控制)
- ✅ Filesystem (文件操作)
- ✅ SQLite (数据库)

### 组合2: 团队协作
- ✅ Slack (即时通讯)
- ✅ Notion (文档管理)
- ✅ Jira (项目管理)
- ✅ Google Calendar (日程管理)

### 组合3: 内容创作
- ✅ YouTube (视频信息)
- ✅ Brave Search (网络搜索)
- ✅ Fetch (网页抓取)
- ✅ Puppeteer (浏览器自动化)

## 💡 使用技巧

### 技巧1: 使用搜索快速找到服务

在搜索框输入关键词:
- 输入"数据库"查看所有数据库服务
- 输入"Google"查看所有Google相关服务
- 输入"官方"查看所有官方服务

### 技巧2: 按分类筛选

使用分类下拉菜单快速筛选:
- 开发工具
- 数据库
- 云服务
- 自动化
- 等等...

### 技巧3: 查看详细信息

点击服务卡片上的 ℹ️ 图标查看:
- 完整功能列表
- 配置说明
- 官方文档链接

### 技巧4: 自定义添加服务

如果模板库中没有你需要的服务:
1. 点击右上角"自定义添加"
2. 填写服务信息
3. 配置命令和环境变量
4. 保存并启用

## 🔧 常见服务配置示例

### Slack
```json
{
  "SLACK_BOT_TOKEN": "xoxb-your-token",
  "SLACK_TEAM_ID": "T01234567"
}
```

### MongoDB
```
mongodb://localhost:27017/mydb
```
或使用Atlas:
```
mongodb+srv://username:password@cluster.mongodb.net/mydb
```

### AWS
```json
{
  "AWS_ACCESS_KEY_ID": "AKIA...",
  "AWS_SECRET_ACCESS_KEY": "xxx...",
  "AWS_REGION": "us-east-1"
}
```

### Notion
```json
{
  "NOTION_API_KEY": "secret_..."
}
```

## ⚠️ 注意事项

1. **API密钥安全**: 不要在公共场合分享你的API密钥
2. **权限最小化**: 只授予必要的权限
3. **测试连接**: 添加服务后先测试连接再使用
4. **定期更新**: 定期检查和更新API密钥

## 🎉 下一步

现在你已经掌握了基础操作,可以:

1. 📚 查看[完整使用指南](./MCP_CUSTOM_CONFIGURATION_GUIDE.md)
2. 🔍 探索更多MCP服务模板
3. 💬 在对话中体验AI调用MCP工具
4. 🛠️ 根据需要自定义更多服务

有问题? 查看[完整文档](./MCP_CUSTOM_CONFIGURATION_GUIDE.md#-常见问题)!

---

**提示**: 记得定期备份你的配置! 🔐
