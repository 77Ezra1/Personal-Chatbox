# Personal Chatbox AI 代理开发指南

欢迎来到 Personal Chatbox 项目！本文档旨在帮助 AI 编程代理快速理解项目架构、关键工作流程和编码约定，以便高效地进行开发和贡献。

## 🚀 项目概述

Personal Chatbox 是一个基于 React 和 Node.js 的全栈 AI 对话应用。其核心是集成多种 AI 模型和 MCP (Model Context Protocol) 服务，为用户提供智能对话、工具调用和代理配置等功能。

- **前端**: 使用 React、Vite 和 Tailwind CSS 构建，位于 `src/` 目录。
- **后端**: 使用 Node.js 和 Express 构建，位于 `server/` 目录。
- **数据**: 用户配置和聊天记录存储在客户端的 IndexedDB 中，部分配置通过后端 API 同步。

### 关键文件和目录

- `src/`: 前端源代码。
  - `src/components/`: React 组件，按功能（`chat`, `mcp`, `settings`）组织。
  - `src/hooks/`: 自定义 React Hooks，用于管理状态和数据库交互。
  - `src/lib/db/`: IndexedDB 的操作模块，是前端数据持久化的核心。
- `server/`: 后端源代码。
  - `server/index.cjs`: 后端服务入口。
  - `server/routes/`: API 路由定义。
  - `server/services/`: 核心业务逻辑，如 MCP 服务管理 (`mcp-manager.cjs`)。
- `docs/`: 包含详细的用户指南、技术文档和架构图。
- `data/`: 存放后端数据，如 SQLite 数据库 (`app.db`)。

## 🛠️ 核心架构和数据流

1.  **UI -> API**: 用户在前端界面进行操作（如发送消息、更改设置），触发对后端 API 的请求（例如 `POST /api/chat`）。
2.  **后端 -> AI/MCP**: 后端接收到请求后，会与外部 AI 模型（如 OpenAI）或 MCP 服务进行交互。
3.  **MCP 服务**: MCP 服务是独立的功能模块（如天气查询、数据库操作），由 `server/services/mcp-manager.cjs` 统一管理和调用。
4.  **数据持久化**:
    - **前端**: 大部分用户数据（如模型配置、API 密钥、聊天记录）存储在浏览器的 IndexedDB 中。`src/lib/db/` 下的模块封装了所有数据库操作。
    - **后端**: 主要处理实时请求和需要服务器端存储的配置（如 `data/app.db`）。

## 🧑‍💻 关键开发工作流程

### 1. 启动开发环境

使用项目根目录下的脚本来启动和管理服务：

- **一键启动 (推荐)**:
  ```bash
  ./start.sh
  ```
  该脚本会同时启动前端和后端服务，并自动处理依赖安装和数据库初始化。

- **手动启动**:
  - **后端**:
    ```bash
    node server/index.cjs
    ```
    服务运行在 `http://localhost:3001`。
  - **前端**:
    ```bash
    pnpm dev
    ```
    服务运行在 `http://localhost:5173`，并代理 `/api` 请求到后端。

### 2. 测试

项目使用 Vitest进行单元测试和组件测试。

- **运行所有测试**:
  ```bash
  pnpm test
  ```
- **配置文件**:
  - `vitest.config.js`: Vitest 的主要配置。
  - `vitest.setup.js`: 测试环境的全局设置。

### 3. 部署

`deploy.sh` 脚本提供了一个完整的部署流程，包括环境检查、依赖安装、数据库初始化和后台服务启动。

```bash
./deploy.sh
```

## 📝 编码约定和模式

- **状态管理**: 主要使用 React Hooks (`useState`, `useContext`, `useEffect`) 和自定义 Hooks。避免引入大型状态管理库。
- **数据获取**: 前端通过 `axios` 或 `fetch` 与后端 API 交互。后端使用 `node-fetch` 与外部服务通信。
- **数据库操作**: 所有与 IndexedDB 的交互都应通过 `src/lib/db/` 中的辅助函数进行，以确保一致性和可维护性。
- **MCP 服务集成**:
  - 新的 MCP 服务应在 `server/services/mcp-manager.cjs` 中注册。
  - 服务的前端配置界面应在 `src/components/mcp/` 目录下创建。
- **环境变量**:
  - 前端环境变量通过 Vite 的 `import.meta.env` 访问。
  - 后端环境变量通过 `process.env` 访问，并在 `.env` 文件中定义。

## 💡 重要提示

- **优先修改前端**: 大部分业务逻辑和状态管理都在前端完成。除非需要与外部服务交互或进行安全敏感的操作，否则应首先考虑在前端实现。
- **查阅文档**: `docs/` 目录中有大量关于架构、MCP 服务和设计决策的详细文档。在开始大的改动前，请务必查阅相关文档。
- **使用脚本**: 优先使用项目提供的 `.sh` 脚本来执行启动、测试和部署等常见任务，以避免环境不一致导致的问题。
