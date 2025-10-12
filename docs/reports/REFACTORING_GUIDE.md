# 系统提示词功能重构指南

## 概述

本次重构将系统提示词功能从基于localStorage的简单存储升级为使用IndexedDB的结构化数据库存储，并优化了用户界面，支持按服务商分组显示模型。

## 主要改进

### 1. 数据存储架构升级

**从 localStorage 升级到 IndexedDB**

- ✅ 更大的存储容量（从5-10MB到数百MB）
- ✅ 结构化数据存储和索引支持
- ✅ 更好的查询性能
- ✅ 事务支持保证数据一致性
- ✅ 异步操作不阻塞主线程

### 2. 数据库表结构

新增5个IndexedDB对象存储（表）：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `models` | 存储用户添加的所有模型配置 | id, provider, modelName, apiKey, temperature, maxTokens |
| `system_prompts` | 存储系统提示词全局配置 | mode, globalPrompt |
| `model_prompts` | 存储模型与提示词的关联关系 | modelId, prompt |
| `conversations` | 存储对话记录（从localStorage迁移） | id, title, messages |
| `app_settings` | 存储应用全局设置 | key, value |

### 3. 模型配置与提示词独立管理

**之前**：模型配置和提示词混在一起存储在localStorage

**现在**：
- 模型配置存储在 `models` 表
- 系统提示词配置存储在 `system_prompts` 表
- 模型提示词关联存储在 `model_prompts` 表
- 通过外键关联，实现灵活的数据管理

### 4. UI优化 - 按服务商分组显示

**之前**：所有模型堆积在一起显示

**现在**：
- ✅ 按服务商分组（OpenAI、Anthropic、Google等）
- ✅ 支持展开/折叠每个服务商
- ✅ 每个服务商显示模型数量
- ✅ 支持按服务商全选/取消全选
- ✅ 更清晰的视觉层次

### 5. 自动数据迁移

应用启动时自动检测并迁移localStorage数据到IndexedDB：

- ✅ 自动迁移模型配置
- ✅ 自动迁移系统提示词
- ✅ 自动迁移对话记录
- ✅ 自动迁移应用设置
- ✅ 备份原始数据
- ✅ 迁移失败可回滚

## 新增文件

### 数据库层 (`src/lib/db/`)

```
src/lib/db/
├── index.js              # 数据库初始化和通用操作
├── schema.js             # 数据库结构定义
├── migration.js          # 数据迁移逻辑
├── models.js             # models表操作
├── systemPrompts.js      # system_prompts表操作
├── modelPrompts.js       # model_prompts表操作
├── conversations.js      # conversations表操作
└── appSettings.js        # app_settings表操作
```

### Hooks层

```
src/hooks/
├── useModelConfigDB.js   # 使用IndexedDB的模型配置Hook
└── useSystemPromptDB.js  # 使用IndexedDB的系统提示词Hook
```

### 组件层

```
src/components/
├── config/
│   └── SystemPromptConfigNew.jsx  # 重构后的系统提示词配置组件
└── common/
    └── DataMigration.jsx          # 数据迁移组件
```

### 文档

```
docs/
└── database-design.md    # 数据库设计文档
```

## 使用方法

### 1. 在App.jsx中集成新的Hooks

```jsx
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'
import { DataMigration } from '@/components/common/DataMigration'

function App() {
  // 使用新的Hooks
  const {
    modelConfig,
    currentProvider,
    currentModel,
    currentProviderModels,
    customModels,
    models,
    setProvider,
    setModel,
    updateConfig,
    addCustomModel,
    removeCustomModel
  } = useModelConfigDB()

  const {
    systemPrompt,
    setMode: setSystemPromptMode,
    setGlobalPrompt,
    setModelPrompts
  } = useSystemPromptDB()

  return (
    <DataMigration language={language}>
      {/* 你的应用内容 */}
    </DataMigration>
  )
}
```

### 2. 使用新的SystemPromptConfig组件

```jsx
import { SystemPromptConfigNew } from '@/components/config/SystemPromptConfigNew'

<SystemPromptConfigNew
  systemPrompt={systemPrompt}
  onModeChange={setSystemPromptMode}
  onGlobalPromptChange={setGlobalPrompt}
  onModelPromptsChange={setModelPrompts}
  language={language}
  translate={translate}
  allModels={models} // 传入所有模型列表
/>
```

## 数据库API使用示例

### 模型操作

```javascript
import { 
  getAllModels, 
  saveModel, 
  updateModel, 
  deleteModel 
} from '@/lib/db/models'

// 获取所有模型
const models = await getAllModels()

// 添加新模型
await saveModel({
  provider: 'openai',
  providerLabel: 'OpenAI',
  modelName: 'gpt-4',
  apiKey: 'sk-...',
  temperature: 0.7,
  maxTokens: 1024
})

// 更新模型配置
await updateModel('openai:gpt-4', {
  temperature: 0.8,
  maxTokens: 2048
})

// 删除模型
await deleteModel('openai:gpt-4')
```

### 系统提示词操作

```javascript
import { 
  getSystemPromptConfig,
  setSystemPromptMode,
  setGlobalPrompt
} from '@/lib/db/systemPrompts'

import {
  batchSetModelPrompts,
  deleteModelPrompt
} from '@/lib/db/modelPrompts'

// 获取系统提示词配置
const config = await getSystemPromptConfig()

// 设置模式
await setSystemPromptMode('per-model')

// 设置全局提示词
await setGlobalPrompt('You are a helpful assistant.')

// 批量设置模型提示词
await batchSetModelPrompts(
  ['openai:gpt-4', 'anthropic:claude-3-opus'],
  'You are a programming expert.'
)

// 删除模型提示词
await deleteModelPrompt('openai:gpt-4')
```

## 迁移步骤

### 自动迁移（推荐）

1. 将 `DataMigration` 组件包裹在应用根组件外层
2. 应用启动时会自动检测并执行迁移
3. 迁移完成后显示提示信息

### 手动迁移

```javascript
import { needsMigration, migrateData } from '@/lib/db/migration'

if (needsMigration()) {
  const result = await migrateData()
  console.log('Migration result:', result)
}
```

## 兼容性

### 浏览器支持

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

### 降级方案

如果浏览器不支持IndexedDB，系统会自动回退到localStorage（保持原有功能）。

## 性能优化

1. **索引优化**：为常用查询字段建立索引
2. **批量操作**：使用事务批量插入/更新数据
3. **懒加载**：对话记录按需加载
4. **缓存策略**：模型列表和配置使用内存缓存

## 安全性

1. **API密钥加密**：使用Web Crypto API加密存储（待实现）
2. **数据隔离**：不同用户的数据存储在不同的IndexedDB实例
3. **输入验证**：所有写入操作进行数据验证
4. **备份机制**：迁移前自动备份localStorage数据

## 测试

### 测试数据迁移

```javascript
import { resetMigration, restoreBackup } from '@/lib/db/migration'

// 重置迁移状态（用于测试）
resetMigration()

// 恢复备份数据
restoreBackup()
```

### 测试数据库操作

```javascript
import { deleteDatabase } from '@/lib/db'

// 删除整个数据库（慎用！）
await deleteDatabase()
```

## 故障排查

### 问题1：迁移失败

**解决方案**：
1. 打开浏览器控制台查看错误信息
2. 检查localStorage中是否有 `localStorage_backup` 键
3. 使用 `restoreBackup()` 恢复数据
4. 刷新页面重新迁移

### 问题2：数据不同步

**解决方案**：
1. 检查是否有多个标签页同时打开
2. 关闭其他标签页，只保留一个
3. 刷新页面

### 问题3：IndexedDB被禁用

**解决方案**：
1. 检查浏览器设置中是否禁用了IndexedDB
2. 检查是否在隐私模式/无痕模式下运行
3. 系统会自动降级到localStorage

## 未来扩展

- [ ] API密钥加密存储
- [ ] 云端数据同步
- [ ] 数据导出/导入功能
- [ ] 多设备数据同步
- [ ] 数据统计和分析

## 参考资料

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [数据库设计文档](./docs/database-design.md)

## 贡献

如有问题或建议，请提交Issue或Pull Request。

