# normalizeNote 快速参考

## ✅ 验证状态

**33/33 检查通过** ✅

## 📋 核心功能

```javascript
import { normalizeNote, normalizeNotes } from '@/lib/utils';

// 单个笔记归一化
const normalized = normalizeNote(rawNote);

// 批量归一化
const normalizedArray = normalizeNotes(rawNotes);
```

## 🎯 主要处理

### Tags 归一化

| 输入 | 输出 |
|------|------|
| `["tag1","tag2"]` | `['tag1', 'tag2']` |
| `'["tag1","tag2"]'` | `['tag1', 'tag2']` |
| `'tag1, tag2'` | `['tag1', 'tag2']` |
| `null` | `[]` |

### 时间戳归一化

| 输入 | 输出 |
|------|------|
| `1729334445000` | `'2025-10-19T06:30:45.000Z'` |
| `'2025-10-19'` | `'2025-10-19T00:00:00.000Z'` |
| `new Date()` | `'2025-10-19T06:30:45.000Z'` |
| `null` | 当前时间 (ISO) |

### 字段保证

| 字段 | 类型 | 默认值 |
|-----|------|--------|
| title | string | `''` |
| content | string | `''` |
| tags | Array | `[]` |
| created_at | ISO string | 当前时间 |
| updated_at | ISO string | created_at |
| is_favorite | boolean | `false` |
| is_archived | boolean | `false` |

## 🔄 自动集成

所有 API 方法自动归一化：

- ✅ `getAllNotes()` → `normalizeNotes`
- ✅ `getNoteById()` → `normalizeNote`
- ✅ `createNote()` → `normalizeNote`
- ✅ `updateNote()` → `normalizeNote`
- ✅ `searchNotes()` → `normalizeNotes`

## 💡 UI 简化

### 之前

```jsx
{Array.isArray(note.tags) && note.tags.length > 0 && (
  <div>{note.tags.map(...)}</div>
)}
```

### 之后

```jsx
{note.tags.length > 0 && (
  <div>{note.tags.map(...)}</div>
)}
```

## 🧪 验证

```bash
node verify-normalize-note.cjs
# ✅ 33/33 通过
```

## 📚 详细文档

`NOTES_NORMALIZE_COMPLETE.md`

---

**一次归一化，处处受益！** 🚀
