# Personal Chatbox 功能测试报告

生成时间: 2025-10-16

## 一、项目启动测试

### 1.1 后端服务
- ✅ **状态**: 正常运行
- ✅ **端口**: 3001
- ✅ **健康检查**: http://localhost:3001/health
- ✅ **数据库**: PostgreSQL 连接成功

### 1.2 前端服务
- ✅ **状态**: 正常运行
- ✅ **端口**: 5173
- ✅ **访问地址**: http://localhost:5173

### 1.3 已修复的问题
1. ✅ 修复了 `documents.cjs` 中 auth 中间件导入错误
2. ✅ 修复了路由定义顺序问题
3. ✅ 创建了缺失的数据库表(notes, documents 等)

---

## 二、功能模块测试

### 2.1 用户认证功能

#### 登录页面
- **访问地址**: http://localhost:5173/login
- **测试状态**: ⚠️ 需要浏览器测试
- **功能列表**:
  - [ ] 邮箱登录
  - [ ] 注册新用户
  - [ ] OAuth 登录 (如果配置)
  - [ ] 忘记密码

**测试说明**: 请在浏览器中访问登录页面进行测试

---

### 2.2 对话功能 (核心功能)

#### 配置 API 密钥

您提供的测试 API:
- **Provider**: DeepSeek
- **Model**: deepseek-chat
- **API Key**: sk-03db8009812649359e2f83cc738861aa

**配置步骤**:
1. 登录后进入设置页面
2. 找到 "AI 模型配置" 或 "API 配置"
3. 选择 DeepSeek 作为提供商
4. 输入 API Key
5. 选择模型 `deepseek-chat`
6. 保存配置

#### 对话测试项
- [ ] 创建新对话
- [ ] 发送消息并接收回复
- [ ] 多轮对话
- [ ] 代码块渲染
- [ ] Markdown 渲染
- [ ] 思维过程显示 (ThinkingProcess)
- [ ] 消息重新生成
- [ ] 消息编辑
- [ ] 消息删除
- [ ] 对话历史保存

---

### 2.3 侧边栏和会话管理

#### 功能列表
- [ ] 创建新对话
- [ ] 对话列表显示
- [ ] 对话搜索
- [ ] 对话过滤 (高级过滤)
- [ ] 对话重命名
- [ ] 对话删除
- [ ] 对话固定/收藏
- [ ] 对话归档

---

### 2.4 文档管理功能

**访问地址**: http://localhost:5173/documents

#### 功能列表
- [ ] 添加文档链接
- [ ] 文档分类管理
- [ ] 文档标签
- [ ] 文档搜索
- [ ] 文档收藏
- [ ] 文档归档
- [ ] 访问统计
- [ ] 导入/导出文档

**数据库**: ✅ 表已创建

---

### 2.5 笔记功能

**访问地址**: http://localhost:5173/notes

#### 功能列表
- [ ] 创建笔记
- [ ] 编辑笔记 (Markdown 支持)
- [ ] 笔记分类
- [ ] 笔记标签
- [ ] 笔记搜索
- [ ] 笔记收藏
- [ ] 笔记归档
- [ ] 导入/导出笔记

**数据库**: ✅ 表已创建

---

### 2.6 分析页面

**访问地址**: http://localhost:5173/analytics

#### 功能列表
- [ ] 对话统计
- [ ] 使用时长统计
- [ ] Token 使用统计
- [ ] 模型使用分布
- [ ] 时间趋势图
- [ ] 数据可视化

---

### 2.7 MCP 服务集成

#### 已启动的 MCP 服务
从日志可以看到以下服务已启动:
1. ✅ **Memory 记忆系统** - 9 个工具
2. ✅ **Sequential Thinking 推理增强** - 1 个工具
3. ✅ **Filesystem 文件系统** - 14 个工具
4. ✅ **Wikipedia 维基百科** - 4 个工具

#### 内置服务
5. ✅ 天气服务
6. ✅ 时间服务
7. ✅ Dexscreener 加密货币
8. ✅ 网页内容抓取
9. ✅ Playwright 浏览器自动化
10. ✅ 代码编辑器
11. ✅ 命令执行器
12. ✅ 代码质量工具
13. ✅ 测试运行器

#### 需要 API Key 的服务 (已跳过)
- ⚠️ Brave Search 网页搜索
- ⚠️ GitHub 仓库管理

#### 测试项
- [ ] 在对话中调用 MCP 工具
- [ ] Memory 系统存储和检索
- [ ] 文件系统操作
- [ ] Wikipedia 查询
- [ ] 天气查询
- [ ] 网页抓取

**配置说明**: MCP 服务已自动启动,无需额外配置

---

### 2.8 设置和配置页面

**访问地址**: http://localhost:5173/settings

#### 配置项
- [ ] API 配置 (OpenAI, DeepSeek, 其他)
- [ ] 模型选择
- [ ] 系统提示词
- [ ] 主题设置
- [ ] 语言设置
- [ ] 快捷键配置
- [ ] 用户资料设置
- [ ] MCP 服务配置

---

## 三、已知问题和限制

### 3.1 需要配置的功能

以下功能需要相应的 API Key 才能测试:

1. **Brave Search** - 需要 Brave Search API Key
   - 用途: 网页搜索功能

2. **GitHub Integration** - 需要 GitHub Token
   - 用途: GitHub 仓库管理

### 3.2 可能的问题

根据日志,可能存在以下问题:

1. **用户登录密码** - 测试用户 test@example.com 存在,但密码未知
   - 建议: 重置密码或创建新用户

2. **NoteService SQL 语法错误** - 在创建笔记时出现语法错误
   - 需要进一步调试 noteService.cjs

---

## 四、测试步骤建议

### 4.1 基础功能测试 (15-20分钟)

1. **用户认证** (5分钟)
   - 访问 http://localhost:5173
   - 如果未登录,会跳转到登录页
   - 注册一个新用户或使用现有用户登录

2. **配置 DeepSeek API** (2分钟)
   - 进入设置页面
   - 配置提供的 API Key
   - 保存并测试连接

3. **对话功能测试** (10分钟)
   - 创建新对话
   - 发送测试消息,如: "你好,请介绍一下你自己"
   - 测试代码生成: "用 Python 写一个冒泡排序"
   - 测试多轮对话
   - 测试消息编辑和重新生成
   - 测试对话重命名和删除

4. **MCP 工具测试** (3分钟)
   - 测试 Memory: "记住我的名字是 Test User"
   - 测试 Weather: "查询北京的天气"
   - 测试 Wikipedia: "搜索关于人工智能的信息"

### 4.2 扩展功能测试 (10-15分钟)

5. **笔记功能** (5分钟)
   - 创建一个新笔记
   - 使用 Markdown 格式
   - 添加分类和标签
   - 测试搜索功能

6. **文档管理** (5分钟)
   - 添加几个文档链接
   - 创建分类
   - 测试搜索和过滤

7. **分析页面** (2分钟)
   - 查看对话统计
   - 查看使用趋势

8. **设置页面** (3分钟)
   - 测试主题切换
   - 测试语言切换
   - 查看所有配置选项

---

## 五、测试命令参考

### 5.1 启动项目

```bash
# 使用一键启动脚本
./start-dev.sh

# 或者手动启动
# 后端
node server/index.cjs

# 前端 (新终端)
npm run dev
```

### 5.2 停止项目

```bash
# 杀死后端进程
kill $(cat .backend.pid)

# 杀死前端进程
kill $(cat .frontend.pid)
```

### 5.3 查看日志

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

### 5.4 数据库管理

```bash
# 连接到 PostgreSQL
psql postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox

# 查看所有表
\dt

# 查看用户
SELECT * FROM users;

# 查看对话
SELECT * FROM conversations;
```

---

## 六、配置参考

### 6.1 环境变量 (.env)

当前配置:
```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
JWT_SECRET=dfJo4UMXKZLLl/+L5QIEpfXz9kRPG10xonmJjthYzd2Cwq0/0YksdYh0iU2kRVsSe9gnFbCfwkQJb07kzTf5TQ==
SESSION_SECRET=w9cjkawQLdHjPgAHnEi9H44wzwxgJ5eKwmTNL1PA3Jw=
LOG_LEVEL=info
```

### 6.2 DeepSeek API 配置

**在应用设置中配置**:
- Provider: DeepSeek
- API Base URL: https://api.deepseek.com (或默认)
- Model: deepseek-chat
- API Key: sk-03db8009812649359e2f83cc738861aa

---

## 七、预期测试结果

### 7.1 成功标准

- ✅ 用户可以成功注册和登录
- ✅ 可以配置 AI API 并正常对话
- ✅ 对话可以正常保存和加载
- ✅ MCP 工具可以在对话中被调用
- ✅ 笔记和文档功能正常工作
- ✅ 无明显的 UI 错误或崩溃

### 7.2 已知限制

- ⚠️ 某些 MCP 服务需要额外的 API Key
- ⚠️ 文件上传功能可能需要额外配置
- ⚠️ 某些高级功能可能需要 Pro 账户或额外配置

---

## 八、问题反馈

如果在测试过程中发现任何问题,请记录以下信息:

1. 问题描述
2. 重现步骤
3. 浏览器控制台错误 (F12)
4. 后端日志相关内容
5. 截图 (如果适用)

您可以将这些信息反馈给开发团队进行修复。

---

## 九、补充说明

### 9.1 浏览器兼容性

建议使用以下浏览器进行测试:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 9.2 性能说明

- 首次加载可能需要几秒钟
- MCP 服务初始化需要时间
- 建议在本地网络环境下测试以获得最佳性能

---

**测试愉快! 🎉**
