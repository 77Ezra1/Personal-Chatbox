# 集成指南 - 如何在现有项目中使用新的系统提示词功能

本文档说明如何将新的IndexedDB存储和系统提示词功能集成到现有的AI-Life-system项目中。

## 快速开始

### 步骤1：在App.jsx中导入新的Hooks

```jsx
// 在文件顶部添加导入
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'
import { DataMigration } from '@/components/common/DataMigration'
```

### 步骤2：替换现有的Hooks

**原来的代码：**
```jsx
const {
  modelConfig,
  currentProvider,
  currentModel,
  currentProviderModels,
  customModels,
  setProvider,
  setModel,
  updateConfig,
  removeCustomModel
} = useModelConfig()

const {
  systemPrompt,
  setMode: setSystemPromptMode,
  setGlobalPrompt,
  setModelPrompts
} = useSystemPrompt()
```

**新的代码：**
```jsx
const {
  modelConfig,
  currentProvider,
  currentModel,
  currentProviderModels,
  customModels,
  models, // 新增：所有模型列表
  loading, // 新增：加载状态
  setProvider,
  setModel,
  updateConfig,
  addCustomModel, // 新增：添加模型方法
  removeCustomModel,
  reload // 新增：重新加载方法
} = useModelConfigDB()

const {
  systemPrompt,
  loading: promptLoading, // 新增：加载状态
  setMode: setSystemPromptMode,
  setGlobalPrompt,
  setModelPrompts,
  reload: reloadPrompts // 新增：重新加载方法
} = useSystemPromptDB()
```

### 步骤3：包裹应用组件

在App组件的返回值外层包裹DataMigration组件：

```jsx
function App() {
  // ... 所有hooks和逻辑

  return (
    <DataMigration language={language}>
      {/* 原有的应用内容 */}
      <div className="app">
        {/* ... */}
      </div>
    </DataMigration>
  )
}
```

### 步骤4：更新ConfigPanel组件

在ConfigPanel组件中使用新的SystemPromptConfigNew：

**原来的代码：**
```jsx
import { SystemPromptConfig } from './SystemPromptConfig'

<SystemPromptConfig
  systemPrompt={systemPrompt}
  onModeChange={onSystemPromptModeChange}
  onGlobalPromptChange={onSystemPromptGlobalChange}
  onModelPromptsChange={onSystemPromptModelChange}
  language={language}
  translate={translate}
  customModels={customModels}
/>
```

**新的代码：**
```jsx
import { SystemPromptConfigNew } from './SystemPromptConfigNew'

<SystemPromptConfigNew
  systemPrompt={systemPrompt}
  onModeChange={onSystemPromptModeChange}
  onGlobalPromptChange={onSystemPromptGlobalChange}
  onModelPromptsChange={onSystemPromptModelChange}
  language={language}
  translate={translate}
  allModels={models} // 使用新的models数组
/>
```

## 完整示例

### App.jsx 完整修改示例

```jsx
import { useState, useCallback, useRef, useEffect } from 'react'
import { Toaster, toast } from 'sonner'

// 新的Hooks
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'
import { DataMigration } from '@/components/common/DataMigration'

// 其他导入保持不变...

function App() {
  // 使用新的Hooks
  const {
    modelConfig,
    currentProvider,
    currentModel,
    currentProviderModels,
    customModels,
    models,
    loading: modelsLoading,
    setProvider,
    setModel,
    updateConfig,
    addCustomModel,
    removeCustomModel
  } = useModelConfigDB()

  const {
    systemPrompt,
    loading: promptLoading,
    setMode: setSystemPromptMode,
    setGlobalPrompt,
    setModelPrompts,
    getEffectivePrompt
  } = useSystemPromptDB()

  // 其他hooks和状态保持不变...

  // 在生成AI响应时使用系统提示词
  const handleSendMessage = useCallback(async (content, attachments = []) => {
    // ... 其他逻辑

    // 获取当前模型的有效提示词
    const systemPromptText = getEffectivePrompt(currentProvider, currentModel)
    
    // 如果有系统提示词，添加到消息列表开头
    const messagesWithPrompt = systemPromptText
      ? [{ role: 'system', content: systemPromptText }, ...messages]
      : messages

    // 调用AI API
    const response = await generateAIResponse(
      messagesWithPrompt,
      modelConfig,
      // ... 其他参数
    )

    // ... 其他逻辑
  }, [currentProvider, currentModel, getEffectivePrompt, modelConfig])

  return (
    <DataMigration language={language}>
      <div className="app">
        {/* 显示加载状态 */}
        {(modelsLoading || promptLoading) && (
          <div className="loading-indicator">
            Loading...
          </div>
        )}

        {/* 其他组件 */}
        <ConfigPanel
          modelConfig={modelConfig}
          currentProvider={currentProvider}
          currentModel={currentModel}
          providerModels={currentProviderModels}
          customModels={customModels}
          models={models} // 传递完整的模型列表
          onProviderChange={setProvider}
          onModelChange={setModel}
          onRemoveModel={(modelName) => removeCustomModel(currentProvider, modelName)}
          onSaveConfig={updateConfig}
          systemPrompt={systemPrompt}
          onSystemPromptModeChange={setSystemPromptMode}
          onSystemPromptGlobalChange={setGlobalPrompt}
          onSystemPromptModelChange={setModelPrompts}
          // ... 其他props
        />
      </div>
    </DataMigration>
  )
}

export default App
```

### ConfigPanel.jsx 修改示例

```jsx
import { SystemPromptConfigNew } from './SystemPromptConfigNew'

export function ConfigPanel({
  modelConfig,
  currentProvider,
  currentModel,
  providerModels,
  customModels,
  models, // 新增：完整的模型列表
  onProviderChange,
  onModelChange,
  onRemoveModel,
  onSaveConfig,
  onClose,
  isOpen = true,
  translate,
  language = 'zh',
  systemPrompt,
  onSystemPromptModeChange,
  onSystemPromptGlobalChange,
  onSystemPromptModelChange
}) {
  // ... 其他逻辑

  return (
    <aside className={`config-panel ${isOpen ? 'open' : ''}`}>
      {/* ... 其他配置项 */}

      {/* 使用新的系统提示词配置组件 */}
      <SystemPromptConfigNew
        systemPrompt={systemPrompt}
        onModeChange={onSystemPromptModeChange}
        onGlobalPromptChange={onSystemPromptGlobalChange}
        onModelPromptsChange={onSystemPromptModelChange}
        language={language}
        translate={translate}
        allModels={models}
      />

      {/* ... 其他内容 */}
    </aside>
  )
}
```

## 注意事项

### 1. 数据迁移

- 首次运行时会自动从localStorage迁移数据到IndexedDB
- 迁移过程中会显示加载界面
- 迁移完成后会显示成功提示
- 原始数据会备份到localStorage的`localStorage_backup`键

### 2. 兼容性处理

如果需要保留原有的localStorage方式作为降级方案：

```jsx
import { useModelConfig } from '@/hooks/useModelConfig'
import { useModelConfigDB } from '@/hooks/useModelConfigDB'

// 检测IndexedDB支持
const supportsIndexedDB = typeof window !== 'undefined' && !!window.indexedDB

// 根据支持情况选择Hook
const modelConfigHook = supportsIndexedDB ? useModelConfigDB : useModelConfig
const { modelConfig, ...rest } = modelConfigHook()
```

### 3. 错误处理

建议在应用中添加错误边界来捕获数据库操作错误：

```jsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>数据库操作出错：</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DataMigration language={language}>
        {/* 应用内容 */}
      </DataMigration>
    </ErrorBoundary>
  )
}
```

### 4. 性能优化

如果模型列表很大，可以使用虚拟滚动：

```jsx
import { FixedSizeList } from 'react-window'

// 在SystemPromptConfigNew中使用虚拟滚动
<FixedSizeList
  height={400}
  itemCount={models.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      {/* 渲染模型项 */}
    </div>
  )}
</FixedSizeList>
```

## 测试

### 测试数据迁移

```javascript
// 在浏览器控制台中执行
import { resetMigration, migrateData } from '@/lib/db/migration'

// 重置迁移状态
resetMigration()

// 重新执行迁移
const result = await migrateData()
console.log(result)
```

### 测试数据库操作

```javascript
// 在浏览器控制台中执行
import { getAllModels, saveModel } from '@/lib/db/models'

// 获取所有模型
const models = await getAllModels()
console.log(models)

// 添加测试模型
await saveModel({
  provider: 'openai',
  providerLabel: 'OpenAI',
  modelName: 'test-model',
  apiKey: 'test-key'
})
```

## 回滚方案

如果遇到问题需要回滚到原有方案：

1. 恢复备份数据：
```javascript
import { restoreBackup } from '@/lib/db/migration'
restoreBackup()
```

2. 删除IndexedDB数据库：
```javascript
import { deleteDatabase } from '@/lib/db'
await deleteDatabase()
```

3. 刷新页面，系统会回到localStorage模式

## 常见问题

### Q: 迁移后数据丢失怎么办？

A: 数据已备份在localStorage的`localStorage_backup`键中，使用`restoreBackup()`可以恢复。

### Q: 如何清空所有数据？

A: 
```javascript
import { deleteDatabase } from '@/lib/db'
await deleteDatabase()
localStorage.clear()
```

### Q: 如何导出数据？

A:
```javascript
import { getAllModels } from '@/lib/db/models'
import { getAllConversations } from '@/lib/db/conversations'

const models = await getAllModels()
const conversations = await getAllConversations()

const exportData = { models, conversations }
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'ai-life-system-export.json'
a.click()
```

## 支持

如有问题，请查看：
- [数据库设计文档](./docs/database-design.md)
- [重构指南](./REFACTORING_GUIDE.md)
- [GitHub Issues](https://github.com/77Ezra1/AI-Life-system/issues)

