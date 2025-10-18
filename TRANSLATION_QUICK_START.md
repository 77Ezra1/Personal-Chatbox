# 翻译功能快速开始 🌐

## 一分钟快速使用

### 1. 在组件中使用翻译

```javascript
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { translate } = useTranslation()

  return (
    <div>
      <h1>{translate('common.hello', 'Hello')}</h1>
      <button>{translate('buttons.save', 'Save')}</button>
    </div>
  )
}
```

### 2. 添加语言切换按钮

#### 方式A: 下拉菜单 (推荐用于设置页面)

```javascript
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

<LanguageSwitcher />
```

#### 方式B: 简单切换 (推荐用于工具栏)

```javascript
import { LanguageToggle } from '@/components/common/LanguageSwitcher'

<LanguageToggle variant="ghost" size="icon" />
```

## 添加新翻译

### Step 1: 在 constants.js 中添加

```javascript
// src/lib/constants.js
export const TRANSLATIONS = {
  en: {
    myFeature: {
      title: 'My Feature',
      description: 'Feature description'
    }
  },
  zh: {
    myFeature: {
      title: '我的功能',
      description: '功能描述'
    }
  }
}
```

### Step 2: 在组件中使用

```javascript
const { translate } = useTranslation()

<div>
  <h2>{translate('myFeature.title')}</h2>
  <p>{translate('myFeature.description')}</p>
</div>
```

## 常用翻译键

### 按钮
```javascript
translate('buttons.save', 'Save')
translate('buttons.cancel', 'Cancel')
translate('buttons.add', 'Add')
translate('buttons.newConversation', 'New conversation')
```

### 提示
```javascript
translate('tooltips.toggleLanguage', 'Toggle language')
translate('tooltips.openSettings', 'Open settings')
```

### 侧边栏
```javascript
translate('sidebar.chat', 'Chat')
translate('sidebar.settings', 'Settings')
translate('sidebar.agents', 'AI Agents')
```

### 确认对话框
```javascript
translate('confirms.deleteMessage', 'Are you sure?')
translate('confirms.confirmButton', 'Confirm')
translate('confirms.cancelButton', 'Cancel')
```

## 完整文档

查看 [I18N_TRANSLATION_SYSTEM.md](./I18N_TRANSLATION_SYSTEM.md) 获取完整文档。

## 当前支持的语言

- 🇺🇸 English
- 🇨🇳 简体中文

## 效果预览

### 侧边栏语言切换

```
┌─────────────────┐
│  🌐  EN         │  ← 点击切换到中文
└─────────────────┘

┌─────────────────┐
│  🌐  中文       │  ← 点击切换到英文
└─────────────────┘
```

### 下拉菜单

```
┌─────────────────────────┐
│  🇺🇸  English           │
│           English       ✓│
├─────────────────────────┤
│  🇨🇳  简体中文          │
│           Chinese       │
└─────────────────────────┘
```

## 注意事项

1. ✅ 总是提供 fallback 值
2. ✅ 保持中英文翻译同步
3. ✅ 使用语义化的键名
4. ❌ 不要硬编码文本
5. ❌ 不要在 JSX 中使用条件判断语言

## 需要帮助?

- 📖 查看完整文档: [I18N_TRANSLATION_SYSTEM.md](./I18N_TRANSLATION_SYSTEM.md)
- 🔍 搜索现有翻译: `src/lib/constants.js`
- 💬 参考其他组件的使用方式
