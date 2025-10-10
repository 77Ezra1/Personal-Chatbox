# AI Chat - Apple Design

一个基于 Apple 设计理念的 AI 对话应用前端界面，支持用户自主配置 AI 模型。

## ✨ 设计理念

本项目严格遵循 Apple Human Interface Guidelines 的核心设计原则。

## 🎯 核心功能

### 1. 对话管理
- ✅ 实时 AI 对话交互
- ✅ 流式输出显示
- ✅ 消息历史记录
- ✅ 对话列表管理
- ✅ 会话自动持久化

### 2. 深度思考模式
- ✅ 用户可自定义模型是否支持深度思考
- ✅ 思考过程完整显示在折叠框中
- ✅ 流式输出思考过程

### 3. 模型配置
- ✅ 支持多个 AI 提供商
- ✅ 灵活切换和自定义模型
- ✅ API 密钥管理
- ✅ 参数调节
- ✅ IndexedDB 结构化存储

### 4. 系统提示词
- ✅ 支持全局提示词（应用于所有模型）
- ✅ 支持指定模型提示词（按模型定制）
- ✅ 批量应用提示词到多个模型
- ✅ 按服务商分组显示模型
- ✅ 支持展开/折叠服务商
- ✅ 按服务商全选/取消全选

### 5. 用户体验
- ✅ 深色/浅色主题切换
- ✅ 中英文双语支持
- ✅ 响应式布局

### 6. 代码架构
- ✅ 组件化架构（App.jsx 从 1917 行优化到 275 行）
- ✅ 自定义 Hooks（状态管理解耦）
- ✅ 易于维护和扩展

## 🛠 技术栈

- React 18 + Vite
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## 📦 安装和运行

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## 🚀 最近更新

### v3.0.0 - 系统提示词功能重构
- ✅ 从 localStorage 升级到 IndexedDB 存储
- ✅ 新增 5 个数据表：models, system_prompts, model_prompts, conversations, app_settings
- ✅ 模型配置与系统提示词独立管理
- ✅ 系统提示词支持全局应用和指定模型应用
- ✅ 指定模型提示词支持批量应用和多选
- ✅ 模型列表按服务商分组显示
- ✅ 支持展开/折叠服务商，按服务商全选
- ✅ 自动数据迁移，无缝升级
- ✅ 完善的数据库设计文档

### v2.0.0 - 组件化重构
- ✅ App.jsx 从 1917 行优化到 275 行（减少 85.7%）
- ✅ 创建 9 个 UI 组件
- ✅ 提取 5 个自定义 Hooks
- ✅ 提升代码可维护性

## 📄 许可证

MIT License


## 📚 文档

- [数据库设计文档](./docs/database-design.md) - IndexedDB 数据库架构设计
- [重构指南](./REFACTORING_GUIDE.md) - 系统提示词功能重构说明
- [集成指南](./INTEGRATION_GUIDE.md) - 如何在项目中使用新功能

## 🔧 开发指南

### 数据库操作

项目使用 IndexedDB 作为客户端数据库，提供了完整的数据访问层：

\`\`\`javascript
// 模型操作
import { getAllModels, saveModel, updateModel } from '@/lib/db/models'

// 系统提示词操作
import { getSystemPromptConfig, setGlobalPrompt } from '@/lib/db/systemPrompts'

// 模型提示词操作
import { batchSetModelPrompts } from '@/lib/db/modelPrompts'
\`\`\`

### 自定义 Hooks

\`\`\`javascript
// 模型配置管理
import { useModelConfigDB } from '@/hooks/useModelConfigDB'

// 系统提示词管理
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'
\`\`\`

详细使用方法请参考 [集成指南](./INTEGRATION_GUIDE.md)。

