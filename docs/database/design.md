# 数据库架构设计文档

## 概述

本文档描述了Personal Chatbox项目的数据库架构重构方案。由于项目是纯前端应用，我们将使用**IndexedDB**作为客户端数据库，替代原有的localStorage存储方案。

## 为什么选择IndexedDB

1. **结构化存储**：支持复杂的数据结构和索引
2. **更大容量**：相比localStorage的5-10MB限制，IndexedDB可存储数百MB甚至GB数据
3. **查询能力**：支持索引和复杂查询，类似SQL数据库
4. **事务支持**：保证数据一致性
5. **异步操作**：不阻塞主线程

## 数据库结构

### 数据库名称
`ai-life-system-db`

### 版本
`1`

---

## 表结构设计

### 1. models（模型配置表）

存储用户添加的所有模型配置信息。

| 字段名 | 类型 | 索引 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | 主键 | ✓ | 模型唯一标识，格式：`provider:modelName` |
| provider | string | 索引 | ✓ | 服务商ID（如：openai, anthropic等） |
| providerLabel | string | - | ✓ | 服务商显示名称（如：OpenAI, Anthropic等） |
| modelName | string | - | ✓ | 模型名称（如：gpt-4, claude-3-opus等） |
| apiKey | string | - | - | API密钥（加密存储） |
| temperature | number | - | - | 温度参数（默认0.7） |
| maxTokens | number | - | - | 最大Token数（-1表示无限制） |
| supportsDeepThinking | boolean | - | - | 是否支持深度思考模式 |
| isActive | boolean | 索引 | ✓ | 是否为当前激活模型 |
| createdAt | number | - | ✓ | 创建时间戳 |
| updatedAt | number | - | ✓ | 更新时间戳 |

**索引**：
- 主键索引：`id`
- 复合索引：`[provider, isActive]` - 用于快速查询某服务商的激活模型

---

### 2. system_prompts（系统提示词表）

存储系统提示词配置信息。

| 字段名 | 类型 | 索引 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | 主键 | ✓ | 提示词唯一标识 |
| mode | string | - | ✓ | 应用模式：`none`/`global`/`per-model` |
| globalPrompt | string | - | - | 全局提示词内容 |
| createdAt | number | - | ✓ | 创建时间戳 |
| updatedAt | number | - | ✓ | 更新时间戳 |

**说明**：
- 该表只存储一条记录，id固定为`default`
- `mode`字段决定提示词的应用方式

---

### 3. model_prompts（模型提示词关联表）

存储指定模型的提示词配置。

| 字段名 | 类型 | 索引 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | 主键 | ✓ | 自动生成的唯一ID |
| modelId | string | 索引 | ✓ | 关联的模型ID（外键，关联models.id） |
| prompt | string | - | ✓ | 提示词内容 |
| createdAt | number | - | ✓ | 创建时间戳 |
| updatedAt | number | - | ✓ | 更新时间戳 |

**索引**：
- 主键索引：`id`
- 唯一索引：`modelId` - 每个模型只能有一个提示词

---

### 4. conversations（对话记录表）

存储对话历史记录（迁移自localStorage）。

| 字段名 | 类型 | 索引 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | 主键 | ✓ | 对话唯一标识 |
| title | string | - | ✓ | 对话标题 |
| messages | array | - | ✓ | 消息列表（JSON格式） |
| createdAt | number | 索引 | ✓ | 创建时间戳 |
| updatedAt | number | - | ✓ | 更新时间戳 |

**索引**：
- 主键索引：`id`
- 索引：`createdAt` - 用于按时间排序

---

### 5. app_settings（应用设置表）

存储应用全局设置（迁移自localStorage）。

| 字段名 | 类型 | 索引 | 必填 | 说明 |
|--------|------|------|------|------|
| key | string | 主键 | ✓ | 设置项键名 |
| value | any | - | ✓ | 设置项值（支持任意JSON类型） |
| updatedAt | number | - | ✓ | 更新时间戳 |

**预设键名**：
- `theme` - 主题设置（dark/light）
- `language` - 语言设置（zh/en）
- `deepThinking` - 深度思考模式开关
- `currentProvider` - 当前服务商
- `currentModel` - 当前模型

---

## 数据迁移策略

### 从localStorage迁移到IndexedDB

1. **检测现有数据**：启动时检查localStorage中是否存在旧数据
2. **自动迁移**：如果存在旧数据且IndexedDB为空，则自动迁移
3. **数据映射**：
   - `CUSTOM_MODELS_KEY` → `models`表
   - `MODEL_CONFIG_KEY` → `models`表 + `app_settings`表
   - `SYSTEM_PROMPT_KEY` → `system_prompts`表 + `model_prompts`表
   - `conversations` → `conversations`表
   - `THEME_KEY` → `app_settings`表
   - `LANGUAGE_KEY` → `app_settings`表
   - `DEEP_THINKING_KEY` → `app_settings`表
4. **备份旧数据**：迁移成功后，将localStorage数据备份到`localStorage_backup`键
5. **清理旧数据**：迁移完成后清除原localStorage数据

---

## 数据访问层设计

### 核心模块

```
src/lib/db/
├── index.js              # 数据库初始化和导出
├── schema.js             # 数据库schema定义
├── migration.js          # 数据迁移逻辑
├── models.js             # models表操作
├── systemPrompts.js      # system_prompts表操作
├── modelPrompts.js       # model_prompts表操作
├── conversations.js      # conversations表操作
└── appSettings.js        # app_settings表操作
```

### API设计原则

1. **统一的Promise接口**：所有数据库操作返回Promise
2. **错误处理**：统一的错误捕获和日志记录
3. **事务支持**：批量操作使用事务保证一致性
4. **缓存机制**：频繁读取的数据使用内存缓存

---

## 系统提示词功能重构

### 功能需求

1. **三种模式**：
   - `none`：不使用系统提示词
   - `global`：全局提示词应用于所有模型
   - `per-model`：指定模型提示词，支持多选

2. **模型选择优化**：
   - 按服务商分组显示
   - 支持多选模型
   - 批量应用提示词

3. **数据关联**：
   - 模型配置与提示词独立存储
   - 通过`model_prompts`表建立关联
   - 支持快速查询和更新

### UI交互流程

1. **添加模型** → 自动写入`models`表
2. **配置提示词** → 从`models`表读取可用模型列表
3. **选择模型** → 按服务商分组展示（如：OpenAI、Anthropic、Google等）
4. **批量应用** → 一次性为多个模型设置相同提示词
5. **查看已配置** → 显示所有已配置提示词的模型列表

---

## 性能优化

1. **索引优化**：为常用查询字段建立索引
2. **批量操作**：使用事务批量插入/更新数据
3. **懒加载**：对话记录按需加载，不一次性加载全部
4. **缓存策略**：
   - 模型列表缓存（5分钟）
   - 系统提示词配置缓存（实时更新）
   - 应用设置缓存（实时更新）

---

## 安全性考虑

1. **API密钥加密**：使用Web Crypto API加密存储
2. **数据隔离**：不同用户的数据存储在不同的IndexedDB实例
3. **输入验证**：所有写入操作进行数据验证
4. **备份机制**：定期导出数据到JSON文件

---

## 兼容性

- **支持浏览器**：Chrome 24+, Firefox 16+, Safari 10+, Edge 12+
- **降级方案**：如果浏览器不支持IndexedDB，回退到localStorage
- **数据同步**：未来可扩展支持云端同步

---

## 实施计划

1. ✅ 设计数据库架构
2. ⏳ 实现IndexedDB封装层
3. ⏳ 实现数据迁移逻辑
4. ⏳ 重构系统提示词UI组件
5. ⏳ 更新相关Hooks
6. ⏳ 测试和调试
7. ⏳ 文档更新

---

## 附录：数据示例

### models表数据示例

```json
{
  "id": "openai:gpt-4",
  "provider": "openai",
  "providerLabel": "OpenAI",
  "modelName": "gpt-4",
  "apiKey": "encrypted_key_here",
  "temperature": 0.7,
  "maxTokens": -1,
  "supportsDeepThinking": false,
  "isActive": true,
  "createdAt": 1728576000000,
  "updatedAt": 1728576000000
}
```

### system_prompts表数据示例

```json
{
  "id": "default",
  "mode": "per-model",
  "globalPrompt": "",
  "createdAt": 1728576000000,
  "updatedAt": 1728576000000
}
```

### model_prompts表数据示例

```json
{
  "id": "mp_1728576000000_abc123",
  "modelId": "openai:gpt-4",
  "prompt": "You are a helpful AI assistant specialized in programming.",
  "createdAt": 1728576000000,
  "updatedAt": 1728576000000
}
```

