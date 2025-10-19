# Notes 时间格式化 - 快速参考

## ✅ 已完成

### 核心功能
- ✅ **formatNoteTime** - 智能时间格式化（带回退）
- ✅ **用户时区支持** - 从 user.timezone 读取
- ✅ **NotesPage 集成** - 详情页显示格式化时间
- ✅ **NoteList 集成** - 列表项显示格式化时间
- ✅ **数据库支持** - users.timezone 字段

### 时间格式
**统一格式**: `YYYY-MM-DD HH:mm:ss`  
**示例**: `2025-10-19 14:30:45`

### 回退逻辑
```
updated_at (更新时间)
    ↓ 无效
created_at (创建时间)
    ↓ 无效
Current Time (当前时间)
```

## 📋 使用方法

### 在组件中使用

```javascript
import { formatNoteTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  const timezone = user?.timezone || 'Asia/Shanghai';

  return (
    <div>
      {formatNoteTime(note.updated_at, note.created_at, timezone)}
    </div>
  );
}
```

### 在列表中传递时区

```javascript
<NoteList
  notes={notes}
  userTimezone={user?.timezone || 'Asia/Shanghai'}
  // ... 其他 props
/>
```

## ⚙️ 时区配置

### 用户设置
用户可在 **个人设置 → 时区** 中修改时区

### 默认值
- 数据库默认: `Asia/Shanghai` (UTC+8)
- 用户未登录: `Asia/Shanghai`

### 支持的时区
- Asia/Shanghai (亚洲/上海, UTC+8)
- Asia/Hong_Kong (亚洲/香港, UTC+8)
- Asia/Tokyo (亚洲/东京, UTC+9)
- America/New_York (美洲/纽约, UTC-5)
- Europe/London (欧洲/伦敦, UTC+0)
- 更多...

## 🔧 验证

运行验证脚本:
```bash
node verify-notes-time-integration.cjs
```

**预期结果**: 20/20 ✅

## 📁 修改的文件

1. `src/lib/utils.js` - 添加 formatNoteTime 函数
2. `src/pages/NotesPage.jsx` - 集成用户时区和格式化
3. `src/components/notes/NoteList.jsx` - 列表时间显示

## 🎯 特性

- ✨ 统一格式（YYYY-MM-DD HH:mm:ss）
- 🌍 用户时区支持
- 🔄 智能回退逻辑
- 🛡️ 错误处理
- ⚡ 性能优化（useCallback）

---

**文档**: `NOTES_TIME_INTEGRATION_COMPLETE.md`  
**验证**: ✅ 20/20 通过
