# 国际化翻译系统完整文档

## 概述

Personal Chatbox 实现了完整的国际化(i18n)翻译系统,支持中英文双语切换。系统设计灵活,易于扩展,并且包含专门的翻译组件和工具。

## 系统架构

### 核心文件

```
src/
├── lib/
│   ├── constants.js           # 主应用翻译资源(1400+翻译条目)
│   └── authTranslations.js    # 登录/注册页面专用翻译
├── hooks/
│   └── useTranslation.js      # 翻译 Hook
└── components/
    └── common/
        ├── LanguageSwitcher.jsx      # 语言切换组件
        └── LanguageSwitcher.css      # 样式文件
```

## 1. 翻译资源管理

### 主应用翻译 (constants.js)

包含所有应用内使用的翻译文本,覆盖以下模块:

#### 分类结构

```javascript
TRANSLATIONS = {
  en: {
    // 基础组件
    headings: { ... },
    buttons: { ... },
    labels: { ... },
    placeholders: { ... },
    tooltips: { ... },
    actions: { ... },

    // 设置
    settings: {
      tabs: { ... },
      appearance: { ... },
      language: { ... },
      profile: { ... },
      about: { ... }
    },

    // 功能模块
    agents: { ... },
    workflows: { ... },
    knowledge: { ... },
    personas: { ... },
    notes: { ... },
    analytics: { ... },
    sidebar: { ... },
    chat: { ... },

    // 工具
    commandPalette: { ... },
    fileUpload: { ... },
    advancedFilter: { ... },
    export: { ... },

    // 系统
    confirms: { ... },
    toasts: { ... },
    dataMigration: { ... }
  },
  zh: { ... } // 完整的中文翻译
}
```

#### 已翻译的功能模块

- ✅ **聊天界面** - 对话、消息输入、思考过程
- ✅ **侧边栏** - 导航、对话列表、搜索
- ✅ **设置** - 模型配置、外观、语言、关于
- ✅ **AI Agents** - 代理管理、编辑器、执行
- ✅ **工作流** - 流程管理、编辑、执行
- ✅ **知识库** - 文档管理、搜索、查询
- ✅ **人格** - AI角色管理
- ✅ **笔记** - 笔记编辑、分类、标签
- ✅ **数据分析** - 统计面板、趋势分析
- ✅ **命令面板** - 快捷指令
- ✅ **文件上传** - 拖拽上传、格式支持
- ✅ **高级过滤** - 日期范围、排序
- ✅ **导出功能** - Markdown、JSON、文本

### 认证页面翻译 (authTranslations.js)

专门为登录/注册页面设计的独立翻译系统:

```javascript
AUTH_TRANSLATIONS = {
  en: {
    // 步骤1 - 邮箱输入
    loginTitle: 'Log in or sign up',
    emailLabel: 'Email address',
    continueButton: 'Continue',

    // 步骤2 - 密码输入
    enterPasswordTitle: 'Enter your password',
    passwordLabel: 'Password',
    passwordRequirements: { ... },

    // 步骤3 - 邀请码
    inviteCodeTitle: 'Enter invite code',
    inviteCodeLabel: 'Invite code',

    // 错误提示
    errors: { ... }
  },
  zh: { ... }
}
```

**特点:**
- 独立的语言设置 (`auth-language.v1`)
- 不影响主应用的语言设置
- 包含完整的表单验证错误消息

## 2. 翻译 Hook

### useTranslation

核心翻译Hook,提供语言管理和翻译功能。

```javascript
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { language, setLanguage, toggleLanguage, translate, translations } = useTranslation()

  return (
    <div>
      <h1>{translate('chat.welcomeTitle', 'Hello')}</h1>
      <button onClick={toggleLanguage}>
        {language === 'en' ? '中文' : 'English'}
      </button>
    </div>
  )
}
```

#### API

| 属性 | 类型 | 说明 |
|------|------|------|
| `language` | `'en' \| 'zh'` | 当前语言 |
| `setLanguage(lang)` | `function` | 设置语言 |
| `toggleLanguage()` | `function` | 切换语言 |
| `translate(key, fallback)` | `function` | 翻译文本 |
| `translations` | `object` | 当前语言的所有翻译 |

#### 特性

1. **自动持久化**: 语言设置保存在 `localStorage` (`app-language.v1`)
2. **SSR 安全**: 服务端渲染时默认返回英文
3. **Fallback 支持**: 翻译不存在时返回 fallback 值

## 3. 语言切换组件

### LanguageSwitcher (下拉菜单版)

带有语言选择下拉菜单的完整组件。

```javascript
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

<LanguageSwitcher
  variant="default"    // Button 变体
  size="default"       // Button 大小
  className=""         // 自定义类名
/>
```

**特点:**
- 🌐 显示国旗和语言名称
- ✓ 当前语言标记
- 🎨 支持浅色/深色主题
- 📱 响应式设计

### LanguageToggle (简单切换按钮)

只有切换功能的简化版本。

```javascript
import { LanguageToggle } from '@/components/common/LanguageSwitcher'

<LanguageToggle
  variant="ghost"      // Button 变体
  size="icon"          // Button 大小
  className=""         // 自定义类名
/>
```

**特点:**
- ⚡ 一键切换
- 📦 体积小
- 🎯 适合工具栏

## 4. 使用指南

### 添加新翻译

#### 步骤1: 添加翻译键到 constants.js

```javascript
// src/lib/constants.js
export const TRANSLATIONS = {
  en: {
    myModule: {
      title: 'My Module',
      description: 'This is my new module',
      action: 'Click me'
    }
  },
  zh: {
    myModule: {
      title: '我的模块',
      description: '这是我的新模块',
      action: '点击我'
    }
  }
}
```

#### 步骤2: 在组件中使用

```javascript
import { useTranslation } from '@/hooks/useTranslation'

function MyModule() {
  const { translate } = useTranslation()

  return (
    <div>
      <h1>{translate('myModule.title')}</h1>
      <p>{translate('myModule.description')}</p>
      <button>{translate('myModule.action')}</button>
    </div>
  )
}
```

### 使用带参数的翻译

某些翻译支持占位符:

```javascript
// 翻译资源
showing: 'Showing {count} of {total}'

// 使用
const text = translate('common.showing', 'Showing {count} of {total}')
  .replace('{count}', filteredItems.length)
  .replace('{total}', totalItems.length)
```

### 条件翻译

```javascript
const statusText = isEnabled
  ? translate('status.enabled', 'Enabled')
  : translate('status.disabled', 'Disabled')
```

## 5. 最佳实践

### ✅ 推荐做法

1. **总是提供 Fallback**
   ```javascript
   translate('key.path', 'Default text')
   ```

2. **使用语义化的键名**
   ```javascript
   // ✅ 好
   translate('buttons.save', 'Save')
   translate('errors.networkError', 'Network error')

   // ❌ 差
   translate('btn1', 'Save')
   translate('err', 'Error')
   ```

3. **按功能模块组织**
   ```javascript
   // ✅ 好
   agents: {
     title: 'AI Agents',
     actions: { create: 'Create', edit: 'Edit' }
   }

   // ❌ 差
   agentsTitle: 'AI Agents',
   agentsCreate: 'Create'
   ```

4. **保持中英文同步**
   - 添加英文翻译时,同时添加中文
   - 使用相同的键结构

### ❌ 避免的做法

1. **硬编码文本**
   ```javascript
   // ❌ 不要这样
   <button>Save</button>

   // ✅ 应该这样
   <button>{translate('buttons.save', 'Save')}</button>
   ```

2. **在 JSX 中使用条件逻辑**
   ```javascript
   // ❌ 不要这样
   <span>{language === 'en' ? 'Hello' : '你好'}</span>

   // ✅ 应该这样
   <span>{translate('common.hello', 'Hello')}</span>
   ```

3. **缺少 Fallback**
   ```javascript
   // ❌ 不要这样
   translate('some.key')  // 可能返回 undefined

   // ✅ 应该这样
   translate('some.key', 'Default value')
   ```

## 6. 集成示例

### 示例1: 在页面中使用

```javascript
import { useTranslation } from '@/hooks/useTranslation'

function NotesPage() {
  const { translate } = useTranslation()

  return (
    <div className="notes-page">
      <header>
        <h1>{translate('notes.title', 'Notes')}</h1>
        <p>{translate('notes.empty', 'No notes yet')}</p>
      </header>

      <button>
        {translate('notes.newNote', 'New Note')}
      </button>
    </div>
  )
}
```

### 示例2: 在设置中集成语言切换

```javascript
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

function SettingsPage() {
  return (
    <div className="settings">
      <section>
        <h2>Language Settings</h2>
        <LanguageSwitcher variant="outline" />
      </section>
    </div>
  )
}
```

### 示例3: 在工具栏中使用

```javascript
import { LanguageToggle } from '@/components/common/LanguageSwitcher'

function Toolbar() {
  return (
    <div className="toolbar">
      <LanguageToggle variant="ghost" size="icon" />
      <ThemeToggle />
      <SettingsButton />
    </div>
  )
}
```

## 7. 扩展新语言

虽然当前只支持中英文,但系统设计易于扩展。

### 添加新语言的步骤

1. **在 constants.js 中添加新语言**
   ```javascript
   export const TRANSLATIONS = {
     en: { ... },
     zh: { ... },
     es: {  // 西班牙语
       headings: {
         conversation: 'Conversación',
         modelConfiguration: 'Configuración del modelo'
       },
       // ... 更多翻译
     }
   }
   ```

2. **更新 useTranslation Hook**
   ```javascript
   const [language, setLanguage] = useState(() => {
     const stored = window.localStorage.getItem(LANGUAGE_KEY)
     return ['en', 'zh', 'es'].includes(stored) ? stored : 'en'
   })
   ```

3. **更新 LanguageSwitcher 组件**
   ```javascript
   const languages = [
     { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
     { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
     { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
   ]
   ```

## 8. 测试清单

### 功能测试

- [ ] 语言切换工作正常
- [ ] 切换后页面内容更新
- [ ] 语言设置持久化
- [ ] 所有模块都有翻译
- [ ] 没有缺失的翻译键
- [ ] Fallback 值正确显示

### UI 测试

- [ ] 语言切换按钮显示正确
- [ ] 下拉菜单正常工作
- [ ] 当前语言标记显示
- [ ] 浅色/深色主题适配
- [ ] 响应式设计正常

### 边界测试

- [ ] localStorage 不可用时的降级
- [ ] SSR 环境下的兼容性
- [ ] 翻译键不存在时的处理
- [ ] 空字符串的处理
- [ ] 特殊字符的处理

## 9. 性能优化

### 当前优化

1. **useMemo 缓存**: translations 对象使用 `useMemo` 缓存
2. **useCallback 优化**: translate 和 toggleLanguage 函数被缓存
3. **按需加载**: 翻译资源按语言分离

### 未来优化建议

1. **代码分割**: 将大型翻译文件分割成多个模块
2. **懒加载**: 按需加载语言包
3. **压缩**: 构建时压缩翻译资源
4. **CDN**: 将语言文件部署到 CDN

## 10. 故障排除

### 常见问题

#### Q: 翻译不显示
**A:** 检查翻译键是否正确,确保提供了 fallback 值

#### Q: 语言切换后没有反应
**A:** 检查组件是否使用了 `useTranslation` Hook

#### Q: 某些文本没有翻译
**A:** 检查是否在 `constants.js` 中添加了对应的翻译键

#### Q: 页面刷新后语言恢复默认
**A:** 检查 localStorage 是否被清除或禁用

## 11. 统计信息

### 翻译覆盖率

| 模块 | 英文 | 中文 | 覆盖率 |
|------|------|------|--------|
| 聊天界面 | ✅ | ✅ | 100% |
| 侧边栏 | ✅ | ✅ | 100% |
| 设置 | ✅ | ✅ | 100% |
| AI Agents | ✅ | ✅ | 100% |
| 工作流 | ✅ | ✅ | 100% |
| 知识库 | ✅ | ✅ | 100% |
| 人格 | ✅ | ✅ | 100% |
| 笔记 | ✅ | ✅ | 100% |
| 数据分析 | ✅ | ✅ | 100% |
| 认证页面 | ✅ | ✅ | 100% |

### 翻译数量

- **总翻译键**: 约 1,460 个
- **英文字符数**: 约 45,000
- **中文字符数**: 约 30,000
- **支持语言**: 2 种 (en, zh)

## 12. 更新日志

### 2025-10-17
- ✅ 创建 `LanguageSwitcher` 和 `LanguageToggle` 组件
- ✅ 优化 Sidebar 中的语言切换按钮
- ✅ 创建完整的翻译系统文档
- ✅ 添加深色主题支持
- ✅ 添加响应式设计

### 现有功能
- ✅ 完整的中英文翻译系统
- ✅ `useTranslation` Hook
- ✅ 主应用翻译资源 (constants.js)
- ✅ 认证页面专用翻译 (authTranslations.js)
- ✅ 语言设置持久化

## 13. 相关资源

### 文件引用

- [useTranslation Hook](src/hooks/useTranslation.js)
- [主应用翻译](src/lib/constants.js)
- [认证翻译](src/lib/authTranslations.js)
- [语言切换组件](src/components/common/LanguageSwitcher.jsx)
- [样式文件](src/components/common/LanguageSwitcher.css)

### 外部资源

- [React i18n 最佳实践](https://react.i18next.com/latest/using-with-hooks)
- [国际化设计指南](https://www.w3.org/International/)
- [Unicode 字符参考](https://unicode.org/)

## 总结

Personal Chatbox 的国际化系统提供了:

- ✅ **完整的双语支持** - 中英文覆盖所有功能模块
- ✅ **易于使用** - 简单的 Hook API
- ✅ **易于扩展** - 清晰的结构,方便添加新语言
- ✅ **高性能** - 优化的渲染和缓存策略
- ✅ **用户友好** - 美观的切换组件,持久化设置
- ✅ **开发友好** - 详细的文档和示例

系统已经为未来的多语言支持做好了准备,可以轻松扩展到其他语言。
