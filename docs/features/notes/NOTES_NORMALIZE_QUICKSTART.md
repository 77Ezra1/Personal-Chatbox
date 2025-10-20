# normalizeNote 快速开始

## 🚀 立即使用

normalizeNote 已经集成到 API 层，**无需任何额外配置**即可使用！

## ✅ 自动归一化

所有笔记 API 调用自动归一化数据：

```javascript
import * as notesApi from '@/lib/notesApi';

// ✅ 自动归一化
const notes = await notesApi.getAllNotes();

// 保证数据格式
notes.forEach(note => {
  console.log(note.tags);        // 永远是数组 []
  console.log(note.created_at);  // 永远是 ISO 格式
  console.log(note.title);       // 永远是字符串
  console.log(note.is_favorite); // 永远是布尔值
});
```

## 📝 UI 组件使用

### 简化前（之前的写法）

```jsx
// ❌ 复杂的判空逻辑
{note && note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
  <div>
    {note.tags.map((tag, index) => <span key={index}>{tag}</span>)}
  </div>
)}
```

### 简化后（现在的写法）

```jsx
// ✅ 信任归一化数据
{note.tags.length > 0 && (
  <div>
    {note.tags.map((tag, index) => <span key={index}>{tag}</span>)}
  </div>
)}
```

## 🎯 保证的数据格式

| 字段 | 类型 | 说明 |
|-----|------|------|
| `tags` | `Array<string>` | 永远是数组，不会是 null/undefined |
| `created_at` | `string` (ISO) | 格式: `2025-10-19T06:30:45.000Z` |
| `updated_at` | `string` (ISO) | 格式: `2025-10-19T06:30:45.000Z` |
| `title` | `string` | 永远是字符串，空值为 `''` |
| `content` | `string` | 永远是字符串，空值为 `''` |
| `is_favorite` | `boolean` | 永远是 true/false |
| `is_archived` | `boolean` | 永远是 true/false |

## 🛡️ 错误处理

normalizeNote 会自动处理：

- ✅ **JSON 字符串 tags**: `'["tag1","tag2"]'` → `['tag1', 'tag2']`
- ✅ **逗号分隔 tags**: `'tag1, tag2'` → `['tag1', 'tag2']`
- ✅ **Unix 时间戳**: `1729334445000` → ISO 格式
- ✅ **缺失字段**: 自动补充默认值
- ✅ **无效笔记**: 批量处理时自动过滤

## 📚 查看演示

```bash
# 打开交互式演示
start normalize-note-demo.html
```

## 🧪 验证

```bash
# 运行验证脚本
node verify-normalize-note.cjs
# ✅ 预期: 33/33 通过
```

## 📖 详细文档

- 📚 完整文档: `NOTES_NORMALIZE_COMPLETE.md`
- 📋 快速参考: `NOTES_NORMALIZE_QUICKREF.md`
- 📊 实现总结: `NOTES_NORMALIZE_SUMMARY.md`

---

**一次归一化，处处受益！** 🚀
