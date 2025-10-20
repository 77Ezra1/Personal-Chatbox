# 笔记筛选功能调试指南

## 问题描述
用户反映标签筛选和分类筛选功能无法正常工作。

## 已检查的组件

### 1. 前端组件 (NotesPage.jsx)
✅ **筛选状态管理**
- `filterCategory` - 分类筛选
- `filterTag` - 标签筛选  
- `showFavoritesOnly` - 仅显示收藏
- `showArchived` - 显示已归档

✅ **UI 控件**
- Select 组件正确绑定 `onChange` 事件
- 筛选条件变化时会触发 `loadNotes()`

✅ **API 调用**
```javascript
const options = {
  category: filterCategory || undefined,
  tag: filterTag || undefined,
  isFavorite: showFavoritesOnly || undefined,
  isArchived: showArchived,
  sortBy,
  sortOrder
};
await notesApi.getAllNotes(options);
```

### 2. API 客户端 (notesApi.js)
✅ **参数传递**
```javascript
export async function getAllNotes(options = {}) {
  const params = {};
  if (options.category) params.category = options.category;
  if (options.tag) params.tag = options.tag;
  if (options.isFavorite !== undefined) params.isFavorite = options.isFavorite;
  // ...
  const response = await apiClient.get(API_BASE, { params });
}
```

### 3. 后端路由 (server/routes/notes.cjs)
✅ **参数解析**
```javascript
router.get('/', async (req, res) => {
  const options = {
    category: req.query.category,
    tag: req.query.tag,
    isFavorite: req.query.isFavorite === 'true',
    isArchived: req.query.isArchived === 'true' ? 1 : 0,
    sortBy: req.query.sortBy || 'updated_at',
    sortOrder: req.query.sortOrder || 'DESC',
  };
  const notes = await noteService.getAllNotes(userId, options);
});
```

### 4. 服务层 (server/services/noteService.cjs)
✅ **SQL 查询构建**
```javascript
let query = 'SELECT * FROM notes WHERE user_id = ? AND is_archived = ?';

if (category) {
  query += ' AND category = ?';
  params.push(category);
}

if (tag) {
  query += ' AND id IN (SELECT note_id FROM note_tags WHERE tag = ?)';
  params.push(tag);
}
```

## 测试步骤

### 浏览器调试
1. 打开 http://localhost:5173
2. 登录并进入笔记页面
3. 打开浏览器开发者工具 (F12)
4. 切换到 Console 标签
5. 尝试以下操作并观察日志：

**测试分类筛选**
```
预期日志：
[NotesPage] Loading notes with options: { category: "工作", tag: undefined, ... }
[NotesPage] Loaded notes count: X
```

**测试标签筛选**
```
预期日志：
[NotesPage] Loading notes with options: { category: undefined, tag: "重要", ... }
[NotesPage] Loaded notes count: X
```

**测试组合筛选**
```
预期日志：
[NotesPage] Loading notes with options: { category: "工作", tag: "重要", ... }
[NotesPage] Loaded notes count: X
```

### Network 检查
1. 切换到 Network 标签
2. 选择分类或标签
3. 查找 `/api/notes` 请求
4. 检查 Query String Parameters：
   - `category` 应该存在且正确
   - `tag` 应该存在且正确

### 后端日志
```bash
tail -f logs/backend.log
```

查找 SQL 查询日志（如果有）

## 可能的问题

### 1. 空值处理
检查是否有空字符串被传递而不是 undefined：
```javascript
// 错误
category: filterCategory  // filterCategory = "" 时会被发送

// 正确
category: filterCategory || undefined  // filterCategory = "" 时变为 undefined
```

### 2. 数据库字段不匹配
- 检查 notes 表的 `category` 字段是否存在
- 检查 note_tags 表的 `tag` 字段是否存在

### 3. 分类名称大小写
- SQL 查询可能区分大小写
- 检查存储的分类名和筛选的分类名是否完全一致

## 快速修复建议

如果筛选不工作，最可能的原因是：

1. **分类数据不匹配**
   - 笔记的 category 字段存储的是分类 ID 而不是分类名称
   - 解决方案：修改查询使用 category_id

2. **标签表为空**
   - note_tags 关联表没有数据
   - 解决方案：确保创建/更新笔记时同步更新 note_tags 表

3. **前端状态未更新**
   - Select 组件的 value 没有正确绑定
   - 解决方案：检查 Select 的 value 和 onChange 属性

## 立即测试命令

```bash
# 1. 检查数据库中的分类数据
sqlite3 data/database.json "SELECT DISTINCT category FROM notes;"

# 2. 检查标签数据
sqlite3 data/database.json "SELECT * FROM note_tags LIMIT 10;"

# 3. 测试 API 请求
curl "http://localhost:3001/api/notes?category=工作" \
  -H "Cookie: connect.sid=你的session" \
  -H "Content-Type: application/json"
```

## 下一步

打开浏览器，尝试筛选，并检查控制台输出！
