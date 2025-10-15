# Personal Chatbox 功能扩展路线图

**版本**: v5.0 规划
**更新时间**: 2025-10-15
**作者**: Ezra

---

## 📋 总览

本路线图将功能扩展分为 **6 个阶段**，每个阶段独立可交付，按价值和技术依赖排序。

### 阶段概览

| 阶段 | 名称 | 核心功能 | 预计工作量 | 用户价值 |
|------|------|---------|-----------|---------|
| 🟢 Phase 1 | 基础增强 | 搜索、分析、快捷指令 | 2-3天 | ⭐⭐⭐⭐⭐ |
| 🟡 Phase 2 | 智能升级 | 对话总结、模板市场 | 3-4天 | ⭐⭐⭐⭐⭐ |
| 🔵 Phase 3 | 多模态支持 | 图片、语音、文件 | 4-5天 | ⭐⭐⭐⭐ |
| 🟣 Phase 4 | 协作与分享 | 分享、协作、社区 | 3-4天 | ⭐⭐⭐⭐ |
| 🟠 Phase 5 | 高级 AI | RAG、工作流、Agent | 5-7天 | ⭐⭐⭐⭐⭐ |
| 🔴 Phase 6 | 企业级功能 | 团队、商业化、多端 | 7-10天 | ⭐⭐⭐ |

---

## 🟢 Phase 1: 基础增强（立即可用）

**目标**: 提升现有功能的易用性和实用性

### 1.1 智能搜索与过滤 ⭐⭐⭐⭐⭐
**价值**: 快速找到历史对话，提升效率

#### 功能清单
- [x] 全文搜索（对话标题 + 内容）
- [x] 高级过滤器
  - 日期范围选择
  - 模型筛选
  - 标签筛选
- [x] 搜索结果高亮
- [x] 智能排序（相关度 / 时间）
- [x] 搜索历史记录

#### 技术实现
- 前端: 使用 Fuse.js 实现模糊搜索
- 后端: 添加 SQLite FTS（全文搜索）支持
- API: `GET /api/conversations/search?q=xxx&from=xxx&to=xxx&model=xxx`

#### 文件修改
```
src/components/sidebar/
  ├── SearchBar.jsx          (新增)
  ├── AdvancedFilter.jsx     (新增)
  └── Sidebar.jsx            (修改)

server/routes/
  └── user-data.cjs          (修改: 添加搜索接口)
```

---

### 1.2 对话数据分析仪表板 ⭐⭐⭐⭐⭐
**价值**: 了解使用习惯，优化成本

#### 功能清单
- [x] 统计概览
  - 对话总数
  - 消息总数
  - Token 使用量
  - 费用估算
- [x] 可视化图表
  - 使用趋势折线图（每日/每周）
  - 模型使用饼图
  - 工具调用柱状图
  - 时间热力图
- [x] 数据导出（CSV/JSON）

#### 技术实现
- 组件库: Recharts（已安装）
- 数据聚合: 后端定时任务计算统计数据
- 缓存: Redis（可选）或内存缓存

#### 文件结构
```
src/pages/
  └── Analytics.jsx          (新增)

src/components/analytics/
  ├── StatsOverview.jsx      (新增)
  ├── UsageTrendChart.jsx    (新增)
  ├── ModelDistribution.jsx  (新增)
  └── TimeHeatmap.jsx        (新增)

server/services/
  └── analytics.cjs          (新增)
```

---

### 1.3 快捷指令（Slash Commands）⭐⭐⭐⭐
**价值**: 提升输入效率，快速调用功能

#### 功能清单
- [x] 指令触发器（`/` 触发菜单）
- [x] 内置指令
  - `/summary` - 总结当前对话
  - `/translate [语言]` - 翻译最后一条消息
  - `/code` - 代码模式（语法高亮）
  - `/search [关键词]` - 搜索网络
  - `/image` - 图片分析模式
  - `/clear` - 清空对话
  - `/export` - 导出对话
  - `/help` - 查看所有指令
- [x] 自定义指令（用户可添加）
- [x] 指令联想和自动补全

#### 技术实现
- 使用 CMDK（已安装）实现指令面板
- 指令解析器：前端拦截 `/` 开头的输入
- 可扩展架构：支持插件注册新指令

#### 文件结构
```
src/components/chat/
  ├── CommandMenu.jsx        (新增)
  └── MessageInput.jsx       (修改)

src/lib/
  └── commands.js            (新增: 指令注册和解析)
```

---

### 1.4 对话标签管理 ⭐⭐⭐⭐
**价值**: 组织对话，快速分类

#### 功能清单
- [x] 为对话添加标签
- [x] 标签颜色自定义
- [x] 按标签过滤对话
- [x] 标签管理（增删改）
- [x] 智能标签推荐（AI 自动分类）

#### 数据库修改
```sql
-- 新增表
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE conversation_tags (
  conversation_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (conversation_id, tag_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

---

### 1.5 邀请码管理 UI ⭐⭐⭐
**价值**: 方便管理员管理邀请码（已有后端，补充前端）

#### 功能清单
- [x] 邀请码列表展示
- [x] 创建新邀请码
  - 自定义代码
  - 设置使用次数
  - 设置过期时间
  - 添加描述
- [x] 禁用/启用邀请码
- [x] 查看邀请码使用记录
- [x] 批量生成邀请码

#### 权限设计
- 管理员专用页面
- 需要在 users 表添加 `role` 字段
- 权限中间件保护 API

#### 文件结构
```
src/pages/
  └── AdminPanel.jsx         (新增)

src/components/admin/
  ├── InviteCodeList.jsx     (新增)
  ├── CreateInviteCode.jsx   (新增)
  └── InviteCodeStats.jsx    (新增)

server/routes/
  └── admin.cjs              (新增)
```

---

## 🟡 Phase 2: 智能升级

**目标**: 增强 AI 能力，提升对话体验

### 2.1 智能对话总结 ⭐⭐⭐⭐⭐
**价值**: 快速回顾长对话

#### 功能清单
- [x] 自动生成对话摘要
- [x] 提取关键观点（要点列表）
- [x] 生成思维导图（Markdown 格式）
- [x] 总结样式选择
  - 简洁版（3-5 句话）
  - 详细版（分段总结）
  - 结构化（标题 + 要点）
- [x] 总结保存和导出

#### 实现方式
- 调用 AI API 生成总结
- System Prompt 模板优化
- 总结存储在 conversations 表的 `summary` 字段

---

### 2.2 对话模板市场 ⭐⭐⭐⭐⭐
**价值**: 复用优质 Prompt，降低使用门槛

#### 功能清单
- [x] 模板浏览
  - 分类（编程、写作、翻译、分析等）
  - 搜索和过滤
  - 热门/最新排序
- [x] 模板详情
  - 标题、描述、作者
  - 使用次数、评分
  - 示例对话
- [x] 一键使用模板
- [x] 收藏模板
- [x] 创建和分享自己的模板
- [x] 模板评分和评论

#### 数据库设计
```sql
CREATE TABLE prompt_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  content TEXT NOT NULL, -- Prompt 内容
  is_public INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE template_favorites (
  user_id INTEGER,
  template_id INTEGER,
  PRIMARY KEY (user_id, template_id)
);

CREATE TABLE template_ratings (
  user_id INTEGER,
  template_id INTEGER,
  rating INTEGER, -- 1-5 星
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, template_id)
);
```

---

### 2.3 AI 角色预设（Personas）⭐⭐⭐⭐
**价值**: 快速切换不同对话风格

#### 功能清单
- [x] 内置角色
  - 专业顾问（正式、详细）
  - 幽默助手（轻松、有趣）
  - 简洁模式（直接、高效）
  - 导师模式（教学、引导）
  - 创意伙伴（发散思维）
- [x] 自定义角色
  - 名字、头像
  - 性格描述
  - 专业领域
  - System Prompt 自定义
- [x] 角色快速切换（在对话中切换）
- [x] 角色市场（社区分享）

---

### 2.4 对话历史版本 ⭐⭐⭐
**价值**: 支持消息编辑和分支对话

#### 功能清单
- [x] 编辑历史消息后生成新分支
- [x] 查看和切换不同版本
- [x] 对比不同分支的回答
- [x] 合并分支（选择最佳回答）

#### 实现方式
- 消息表添加 `parent_id` 和 `branch_id` 字段
- 树形结构存储对话分支
- 可视化展示分支（类似 Git 图）

---

## 🔵 Phase 3: 多模态支持

**目标**: 支持图片、语音、文件等多种输入

### 3.1 图片上传与分析 ⭐⭐⭐⭐⭐
**价值**: 支持视觉模型（GPT-4V、Claude 3）

#### 功能清单
- [x] 图片上传（拖拽 / 点击上传）
- [x] 图片预览和管理
- [x] 支持多张图片
- [x] 图片压缩（降低 API 成本）
- [x] OCR 文字识别
- [x] 图表分析
- [x] 图片问答

#### 技术实现
- 文件上传：使用 Multer 中间件
- 存储：本地文件系统 / OSS（阿里云/AWS S3）
- 压缩：Sharp 库
- API：OpenAI Vision API / Claude 3 API

---

### 3.2 语音输入与输出 ⭐⭐⭐⭐
**价值**: 更自然的交互方式

#### 功能清单
- [x] 语音输入（STT - Speech to Text）
  - 按住录音
  - 支持多语言
  - 实时转写
- [x] 语音输出（TTS - Text to Speech）
  - 播放 AI 回复
  - 声音选择（多种音色）
  - 语速调节
- [x] 连续对话模式（免按按钮）

#### 技术实现
- STT：OpenAI Whisper API / 浏览器 Web Speech API
- TTS：OpenAI TTS API / Edge TTS（免费）
- 前端：使用 MediaRecorder API

---

### 3.3 文件上传与解析 ⭐⭐⭐⭐
**价值**: 分析文档内容

#### 功能清单
- [x] 支持文件类型
  - PDF（解析文本）
  - Word/Excel（解析内容）
  - Markdown/TXT（直接读取）
  - CSV（数据分析）
  - 代码文件（代码审查）
- [x] 文件内容提取
- [x] 文件问答（基于文件内容）
- [x] 文件总结

#### 技术实现
- PDF：pdf-parse / pdf.js
- Office：mammoth（Word）、xlsx（Excel）
- 文本提取后注入到对话上下文

---

## 🟣 Phase 4: 协作与分享

**目标**: 支持分享和社区互动

### 4.1 对话分享功能 ⭐⭐⭐⭐⭐
**价值**: 知识传播，增加用户增长

#### 功能清单
- [x] 生成分享链接
  - 公开链接（任何人可访问）
  - 密码保护链接
  - 过期时间设置
- [x] 分享页面
  - 静态快照（不可编辑）
  - 美化展示（类似 ChatGPT Share）
  - SEO 优化
- [x] 分享管理
  - 查看分享列表
  - 撤销分享
  - 查看访问统计
- [x] 社交分享（Twitter、微信、复制链接）

---

### 4.2 对话广场（社区）⭐⭐⭐⭐
**价值**: 构建用户社区，学习优质对话

#### 功能清单
- [x] 浏览公开分享的对话
- [x] 分类和标签
- [x] 搜索和过滤
- [x] 点赞和收藏
- [x] 评论功能
- [x] 举报和审核
- [x] 热门/最新排序

---

### 4.3 对话导入导出增强 ⭐⭐⭐
**价值**: 数据迁移和备份

#### 功能清单
- [x] 导出格式
  - JSON（完整数据）
  - Markdown（可读格式）
  - PDF（打印友好）
  - HTML（网页格式）
- [x] 批量导出
- [x] 导入功能
  - 从其他平台导入（ChatGPT、Claude）
  - 格式自动识别
  - 数据清洗和转换

---

## 🟠 Phase 5: 高级 AI 能力

**目标**: 构建智能 Agent 和工作流

### 5.1 知识库（RAG）⭐⭐⭐⭐⭐
**价值**: 基于私有数据的问答

#### 功能清单
- [x] 文档上传和管理
- [x] 自动向量化（Embedding）
- [x] 向量数据库（Chroma / Qdrant / Pinecone）
- [x] 智能检索
- [x] 引用来源展示
- [x] 知识库管理（增删改）
- [x] 多知识库支持

#### 技术架构
```
用户上传文档 → 文本提取 → 分块（Chunking）→
向量化（OpenAI Embeddings）→ 存储到向量数据库 →
用户提问 → 向量检索 → 相关文档片段 → 注入 Prompt → AI 回答
```

---

### 5.2 AI 工作流编排 ⭐⭐⭐⭐⭐
**价值**: 复杂任务自动化

#### 功能清单
- [x] 可视化工作流编辑器
  - 拖拽式节点编排
  - 节点类型
    - LLM 节点（调用模型）
    - 工具节点（调用 MCP 工具）
    - 条件节点（if-then-else）
    - 循环节点（for/while）
    - 变量节点（存储中间结果）
  - 连线和数据流
- [x] 工作流模板库
  - 代码审查流程
  - 文档生成流程
  - 数据分析流程
- [x] 工作流执行
  - 单步调试
  - 执行日志
  - 错误处理

#### 技术参考
- 类似 Dify、LangFlow、Flowise
- 使用 React Flow 实现可视化编辑器

---

### 5.3 智能 Agent（自主 AI）⭐⭐⭐⭐⭐
**价值**: AI 自主完成复杂任务

#### 功能清单
- [x] 任务分解
  - 用户输入目标
  - AI 自动拆解为子任务
  - 生成执行计划
- [x] 自主执行
  - 自动选择工具
  - 执行并验证结果
  - 错误重试（最多 3 次）
- [x] 进度可视化
  - 任务树展示
  - 实时进度更新
  - 中间结果预览
- [x] 人工干预
  - 关键步骤需要确认
  - 可随时暂停和修改

#### 实现架构
- 基于 ReAct（Reasoning + Acting）模式
- 使用 LangChain / AutoGPT 思想
- 工具调用链管理

---

### 5.4 对话上下文优化 ⭐⭐⭐⭐
**价值**: 更长的有效上下文

#### 功能清单
- [x] 智能压缩历史对话
- [x] 关键信息提取和保留
- [x] 上下文窗口管理
- [x] 跨对话记忆（长期记忆）
  - 基于 MCP Memory 服务
  - 自动保存重要信息
  - 智能回忆相关内容

---

## 🔴 Phase 6: 企业级功能

**目标**: 支持团队和商业化

### 6.1 团队协作空间 ⭐⭐⭐⭐
**价值**: 企业和团队使用场景

#### 功能清单
- [x] 工作区（Workspace）
  - 创建和管理工作区
  - 邀请成员加入
  - 成员角色管理（Owner/Admin/Member/Guest）
- [x] 共享资源
  - 共享对话
  - 共享知识库
  - 共享 Prompt 模板
  - 共享 API Key 池
- [x] 权限管理
  - 精细的权限控制
  - 资源可见性设置
- [x] 使用量统计
  - 团队总用量
  - 成员用量排行
  - 成本分摊

---

### 6.2 订阅和付费系统 ⭐⭐⭐
**价值**: 项目可持续发展

#### 功能清单
- [x] 用户套餐
  - 免费版（限制功能和配额）
  - 专业版（个人用户）
  - 团队版（小团队）
  - 企业版（大型团队）
- [x] 配额管理
  - Token 限制
  - 对话数限制
  - 文件上传限制
- [x] 支付集成
  - Stripe（国际支付）
  - 微信支付
  - 支付宝
- [x] 发票和账单
  - 自动生成发票
  - 账单历史查看
  - 续费提醒

---

### 6.3 移动端和桌面端 ⭐⭐⭐⭐
**价值**: 扩大用户群

#### 移动端（React Native / PWA）
- [x] iOS / Android App
- [x] 核心功能适配
- [x] 移动端专属 UI
- [x] 推送通知
- [x] 离线模式

#### 桌面端（Electron）
- [x] Windows / macOS / Linux
- [x] 系统托盘
- [x] 快捷键唤醒
- [x] 本地模型支持（Ollama 集成）

#### 浏览器插件
- [x] Chrome / Edge / Firefox
- [x] 侧边栏快速访问
- [x] 选中文本翻译/总结
- [x] 网页内容提取

---

### 6.4 高级安全功能 ⭐⭐⭐
**价值**: 企业级安全要求

#### 功能清单
- [x] 端到端加密（E2E）
- [x] 两步验证（2FA）
- [x] 单点登录（SSO）
- [x] IP 白名单
- [x] 审计日志
- [x] 数据备份和恢复
- [x] GDPR 合规（数据导出和删除）

---

## 📊 技术债务与优化

每个阶段实施时需要同步处理的技术优化：

### 性能优化
- [ ] 前端代码分割和懒加载
- [ ] 后端 API 缓存（Redis）
- [ ] 数据库查询优化和索引
- [ ] 图片 CDN 加速
- [ ] WebSocket 长连接优化

### 代码质量
- [ ] TypeScript 迁移（渐进式）
- [ ] 单元测试覆盖率 > 80%
- [ ] E2E 测试完善
- [ ] 代码规范和 Lint 配置
- [ ] 文档完善

### 监控与运维
- [ ] Sentry 错误监控（已集成，需配置）
- [ ] 性能监控（Web Vitals）
- [ ] 日志系统优化
- [ ] CI/CD 流程
- [ ] Docker 容器化部署

---

## 🎯 快速开始

### 立即开始 Phase 1

如果你想立即开始，建议从 **Phase 1.1（智能搜索）** 开始：

```bash
# 1. 阅读详细方案
cat docs/phase1/1.1-smart-search.md

# 2. 查看设计文档
cat docs/phase1/design/search-architecture.md

# 3. 开始开发
# 我会为你生成完整的代码和实现方案
```

---

## 📞 支持与反馈

- 技术问题：参考各阶段的详细文档
- 功能建议：提交 Issue
- 进度跟踪：查看项目看板

---

**祝开发顺利！🚀**
