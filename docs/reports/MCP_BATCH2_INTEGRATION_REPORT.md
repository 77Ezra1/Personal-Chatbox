# AI-Life-system 第二批 MCP 服务集成报告

**版本:** 1.0
**日期:** 2025-10-12
**作者:** Ezra

---

## 1. 项目背景

本项目旨在为 AI-Life-system 集成第二批 MCP (Model Context Protocol) 服务,扩展其 AI 代理能力。本次集成重点关注 Git、Wikipedia、Brave Search 和 GitHub 四个关键服务,并引入了完整的配置管理系统,确保 API Keys 的安全性和用户体验。

## 2. 集成范围

本次集成的服务列表如下:

| 服务名称 | 包名/镜像 | 状态 | 工具数量 |
| :--- | :--- | :--- | :--- |
| **Git** | `mcp-server-git` | ✅ 已集成 | 12 |
| **Wikipedia** | `@shelm/wikipedia-mcp-server` | ✅ 已集成 | 4 |
| **Brave Search** | `@brave/brave-search-mcp-server` | ✅ 已集成 | 6 |
| **GitHub** | `@modelcontextprotocol/server-github` | ✅ 已集成 | 26 |
| **Notion** | - | ⚠️ 待集成 | - |
| **Gmail** | - | ⚠️ 待集成 | - |
| **Google Calendar** | - | ⚠️ 待集成 | - |

**总计新增工具:** 48个

## 3. 关键成果

### 3.1. 配置管理系统

为了安全地管理 API Keys,我们实现了一个完整的配置管理系统:

- **前端设置页面:** 用户可以通过 UI 界面方便地配置、测试和删除 API Keys,无需接触代码或配置文件。
- **后端加密存储:** API Keys 使用 AES-256-CBC 加密后存储在本地,确保敏感信息安全。
- **环境变量注入:** 服务启动时,系统会自动从配置存储中读取 API Keys 并注入到相应的服务进程中。
- **安全措施:** 加密密钥文件 (`.key`) 和配置文件 (`config.json`) 已加入 `.gitignore`,不会被提交到代码仓库。

### 3.2. 服务集成

成功集成了4个新的 MCP 服务,显著增强了 AI 代理的能力:

- **Git:** 版本控制、代码提交、分支管理
- **Wikipedia:** 知识查询、历史事件、页面内容获取
- **Brave Search:** 实时网页搜索、新闻、图片、视频搜索
- **GitHub:** 仓库管理、Issue、Pull Request、代码搜索

## 4. 测试结果

我们创建了一个包含14个测试用例的综合测试套件,对所有8个 MCP 服务进行了全面测试。

**测试结果:**

- **总计:** 14个测试
- **通过:** 14个 (100%)
- **失败:** 0个

**各服务测试结果:**

| 服务名称 | 测试用例数 | 通过 | 失败 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Memory | 2 | 2 | 0 | ✅ 通过 |
| Filesystem | 1 | 1 | 0 | ✅ 通过 |
| Git | 2 | 2 | 0 | ✅ 通过 |
| Sequential Thinking | 1 | 1 | 0 | ✅ 通过 |
| SQLite | 2 | 2 | 0 | ✅ 通过 |
| Wikipedia | 1 | 1 | 0 | ✅ 通过 |
| Brave Search | 2 | 2 | 0 | ✅ 通过 |
| GitHub | 3 | 3 | 0 | ✅ 通过 |

## 5. 遇到的问题与解决方案

1. **官方包废弃:** Brave Search 和 GitHub 的官方 npm 包均已废弃。
   - **解决方案:** 找到了 Brave 维护的新包 `@brave/brave-search-mcp-server` 和 GitHub 的 npm 包 `@modelcontextprotocol/server-github`。

2. **GitHub 服务启动失败:** 官方推荐使用 Docker,但环境中未安装。
   - **解决方案:** 改用 npm 包 `@modelcontextprotocol/server-github` 启动服务。

3. **参数格式错误:** 工具调用时参数格式不正确,导致测试失败。
   - **解决方案:** 查阅工具 schema,修复了测试脚本中的参数名称和结构。

4. **返回数据解析:** MCP 工具返回 `content` 数组格式,需要特殊解析。
   - **解决方案:** 调整了测试脚本以正确解析返回的数据。

## 6. 后续建议

1. **集成剩余服务:**
   - **Notion, Gmail, Google Calendar:** 这三个服务需要复杂的 OAuth 2.0 认证流程,建议在后续迭代中完善。

2. **端到端测试:**
   - 使用 DeepSeek 模型进行完整的端到端测试,验证 AI 代理能否正确调用新集成的服务。

3. **前端优化:**
   - 优化设置页面的交互体验,提供更详细的配置指引和错误提示。
   - 优化 MCP 服务返回结果的展示方式。

## 7. 附件

- [综合测试脚本 (test-all-batch1-batch2.cjs)](./test-all-batch1-batch2.cjs)

---

**报告结束**

