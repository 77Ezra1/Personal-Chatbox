# 🧠 Personal Chatbox 项目知识库

> **目的**: 为 Claude Code 提供项目核心知识的快速参考
> **更新**: 2025-10-17
> **版本**: v2.0

---

## 📋 项目概览

### 基本信息

| 项目 | 信息 |
|------|------|
| **名称** | Personal Chatbox |
| **作者** | Ezra |
| **类型** | 全栈AI对话应用 |
| **技术栈** | React + Node.js |
| **数据库** | SQLite (开发) / PostgreSQL (生产) |
| **部署** | 前端:5173 / 后端:3001 |

### 核心功能

1. **多模型支持** - 9大AI服务商
2. **MCP服务集成** - 15+ MCP服务
3. **多模态能力** - 图片上传和视觉分析
4. **智能工具调用** - Function Calling
5. **代理配置** - HTTP/SOCKS5代理支持

---

## 🗂️ 项目结构

### 目录结构

```
Personal-Chatbox/
├── src/                    # 前端React代码
│   ├── components/         # React组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # API服务
│   └── styles/             # 样式文件
│
├── server/                 # 后端Node.js代码
│   ├── routes/             # API路由
│   ├── services/           # 业务逻辑
│   ├── db/                 # 数据库
│   └── middleware/         # 中间件
│
├── docs/                   # 📚 文档目录
│   ├── features/           # 功能文档
│   ├── ui/                 # UI文档
│   ├── database/           # 数据库文档
│   ├── configuration/      # 配置文档
│   ├── guides/             # 用户指南
│   ├── setup/              # 安装配置
│   └── reports/            # 技术报告
│
├── data/                   # 数据目录
│   ├── app.db              # SQLite数据库
│   └── database.json       # JSON fallback
│
└── .claude/                # Claude配置
    ├── settings.local.json # 权限配置
    ├── docs-navigation.md  # 📌 文档导航
    └── project-knowledge.md # 📌 本文件
```

---

## 💾 数据库架构

### 三层降级策略

```
优先级1: PostgreSQL (生产环境)
   ↓
优先级2: better-sqlite3 (开发环境)
   ↓
优先级3: JSON (fallback)
```

### 当前状态

- **开发环境**: SQLite (`data/app.db`)
- **生产环境**: PostgreSQL (可选)
- **JSON备份**: `data/database.json`

### 主要数据表

```sql
-- 用户系统
users                    -- 用户账号
oauth_accounts          -- OAuth登录
sessions                -- 会话管理
login_history           -- 登录历史

-- 对话系统
conversations           -- 对话列表
messages                -- 消息记录

-- 配置数据
user_configs            -- 用户配置
invite_codes            -- 邀请码

-- 扩展功能
password_vault          -- 密码保险库
```

### 详细说明

查看: [docs/database/strategy-guide.md](../docs/database/strategy-guide.md)

---

## 🔌 MCP服务架构

### 服务分类

#### 第一批服务 (无需API Key)
- memory - 记忆管理
- filesystem - 文件系统
- git - Git操作
- sequential_thinking - 顺序思考
- sqlite - 数据库操作
- wikipedia - 维基百科

#### 第二批服务 (需要API Key)
- brave_search - Brave搜索
- github - GitHub集成

### 服务管理

- **管理器**: `server/services/mcp-manager.cjs`
- **配置**: `server/config.cjs`
- **路由**: `server/routes/mcp.cjs`

---

## 🎨 前端架构

### UI框架

- **React** - 主框架
- **TailwindCSS** - 样式
- **Lucide React** - 图标
- **主题** - 深色/浅色切换

### 核心组件

```
src/components/
├── chat/               # 聊天相关
├── settings/           # 设置页面
├── mcp/                # MCP服务UI
└── common/             # 公共组件
```

### 状态管理

- React Hooks
- Context API
- LocalStorage (持久化)

---

## 🔧 后端架构

### Express服务器

**端口**: 3001
**主文件**: `server/index.cjs`

### 路由系统

```javascript
/api/auth             // 认证路由
/api/chat             // 对话路由
/api/mcp              // MCP服务
/api/user-data        // 用户数据
/api/profile          // 用户资料
/api/files            // 文件上传
/api/knowledge        // 知识库
/api/notes            // 笔记管理
/api/documents        // 文档管理
```

### 中间件层

1. **安全中间件** - `middleware/security.cjs`
   - securityHeaders - 安全头
   - authRateLimiter - 认证限流
   - apiRateLimiter - API限流
   - xssProtection - XSS防护

2. **压缩中间件** - `compression`
3. **CORS中间件** - `cors`
4. **日志中间件** - `utils/logger.cjs`

---

## 🔐 安全机制

### 认证系统

- **JWT Token** - 会话管理
- **Session** - 持久化会话
- **OAuth** - 第三方登录

### 安全措施

- Rate Limiting - 请求限流
- XSS Protection - XSS防护
- CORS配置 - 跨域控制
- 密码加密 - bcrypt
- 审计日志 - `logs/audit.log`

---

## 🎯 核心功能模块

### 1. AI对话系统

**支持的模型**:
- OpenAI (GPT-4, GPT-3.5)
- DeepSeek
- Anthropic Claude
- Google Gemini
- Moonshot
- Groq
- Mistral
- Together AI
- 火山引擎

**功能特性**:
- 多模态输入 (文本+图片)
- Function Calling
- 深度思考模式 (o1/o3)
- 对话历史管理

### 2. MCP服务系统

**核心能力**:
- 工具调用
- 资源管理
- 提示词模板
- 服务动态加载

### 3. 笔记管理

**路径**: `docs/features/notes-implementation.md`

**功能**:
- 创建、编辑、删除
- 分类和标签
- 搜索和过滤
- 导入导出

### 4. 文档管理

**路径**: `docs/features/documents-quickstart.md`

**功能**:
- 文档CRUD
- 分类系统
- 访问统计
- 多视图切换

### 5. 密码保险库

**路径**: `docs/features/password-vault.md`

**功能**:
- 密码加密存储
- 主密码保护
- 密码生成器
- 历史记录

### 6. 数据分析

**路径**: `docs/features/analytics-quickstart.md`

**功能**:
- 使用统计
- 数据可视化
- 趋势分析

---

## 🌍 国际化 (i18n)

### 实现状态

- **框架**: React-i18next
- **支持语言**: 中文、英文
- **配置**: `src/locales/`

### 文档

- [i18n快速开始](../docs/features/i18n-quickstart.md)
- [Agent国际化](../docs/features/agents-i18n.md)

---

## 🧪 测试体系

### 测试工具

- **Vitest** - 单元测试
- **Playwright** - E2E测试

### 测试覆盖

- 核心功能测试
- API接口测试
- UI组件测试

### 测试文档

- [测试用例](../docs/TEST_CASES.md)
- [测试计划](../CORE_FEATURES_TEST_PLAN.md)
- [测试报告](../TEST_REPORT.md)

---

## 📦 依赖管理

### 包管理器

**推荐**: pnpm
**替代**: npm

### 关键依赖

**前端**:
```json
{
  "react": "^18.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x"
}
```

**后端**:
```json
{
  "express": "^4.x",
  "better-sqlite3": "^9.x",
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x"
}
```

---

## 🚀 部署流程

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
./start-dev.sh

# 或分别启动
pnpm dev              # 前端:5173
node server/index.cjs # 后端:3001
```

### 生产环境

```bash
# 构建前端
pnpm build

# 启动后端 (PostgreSQL)
DATABASE_URL=postgresql://... node server/index.cjs
```

### 环境变量

**必需**:
- `NODE_ENV` - development/production
- `PORT` - 后端端口 (默认3001)
- `JWT_SECRET` - JWT密钥

**可选**:
- `DATABASE_URL` - PostgreSQL连接串
- `CORS_ORIGIN` - CORS源
- AI服务的API密钥

---

## 🔍 常见问题速查

### Q: 如何添加新的AI模型？

**步骤**:
1. 在 `src/components/settings/ModelSettings.jsx` 添加模型配置
2. 在 `server/routes/chat.cjs` 添加路由处理
3. 更新文档

### Q: 如何添加新的MCP服务？

**步骤**:
1. 在 `server/config.cjs` 添加服务配置
2. 使用 `mcpManager.startService()` 启动
3. 更新UI显示

### Q: better-sqlite3 安装失败怎么办？

**参考**: [docs/setup/BETTER_SQLITE3_INSTALL_GUIDE.md](../docs/setup/BETTER_SQLITE3_INSTALL_GUIDE.md)

**常见原因**:
- 70% 缺少编译工具 (Python, C++编译器)
- 15% Node.js版本不兼容
- 10% 权限问题
- 5% 网络问题

**快速解决**:
```bash
# Windows (管理员权限)
npm install -g windows-build-tools

# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install -y build-essential python3
```

### Q: 数据库迁移怎么做？

**参考**: [docs/database/strategy-guide.md](../docs/database/strategy-guide.md)

**快速方案**:
```bash
# SQLite → PostgreSQL
node scripts/migrate-to-postgres.cjs
```

### Q: 如何调试MCP服务？

**方法**:
1. 查看日志: `logs/backend.log`
2. 检查服务状态: `/api/mcp/status`
3. 查看文档: [docs/guides/MCP_SERVICES_GUIDE.md](../docs/guides/MCP_SERVICES_GUIDE.md)

### Q: UI组件在哪？

**路径**:
- 聊天组件: `src/components/chat/`
- 设置页面: `src/components/settings/`
- 公共组件: `src/components/common/`

### Q: 如何配置代理？

**参考**: [docs/guides/PROXY_CONFIG_CONFIRMATION.md](../docs/guides/PROXY_CONFIG_CONFIRMATION.md)

---

## 📚 关键文档快速访问

### 入门文档

- [README](../README.md) - 项目主页
- [快速开始](../docs/guides/GETTING_STARTED.md) - 新手指南
- [完整用户指南](../docs/guides/MCP_COMPLETE_USER_GUIDE.md)

### 开发文档

- [后端架构](../docs/reports/BACKEND_ARCHITECTURE.md)
- [UI开发指南](../docs/UI_DEVELOPMENT_GUIDE.md)
- [Git提交规范](../docs/configuration/git-commit.md)

### 配置文档

- [API配置](../docs/configuration/api-keys.md)
- [数据库策略](../docs/database/strategy-guide.md)
- [MCP自定义](../docs/configuration/mcp-custom.md)

### 功能文档

- [Agent实现](../docs/features/agent-implementation.md)
- [笔记功能](../docs/features/notes-implementation.md)
- [密码保险库](../docs/features/password-vault.md)

---

## 🎯 最佳实践

### 代码规范

1. **命名规范**
   - 组件: PascalCase (e.g., `ChatMessage.jsx`)
   - 文件: kebab-case (e.g., `user-service.cjs`)
   - 变量: camelCase

2. **Git提交**
   - 遵循 [docs/configuration/git-commit.md](../docs/configuration/git-commit.md)
   - 格式: `type: description`
   - 类型: feat/fix/docs/style/refactor/test/chore

3. **文档更新**
   - 新功能必须更新文档
   - 更新 `DOCUMENTATION_INDEX.md`
   - 保持文档同步

### 安全实践

1. **不要提交敏感信息**
   - API密钥放 `.env`
   - `.env` 在 `.gitignore`

2. **使用环境变量**
   ```javascript
   const apiKey = process.env.OPENAI_API_KEY
   ```

3. **验证用户输入**
   - XSS防护
   - SQL注入防护

---

## 🔗 外部资源

### 官方文档

- [React文档](https://react.dev/)
- [Express文档](https://expressjs.com/)
- [TailwindCSS](https://tailwindcss.com/)

### AI服务商

- [OpenAI](https://platform.openai.com/docs)
- [Anthropic](https://docs.anthropic.com/)
- [DeepSeek](https://platform.deepseek.com/api-docs/)

### MCP相关

- [MCP协议](https://modelcontextprotocol.io/)
- [MCP服务器列表](https://github.com/modelcontextprotocol/servers)

---

## 📊 项目统计

### 代码规模

- **前端**: ~50+ 组件
- **后端**: ~20+ 路由
- **文档**: 90+ markdown文件
- **数据表**: 10+ 表

### 功能模块

- **核心功能**: 10+
- **MCP服务**: 15+
- **AI模型**: 9+
- **数据库**: 3种方案

---

## 🎉 项目亮点

1. **完整的文档系统** - 90+ 专业文档
2. **灵活的数据库方案** - 三层降级策略
3. **丰富的MCP集成** - 15+ 服务
4. **现代化UI** - Apple设计风格
5. **安全可靠** - 多层安全机制
6. **国际化支持** - 中英文双语
7. **专业的代码规范** - 完善的开发流程

---

**提示**: 使用本文件快速了解项目全貌，详细信息请查阅对应的专题文档。

**文档索引**: [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
