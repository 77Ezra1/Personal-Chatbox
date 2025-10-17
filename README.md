# Personal Chatbox

**作者**: Ezra

一个功能强大的AI对话应用,集成了多种AI模型和MCP(Model Context Protocol)服务,提供智能对话、工具调用、代理配置等完整功能。

## 📖 项目简介

Personal Chatbox是一个基于React和Node.js开发的全栈AI对话应用,旨在为用户提供:

- **多模型支持**: 集成9大主流AI服务商(OpenAI、DeepSeek、Anthropic Claude、Google Gemini、Moonshot、Groq、Mistral、Together AI、火山引擎)
- **多模态能力**: 支持图片上传和视觉分析(GPT-4o、Claude 3.5、Gemini 1.5等模型)
- **MCP服务集成**: 支持15+种MCP服务,包括天气查询、搜索、数据库操作、文件管理、浏览器自动化等
- **智能工具调用**: AI可以自动调用合适的工具来完成复杂任务(Function Calling)
- **代理配置**: 支持HTTP/SOCKS5代理,方便国内用户使用
- **深度思考模式**: 支持AI深度思考过程的可视化展示(OpenAI o1/o3系列)
- **现代化UI**: 遵循Apple设计理念,支持深色/浅色主题切换

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/77Ezra1/Personal-Chatbox.git
   cd Personal Chatbox
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```
   详细说明请参考: [docs/setup/INSTALL_DEPENDENCIES.md](docs/setup/INSTALL_DEPENDENCIES.md)

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑.env文件,填入您的API密钥
   ```

4. **启动应用**
   ```bash
   # 一键启动（推荐）
   ./start.sh

   # 或者分别启动
   pnpm dev              # 启动前端(开发模式)
   node server/index.cjs # 启动后端
   ```

### 🧑‍💻 编程能力（工具增强）

新增以下受控工具，供大模型通过 Function Calling 自动调用：

- 代码编辑：`code_editor`（fs_read_file, fs_write_file, find_replace）
- 命令执行：`command_runner`（run_command）
- 质量工具：`linter_formatter`（run_lint, run_format）
- 测试运行：`test_runner`（run_tests, run_e2e）

这些工具会在 `/api/chat` 会话链路中自动注册给模型（已聚合 MCP 与本地服务工具）。

安全与风控：路径限定为当前工作目录；写入提供预览(diff)与文件级互斥锁；命令白名单；所有操作会追加到 `logs/audit.log` 审计日志。

5. **访问应用**
   - 前端: http://localhost:5173
   - 后端: http://localhost:3001

### 🚀 Git 推送脚本

项目提供了便捷的 Git 推送脚本，无需每次输入 SSH 密码：

1. **首次配置（必须）**
   ```bash
   ./setup-ssh-keychain.sh
   ```
   配置 macOS Keychain 记住 SSH 密码，只需运行一次

2. **日常推送**
   ```bash
   # 快速推送（推荐）
   ./quick-push.sh "你的提交信息"

   # 智能推送（交互式）
   ./push-with-auth.sh
   ```

详细说明请参考: [docs/GIT_PUSH_SCRIPTS.md](docs/GIT_PUSH_SCRIPTS.md)

## 📚 使用文档

> 💡 **快速导航**: 查看 **[完整文档索引](DOCUMENTATION_INDEX.md)** 了解所有文档

### 🌟 新手入门 (必读)
- **[快速开始指南](docs/guides/GETTING_STARTED.md)** - 第一次使用必读 ⭐⭐⭐⭐⭐
- **[完整用户指南](docs/guides/MCP_COMPLETE_USER_GUIDE.md)** - 详细的功能说明 ⭐⭐⭐⭐
- **[启动指南](START_GUIDE.md)** - 快速启动项目

### ⚙️ 配置指南
- **[API配置指南](API_CONFIGURATION_GUIDE.md)** - API密钥配置
- **[数据库策略指南](DATABASE_STRATEGY_GUIDE.md)** - 数据库选择和配置 (新增)
- **[代理配置指南](docs/guides/PROXY_CONFIG_CONFIRMATION.md)** - HTTP/SOCKS5代理设置

### 🔌 MCP服务
- **[MCP快速入门](docs/MCP_QUICK_START.md)** - MCP服务快速上手
- **[MCP服务使用指南](docs/guides/MCP_SERVICES_GUIDE.md)** - 详细使用说明
- **[MCP配置指南](docs/guides/MCP_CONFIG_USAGE_GUIDE.md)** - 高级配置
- **[Playwright服务指南](docs/guides/PLAYWRIGHT_SERVICE_GUIDE.md)** - 浏览器自动化

### 🌐 MCP服务资源
- **[免费MCP服务](docs/guides/FREE_MCP_SERVICES.md)** - 免费服务列表
- **[平价MCP服务](docs/guides/AFFORDABLE_MCP_SERVICES.md)** - 性价比服务
- **[国内友好服务](docs/guides/CHINA_FRIENDLY_MCP_SERVICES.md)** - 国内可用
- **[推荐MCP服务](docs/guides/RECOMMENDED_MCP_SERVICES.md)** - 精选推荐
- **[MCP服务定价](docs/guides/MCP_SERVICES_PRICING.md)** - 价格对比

### 🛠️ 安装配置
- **[依赖安装指南](docs/setup/INSTALL_DEPENDENCIES.md)** - 详细安装步骤
- **[Git克隆加速](docs/setup/GIT_CLONE_SPEEDUP.md)** - 国内用户加速
- **[SSH克隆指南](docs/setup/SSH_CLONE_GUIDE.md)** - SSH方式克隆
- **[代理集成指南](docs/setup/PROXY_INTEGRATION_GUIDE.md)** - 系统代理配置
- **[VPN集成指南](docs/setup/VPN_INTEGRATION_GUIDE.md)** - VPN配置

### 🎯 高级功能
- **[AI Agent指南](docs/AI_AGENT_GUIDE.md)** - 智能代理使用
- **[数据分析功能](docs/ANALYTICS_FEATURE_GUIDE.md)** - 数据分析
- **[笔记管理](docs/NOTES_FEATURE.md)** - 笔记功能
- **[文档管理](docs/DOCUMENTS_FEATURE.md)** - 文档功能
- **[国际化指南](docs/I18N_GUIDE.md)** - 多语言支持

### 👨‍💻 开发者文档
- **[后端架构](docs/reports/BACKEND_ARCHITECTURE.md)** - 后端系统设计
- **[UI开发指南](docs/UI_DEVELOPMENT_GUIDE.md)** - UI开发规范
- **[测试用例](docs/TEST_CASES.md)** - 测试规范
- **[Git推送脚本](docs/GIT_PUSH_SCRIPTS.md)** - Git自动化

### 📊 更多文档
查看 **[完整文档索引](DOCUMENTATION_INDEX.md)** 获取:
- 90+ 详细文档列表
- 按场景查找文档
- 关键词搜索索引
- 常见问题FAQ

## 🎯 核心功能

### 1. AI对话
- ✅ 支持9大AI服务商:
  - **OpenAI** (GPT-4o, GPT-4, GPT-3.5, o1/o3系列)
  - **DeepSeek** (deepseek-chat, deepseek-reasoner)
  - **Anthropic** (Claude 4, Claude 3.7/3.5/3 Sonnet, Claude 3 Opus/Haiku)
  - **Google Gemini** (Gemini 2.5/2.0/1.5 Pro, Gemini Flash系列)
  - **Moonshot** (月之暗面 moonshot-v1系列)
  - **Groq** (Mixtral, Llama 3系列, 快速推理)
  - **Mistral** (Mistral Large/Medium/Small)
  - **Together AI** (开源模型集合)
  - **火山引擎** (字节跳动豆包系列)
- ✅ 流式输出,实时显示回复
- ✅ 对话历史记录和管理
- ✅ 深度思考模式可视化(支持OpenAI o1/o3系列)
- ✅ 消息编辑和重新生成
- ✅ 支持自定义添加模型

### 2. 多模态支持 🎨
支持图片上传和视觉分析功能:
- ✅ **OpenAI多模态模型**:
  - GPT-4o / GPT-4o-mini (推荐 - 性价比最高)
  - GPT-4 Turbo (支持视觉)
  - GPT-4 Vision Preview
- ✅ **Anthropic Claude多模态**:
  - Claude Sonnet 4.5 / 4 (最新)
  - Claude 3.7 / 3.5 / 3 Sonnet
  - Claude 3 Opus (最强视觉能力)
  - Claude 3 Haiku (快速经济)
- ✅ **Google Gemini多模态**:
  - Gemini 2.5 Pro (最新)
  - Gemini 2.0 Flash (极速)
  - Gemini 1.5 Pro (200万token上下文)
  - Gemini 1.5 Flash
- ✅ 图片上传(拖拽/点击上传)
- ✅ 图片预览和管理
- ✅ 支持多张图片同时上传
- ✅ Base64编码传输
- ✅ 图片分析、OCR识别、图表解读

### 3. MCP服务集成
已集成15+种MCP服务:
- **天气服务**: 查询全球城市天气
- **时间服务**: 获取世界各地时间
- **多引擎搜索**: 整合多个搜索引擎
- **Brave搜索**: 隐私友好的搜索引擎
- **GitHub集成**: 仓库管理和代码操作
- **SQLite数据库**: 数据库查询和管理
- **文件系统**: 文件读写和管理
- **Playwright**: 浏览器自动化
- **Wikipedia**: 维基百科查询
- **YouTube**: 视频信息获取
- **CoinCap**: 加密货币行情
- **Fetch**: 网页内容抓取
- **Dexscreener**: 加密货币数据
- **Memory**: 记忆存储
- **Git**: Git仓库操作

### 4. 模型配置
- ✅ 支持自定义添加AI模型
- ✅ API密钥按服务商共享
- ✅ 模型参数调节(温度、最大token等)
- ✅ 系统提示词配置(全局/按模型)
- ✅ 深度思考模式开关
- ✅ 思考模式选择(可选/强制/自适应)

### 5. 代理配置
- ✅ 支持HTTP/HTTPS代理
- ✅ 支持SOCKS5代理
- ✅ 代理连接测试
- ✅ 独立的MCP服务代理配置
- ✅ 国内用户友好

### 6. 用户体验
- ✅ 深色/浅色主题切换
- ✅ 响应式设计,支持移动端
- ✅ 中英文双语支持
- ✅ 现代化UI设计(Apple风格)
- ✅ 快捷键支持
- ✅ Markdown渲染(代码高亮、LaTeX公式)
- ✅ 消息复制、下载功能

## 🛠 技术栈

### 前端
- **框架**: React 18 + Vite 5
- **样式**: Tailwind CSS 3
- **UI组件**: shadcn/ui
- **图标**: Lucide Icons
- **状态管理**: React Hooks + Context API
- **数据存储**: IndexedDB (Dexie.js)
- **Markdown渲染**: react-markdown + remark/rehype插件
- **代码高亮**: Prism.js
- **数学公式**: KaTeX
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js 4
- **MCP协议**: @modelcontextprotocol/sdk
- **数据存储**: JSON文件 + 文件系统加密
- **代理支持**: http-proxy-agent, socks-proxy-agent
- **进程管理**: child_process (MCP服务)
- **日志系统**: 自定义Logger (支持文件/控制台输出)

### 开发工具
- **包管理器**: pnpm (推荐) / npm
- **代码质量**: ESLint
- **Git工具**: 自定义Shell脚本
- **测试**: Vitest (可选)

## 📁 项目结构

```
Personal Chatbox/
├── src/                      # 前端源代码
│   ├── components/          # React组件
│   │   ├── chat/           # 对话相关组件
│   │   ├── mcp/            # MCP服务组件
│   │   ├── settings/       # 设置页面组件
│   │   └── ui/             # UI基础组件
│   ├── hooks/              # 自定义Hooks
│   ├── lib/                # 工具库
│   │   └── db/            # IndexedDB操作
│   └── App.jsx            # 主应用组件
├── server/                  # 后端源代码
│   ├── routes/             # API路由
│   ├── services/           # 业务服务
│   │   ├── mcp-manager.cjs    # MCP服务管理
│   │   ├── config-storage.cjs # 配置存储
│   │   └── proxy-manager.cjs  # 代理管理
│   └── index.cjs          # 服务器入口
├── docs/                    # 文档目录
│   ├── guides/             # 用户指南
│   ├── setup/              # 安装配置文档
│   └── reports/            # 技术报告
└── data/                    # 数据存储目录
```

## 🔧 开发指南

### 数据库操作

项目使用IndexedDB作为客户端数据库:

```javascript
// 模型操作
import { getAllModels, saveModel, updateModel } from '@/lib/db/models'

// API Key操作
import { getProviderApiKey, setProviderApiKey } from '@/lib/db/providerApiKeys'

// 系统提示词操作
import { getSystemPromptConfig, setGlobalPrompt } from '@/lib/db/systemPrompts'
```

### 自定义Hooks

```javascript
// 模型配置管理
import { useModelConfigDB } from '@/hooks/useModelConfigDB'

// 系统提示词管理
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'

// MCP服务管理
import { useMcpManager } from '@/hooks/useMcpManager'
```

### API接口

后端提供以下主要API:

- `POST /api/chat` - AI对话接口
- `GET /api/mcp/services` - 获取MCP服务列表
- `POST /api/mcp/call` - 调用MCP工具
- `POST /api/config/service/:serviceId` - 更新服务配置
- `GET /api/proxy/status` - 获取代理状态

详细API文档请参考: [docs/reports/BACKEND_ARCHITECTURE.md](docs/reports/BACKEND_ARCHITECTURE.md)

## 🎨 多模态支持详解

Personal Chatbox 已完整实现多模态(图片/视觉)功能，支持三大主流AI服务商的视觉模型。

### 支持的多模态模型

#### � OpenAI (推荐 - 性价比最高)
- **GPT-4o** - 多模态旗舰模型，16K输出，128K上下文
- **GPT-4o-mini** - 经济型多模态，速度快成本低
- **GPT-4 Turbo** - 支持视觉的GPT-4增强版

#### 🔵 Anthropic Claude (图片理解能力强)
- **Claude Sonnet 4.5/4** - 最新多模态模型
- **Claude 3.7/3.5 Sonnet** - 64K输出，200K上下文
- **Claude 3 Opus** - 最强视觉分析能力
- **Claude 3 Haiku** - 快速经济的多模态模型

#### 🔴 Google Gemini (超大上下文)
- **Gemini 2.5 Pro** - 最新，65K输出，1M+上下文
- **Gemini 2.0 Flash** - 极速响应
- **Gemini 1.5 Pro** - 200万token上下文窗口
- **Gemini 1.5 Flash** - 快速多模态处理

### 多模态功能特性

✅ **图片上传方式**
- 点击上传按钮选择文件
- 拖拽图片到输入区域
- 粘贴剪贴板图片

✅ **支持的图片格式**
- JPEG/JPG
- PNG
- GIF
- WebP
- 其他浏览器支持的格式

✅ **图片处理能力**
- 图片内容描述和分析
- OCR文字识别
- 图表数据解读
- 图像中的问题回答
- 多张图片对比分析

✅ **技术实现**
- Base64编码传输
- 客户端图片预览
- 支持多图片上传
- 自动适配不同服务商API格式

### 使用示例

```javascript
// 前端上传图片
const handleAddAttachment = async (file) => {
  const dataUrl = await readFileAsDataUrl(file)
  const attachment = {
    id: createAttachmentId(),
    name: file.name,
    type: file.type,
    dataUrl,
    category: 'image'
  }
  // 图片将随消息一起发送给AI模型
}
```

### 最佳实践

1. **选择合适的模型**
   - 图片分析: GPT-4o 或 Claude 3.5 Sonnet
   - 快速识别: GPT-4o-mini 或 Gemini Flash
   - 复杂分析: Claude 3 Opus 或 Gemini 1.5 Pro

2. **优化成本**
   - 优先使用 GPT-4o-mini (性价比最高)
   - 简单任务使用 Claude Haiku
   - 复杂任务再使用旗舰模型

3. **注意事项**
   - 注意图片大小(建议<10MB)
   - 多张图片会增加token消耗
   - 某些服务商有图片数量限制

## �🔄 版本历史

### v5.0.0 (2025-10-16) - 多模态支持 🎨
- ✅ 完整实现图片上传和视觉分析
- ✅ 支持OpenAI、Claude、Gemini三大服务商
- ✅ 图片拖拽上传和预览
- ✅ 多张图片同时分析
- ✅ Base64编码优化

### v4.0.0 (2025-10-12)
- ✅ 添加SQLite和Filesystem服务配置UI
- ✅ 支持自定义数据库路径和文件系统目录
- ✅ 优化MCP服务管理
- ✅ 完善文档结构

### v3.1.0
- ✅ API Key共享功能
- ✅ 数据库升级至v2
- ✅ API Key查看/隐藏和复制功能

### v3.0.0
- ✅ 系统提示词功能重构
- ✅ 升级到IndexedDB存储
- ✅ 模型按服务商分组

### v2.0.0
- ✅ 组件化重构
- ✅ 代码优化(减少85.7%)
- ✅ 提升可维护性

## 🤝 贡献指南

欢迎提交Issue和Pull Request!

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP协议支持
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Lucide Icons](https://lucide.dev/) - 图标库

## 📞 联系方式

- **作者**: Ezra
- **GitHub**: https://github.com/77Ezra1/Personal-Chatbox
- **问题反馈**: https://github.com/77Ezra1/Personal-Chatbox/issues

---

**注意**: 使用本项目需要自行准备AI模型的API密钥。部分MCP服务可能需要额外的API密钥或订阅。

