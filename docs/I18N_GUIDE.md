# 国际化 (i18n) 使用指南

## 概述

本项目已经实现了完整的国际化支持，目前支持 **英文 (en)** 和 **中文 (zh)** 两种语言。

## 如何使用

### 1. 在组件中使用翻译

```jsx
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { translate, language, toggleLanguage } = useTranslation()

  return (
    <div>
      <h1>{translate('agents.title', 'AI Agents')}</h1>
      <p>{translate('agents.subtitle', 'Manage and execute your intelligent agents')}</p>
      <button onClick={toggleLanguage}>
        {language === 'zh' ? '切换到英文' : 'Switch to Chinese'}
      </button>
    </div>
  )
}
```

### 2. 翻译键的命名规范

翻译键使用点分隔的层级结构：

```
category.subcategory.item
```

示例：
- `agents.title` - AI Agents 的标题
- `agents.toasts.createSuccess` - 创建成功的提示
- `agents.filters.allStatus` - 所有状态筛选器

### 3. 可用的翻译类别

#### 基础翻译
- `headings.*` - 页面标题
- `buttons.*` - 按钮文本
- `labels.*` - 标签文本
- `placeholders.*` - 输入框占位符
- `tooltips.*` - 工具提示
- `toasts.*` - 通知消息

#### 功能模块翻译
- `agents.*` - AI 代理相关
- `workflows.*` - 工作流相关
- `knowledge.*` - 知识库相关
- `personas.*` - 人格相关
- `sidebar.*` - 侧边栏导航
- `common.*` - 通用文本

### 4. 添加新的翻译

在 `/src/lib/constants.js` 文件中的 `TRANSLATIONS` 对象里添加：

```javascript
export const TRANSLATIONS = {
  en: {
    // 添加英文翻译
    myFeature: {
      title: 'My Feature',
      description: 'This is my feature'
    }
  },
  zh: {
    // 添加中文翻译
    myFeature: {
      title: '我的功能',
      description: '这是我的功能'
    }
  }
}
```

### 5. 动态内容替换

对于包含动态内容的翻译，使用占位符：

```javascript
// 在 constants.js 中定义
deleteConfirm: {
  description: 'Are you sure you want to delete "{name}"?'
}

// 在组件中使用
const message = translate('agents.deleteConfirm.description', 'Delete {name}?')
  .replace('{name}', agentName)
```

### 6. 通过 props 传递翻译函数

当需要在子组件中使用翻译时，可以通过 props 传递：

```jsx
// 父组件
function ParentComponent() {
  const { translate } = useTranslation()

  return <ChildComponent translate={translate} />
}

// 子组件
function ChildComponent({ translate }) {
  return <div>{translate('agents.title', 'AI Agents')}</div>
}
```

### 7. 语言切换

用户可以通过以下方式切换语言：

1. **顶部工具栏**：点击语言切换按钮 (EN/中文)
2. **设置页面**：在设置 → 语言选项中选择
3. **编程方式**：调用 `toggleLanguage()` 或 `setLanguage('zh')`

语言设置会自动保存到 localStorage，下次访问时自动恢复。

## 已国际化的页面和组件

### ✅ 已完成
- [x] 主应用界面 (App.jsx)
- [x] 侧边栏导航 (Sidebar.jsx)
- [x] 聊天界面 (ChatContainer, MessageInput, MessageList)
- [x] AI 代理页面 (AgentsPage, AgentList)
- [x] 设置页面 (SettingsPage)
- [x] 登录页面 (LoginPage)
- [x] 配置面板 (ConfigPanel)
- [x] 系统提示词配置 (SystemPromptConfig)

### 🚧 待完成
- [ ] 工作流页面 (WorkflowsPage)
- [ ] 知识库页面 (KnowledgeBase)
- [ ] 人格选择器 (PersonaSelector)
- [ ] 分析页面 (AnalyticsPage)

## 翻译覆盖率

| 模块 | 英文 | 中文 |
|------|------|------|
| 核心界面 | ✅ 100% | ✅ 100% |
| AI 代理 | ✅ 100% | ✅ 100% |
| 工作流 | ✅ 100% | ✅ 100% |
| 知识库 | ✅ 100% | ✅ 100% |
| 人格 | ✅ 100% | ✅ 100% |

## 测试

### 手动测试清单

1. [ ] 切换语言后，所有文本都正确显示
2. [ ] 页面刷新后，语言设置保持
3. [ ] 动态内容（如对话标题）正确显示
4. [ ] 错误提示和成功消息正确翻译
5. [ ] 表单验证消息正确翻译
6. [ ] 确认对话框正确翻译

### 自动化测试

```bash
# 运行国际化测试
npm run test -- i18n
```

## 最佳实践

### ✅ 推荐做法

1. **始终提供后备文本**
   ```javascript
   translate('key', 'Fallback text')
   ```

2. **使用有意义的键名**
   ```javascript
   // Good
   translate('agents.actions.delete', 'Delete')

   // Bad
   translate('btn1', 'Delete')
   ```

3. **保持翻译结构一致**
   ```javascript
   // 英文和中文使用相同的键结构
   en: { agents: { title: '...' } }
   zh: { agents: { title: '...' } }
   ```

### ❌ 避免做法

1. **硬编码文本**
   ```javascript
   // Bad
   <Button>Delete</Button>

   // Good
   <Button>{translate('actions.delete', 'Delete')}</Button>
   ```

2. **在 JSX 中拼接翻译**
   ```javascript
   // Bad
   {translate('label')} + ': ' + value

   // Good - 在 constants.js 中定义完整的文本模板
   translate('labelWithValue', 'Label: {value}').replace('{value}', value)
   ```

## 贡献新的翻译

如果您要添加新的语言或改进现有翻译：

1. Fork 项目
2. 在 `src/lib/constants.js` 中添加/修改翻译
3. 测试所有受影响的页面
4. 提交 Pull Request

## 技术细节

### 翻译存储

- **位置**：`/src/lib/constants.js`
- **格式**：嵌套的 JavaScript 对象
- **持久化**：localStorage (`app-language.v1`)

### Hook API

```typescript
interface UseTranslation {
  language: 'en' | 'zh'
  setLanguage: (lang: 'en' | 'zh') => void
  toggleLanguage: () => void
  translate: (key: string, fallback?: string) => string
  translations: Record<string, any>
}
```

## 常见问题

**Q: 为什么我的翻译没有生效？**

A: 检查以下几点：
1. 翻译键是否正确
2. 是否在两种语言中都添加了翻译
3. 组件是否正确使用了 `useTranslation` hook
4. 浏览器缓存是否需要清除

**Q: 如何添加第三种语言？**

A:
1. 在 `constants.js` 的 `TRANSLATIONS` 对象中添加新语言
2. 更新 `useTranslation.js` 中的类型定义
3. 在语言切换 UI 中添加新选项

**Q: 登录页面的翻译为什么是单独的？**

A: 登录页面使用独立的翻译系统 (`authTranslations.js`)，因为它在主应用加载之前就需要显示。

## 更新日志

### 2025-10-17
- ✅ 添加 AI Agents 模块完整翻译
- ✅ 添加 Workflows 模块翻译
- ✅ 添加 Knowledge Base 模块翻译
- ✅ 添加 Personas 模块翻译
- ✅ 更新侧边栏导航翻译
- ✅ 优化翻译键结构

### 之前版本
- 实现基础国际化框架
- 添加聊天界面翻译
- 添加设置页面翻译
