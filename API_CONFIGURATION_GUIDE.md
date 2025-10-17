# Personal Chatbox - API 配置指南

## 快速开始

### 测试账号

已为您创建测试账号:
- **邮箱**: finally_works@test.com
- **密码**: Test123456!

### DeepSeek API 配置

您提供的 API 信息:
- **Provider**: DeepSeek
- **Model**: deepseek-chat
- **API Key**: sk-03db8009812649359e2f83cc738861aa

---

## 一、浏览器界面配置 (推荐)

### 1.1 登录系统

1. 打开浏览器访问: http://localhost:5173
2. 使用上面的测试账号登录
3. 登录后会进入对话页面

### 1.2 配置 AI API

**方法一: 在设置页面配置**

1. 点击右上角的设置图标
2. 找到 "API 配置" 或 "AI 模型配置" 部分
3. 选择提供商: `DeepSeek`
4. 输入 API Key: `sk-03db8009812649359e2f83cc738861aa`
5. 选择模型: `deepseek-chat`
6. 点击保存

**方法二: 在对话页面直接配置**

1. 在对话输入框上方可能有模型选择器
2. 点击选择模型
3. 选择 DeepSeek
4. 输入 API Key (首次使用时)
5. 开始对话

---

## 二、API 接口测试 (开发者)

### 2.1 获取 Access Token

```bash
# 登录获取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "finally_works@test.com",
    "password": "Test123456!"
  }'
```

响应示例:
```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "id": "66bbbdb0-509e-4b44-81e3-32d4d93770d4",
    "email": "finally_works@test.com"
  },
  "token": "eyJhbGc..."
}
```

### 2.2 测试对话API

```bash
# 使用你的 token
TOKEN="your_token_here"

# 发送消息
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好,请介绍一下你自己"}
    ],
    "model": "deepseek-chat",
    "stream": false
  }'
```

### 2.3 配置用户 API Key (持久化)

```bash
# 保存 API Key 到用户配置
curl -X POST http://localhost:3001/api/config/api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "provider": "deepseek",
    "apiKey": "sk-03db8009812649359e2f83cc738861aa"
  }'
```

---

## 三、环境变量配置 (可选)

如果想为所有用户设置默认 API Key,可以在 `.env` 文件中添加:

```env
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-03db8009812649359e2f83cc738861aa
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

配置后重启服务:
```bash
kill $(cat .backend.pid)
node server/index.cjs > logs/backend.log 2>&1 &
echo $! > .backend.pid
```

---

## 四、MCP 服务配置

### 4.1 已启动的服务

以下 MCP 服务已自动启动,无需配置:

1. **Memory 记忆系统** - 存储和检索对话记忆
2. **Sequential Thinking** - 推理增强
3. **Filesystem** - 文件系统操作
4. **Wikipedia** - 维基百科查询

### 4.2 内置服务

以下服务也已启用:

- 天气服务
- 时间服务
- Dexscreener 加密货币查询
- 网页内容抓取
- Playwright 浏览器自动化
- 代码编辑器
- 命令执行器
- 代码质量工具
- 测试运行器

### 4.3 需要配置的服务

以下服务需要额外的 API Key:

**Brave Search** (网页搜索)
- 需要 Brave Search API Key
- 配置方法: 在设置页面的 MCP 配置中添加

**GitHub Integration** (仓库管理)
- 需要 GitHub Personal Access Token
- 配置方法: 在设置页面的 MCP 配置中添加

### 4.4 测试 MCP 工具

在对话中可以直接调用 MCP 工具:

```
# 示例对话
用户: "记住我的名字是 Alice"
AI: (会调用 Memory 工具存储)

用户: "查询北京的天气"
AI: (会调用天气服务)

用户: "搜索关于人工智能的维基百科文章"
AI: (会调用 Wikipedia 工具)
```

---

## 五、数据库配置

### 5.1 当前配置

- **数据库类型**: PostgreSQL
- **连接地址**: postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
- **状态**: ✅ 正常运行

### 5.2 已创建的表

- users (用户)
- sessions (会话)
- conversations (对话)
- messages (消息)
- notes (笔记)
- note_categories (笔记分类)
- note_tags (笔记标签)
- documents (文档)
- document_categories (文档分类)
- document_tags (文档标签)
- user_configs (用户配置)
- login_history (登录历史)

### 5.3 数据库管理

```bash
# 连接数据库
psql postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox

# 查看所有表
\dt

# 查看用户
SELECT * FROM users;

# 退出
\q
```

---

## 六、常见问题

### Q1: 对话没有响应?

**可能原因**:
1. API Key 未配置或配置错误
2. 网络问题(代理设置)
3. API 配额用尽

**解决方法**:
1. 检查设置中的 API Key 是否正确
2. 检查浏览器控制台(F12)是否有错误
3. 查看后端日志: `tail -f logs/backend.log`

### Q2: 登录失败?

**解决方法**:
1. 确认使用的是测试账号: finally_works@test.com
2. 密码是: Test123456! (注意大小写和感叹号)
3. 如果仍然失败,查看后端日志排查问题

### Q3: MCP 工具没有被调用?

**可能原因**:
1. AI 模型没有识别到需要调用工具
2. MCP 服务未正常启动

**解决方法**:
1. 使用更明确的指令,如 "请使用 Wikipedia 工具搜索..."
2. 检查 MCP 服务状态:
   ```bash
   curl http://localhost:3001/api/mcp/services
   ```

### Q4: 如何重置密码?

如果忘记密码,可以手动重置:

```bash
# 生成新密码哈希
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewPassword123!', 10));"

# 更新数据库
psql postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox -c \
  "UPDATE users SET password_hash = '新生成的哈希' WHERE email = 'your@email.com';"
```

---

## 七、测试清单

使用以下清单验证系统功能:

### 基础功能
- [ ] 用户登录成功
- [ ] 可以访问主页面
- [ ] 可以查看设置页面

### 对话功能
- [ ] 配置 DeepSeek API Key
- [ ] 创建新对话
- [ ] 发送消息并收到回复
- [ ] 消息正确显示(Markdown渲染)
- [ ] 可以编辑/删除消息

### MCP 工具
- [ ] Memory 工具: "记住我的名字是 Test"
- [ ] 天气工具: "查询北京天气"
- [ ] Wikipedia: "搜索人工智能"
- [ ] 文件系统: "列出当前目录的文件"

### 笔记功能
- [ ] 创建新笔记
- [ ] 编辑笔记(Markdown支持)
- [ ] 搜索笔记
- [ ] 删除笔记

### 文档功能
- [ ] 添加文档链接
- [ ] 创建分类
- [ ] 搜索文档
- [ ] 删除文档

---

## 八、开发者资源

### API 文档

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/chat` | POST | 发送消息 |
| `/api/mcp/services` | GET | MCP服务列表 |
| `/api/mcp/tools` | GET | MCP工具列表 |
| `/api/notes` | GET/POST | 笔记CRUD |
| `/api/documents` | GET/POST | 文档CRUD |
| `/api/config/api-key` | POST | 配置API Key |

### 日志文件

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

### 服务管理

```bash
# 查看服务状态
ps aux | grep "node server/index.cjs"
ps aux | grep "vite"

# 停止服务
kill $(cat .backend.pid)
kill $(cat .frontend.pid)

# 重启服务
./start-dev.sh
```

---

## 九、技术支持

如有问题,请检查:

1. **后端日志**: `tail -f logs/backend.log`
2. **前端日志**: `tail -f logs/frontend.log`
3. **浏览器控制台**: 按 F12 查看错误
4. **网络请求**: 在浏览器 Network 标签查看 API 请求

---

**祝您使用愉快! 🎉**

如有任何问题,请参考 `TEST_REPORT.md` 获取更详细的测试说明。
