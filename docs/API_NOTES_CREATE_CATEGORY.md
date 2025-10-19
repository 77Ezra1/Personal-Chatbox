# notesApi.createCategory 接口扩展文档

## 📋 概述

扩展了笔记分类创建接口，增加了更多自定义选项和完善的返回结构，支持分类描述、图标、排序等功能。

## 🔧 接口定义

### 请求

**端点**: `POST /api/notes/categories`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

**请求体参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | ✅ | - | 分类名称（1-50字符） |
| color | string | ❌ | #6366f1 | 分类颜色（支持 hex、rgb、rgba） |
| description | string | ❌ | '' | 分类描述 |
| icon | string | ❌ | '' | 分类图标（emoji 或图标名称） |
| sortOrder | number | ❌ | 自动计算 | 排序顺序（数字越小越靠前） |

**请求示例**:
```javascript
// 基础创建
const result = await notesApi.createCategory({
  name: '工作笔记'
});

// 完整参数创建
const result = await notesApi.createCategory({
  name: '学习笔记',
  color: '#3b82f6',
  description: '记录学习过程中的知识点和心得',
  icon: '📚',
  sortOrder: 1
});
```

### 响应

**成功响应** (201 Created):
```json
{
  "success": true,
  "category": {
    "id": 123,
    "user_id": 456,
    "name": "学习笔记",
    "color": "#3b82f6",
    "description": "记录学习过程中的知识点和心得",
    "icon": "📚",
    "sort_order": 1,
    "note_count": 0,
    "created_at": "2025-10-19T10:30:00.000Z",
    "updated_at": "2025-10-19T10:30:00.000Z"
  },
  "message": "Category created successfully"
}
```

**返回字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 操作是否成功 |
| category.id | number | 分类唯一标识 |
| category.user_id | number | 所属用户ID |
| category.name | string | 分类名称 |
| category.color | string | 分类颜色 |
| category.description | string | 分类描述 |
| category.icon | string | 分类图标 |
| category.sort_order | number | 排序顺序 |
| category.note_count | number | 该分类下的笔记数量 |
| category.created_at | string | 创建时间（ISO 8601） |
| category.updated_at | string | 更新时间（ISO 8601） |
| message | string | 操作结果消息 |

### 错误响应

**400 Bad Request** - 参数错误:
```json
{
  "success": false,
  "error": "Category name is required",
  "code": "MISSING_NAME"
}
```

**错误码列表**:

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| MISSING_NAME | 400 | 缺少分类名称 |
| NAME_TOO_LONG | 400 | 分类名称超过50字符 |
| INVALID_COLOR | 400 | 颜色格式不正确 |
| DUPLICATE_CATEGORY | 409 | 分类名称已存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 📝 使用示例

### 1. 基础使用

```javascript
import { createCategory } from '@/lib/notesApi';

async function handleCreateCategory() {
  try {
    const result = await createCategory({
      name: '工作笔记'
    });
    
    console.log('创建成功:', result.category);
    // 返回: { id: 1, name: '工作笔记', color: '#6366f1', ... }
  } catch (error) {
    console.error('创建失败:', error.message);
  }
}
```

### 2. 完整参数使用

```javascript
async function createFullCategory() {
  try {
    const result = await createCategory({
      name: '技术文档',
      color: '#10b981',
      description: '各种技术文档和API参考',
      icon: '🔧',
      sortOrder: 5
    });
    
    if (result.success) {
      console.log(`创建分类: ${result.category.name}`);
      console.log(`当前笔记数: ${result.category.note_count}`);
      console.log(`排序位置: ${result.category.sort_order}`);
    }
  } catch (error) {
    if (error.response?.data?.code === 'DUPLICATE_CATEGORY') {
      console.error('分类已存在！');
    }
  }
}
```

### 3. React 组件中使用

```jsx
import { useState } from 'react';
import { createCategory } from '@/lib/notesApi';
import { toast } from 'sonner';

function CategoryForm() {
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1',
    description: '',
    icon: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createCategory(formData);
      
      if (result.success) {
        toast.success(result.message);
        console.log('新分类:', result.category);
        
        // 重置表单
        setFormData({ name: '', color: '#6366f1', description: '', icon: '' });
      }
    } catch (error) {
      const errorCode = error.response?.data?.code;
      
      switch (errorCode) {
        case 'DUPLICATE_CATEGORY':
          toast.error('分类名称已存在');
          break;
        case 'NAME_TOO_LONG':
          toast.error('分类名称太长（最多50字符）');
          break;
        case 'INVALID_COLOR':
          toast.error('颜色格式不正确');
          break;
        default:
          toast.error('创建分类失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="分类名称"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        maxLength={50}
      />
      
      <input
        type="color"
        value={formData.color}
        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
      />
      
      <input
        type="text"
        placeholder="图标 (emoji)"
        value={formData.icon}
        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
      />
      
      <textarea
        placeholder="分类描述"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? '创建中...' : '创建分类'}
      </button>
    </form>
  );
}
```

### 4. 批量创建分类

```javascript
const defaultCategories = [
  { name: '工作', color: '#ef4444', icon: '💼', sortOrder: 1 },
  { name: '学习', color: '#3b82f6', icon: '📚', sortOrder: 2 },
  { name: '生活', color: '#10b981', icon: '🏠', sortOrder: 3 },
  { name: '想法', color: '#f59e0b', icon: '💡', sortOrder: 4 }
];

async function initializeCategories() {
  const results = [];
  
  for (const category of defaultCategories) {
    try {
      const result = await createCategory(category);
      if (result.success) {
        results.push(result.category);
      }
    } catch (error) {
      console.error(`创建分类 "${category.name}" 失败:`, error.message);
    }
  }
  
  console.log(`成功创建 ${results.length} 个分类`);
  return results;
}
```

## 🎨 颜色格式支持

支持以下颜色格式：

```javascript
// Hex 格式
color: '#6366f1'        // 标准6位
color: '#f00'           // 简写3位
color: '#6366f1ff'      // 带透明度8位

// RGB/RGBA 格式
color: 'rgb(99, 102, 241)'
color: 'rgba(99, 102, 241, 0.8)'
```

## 🔄 数据库迁移

新字段已添加到 `note_categories` 表：

```sql
ALTER TABLE note_categories ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE note_categories ADD COLUMN icon TEXT DEFAULT '';
ALTER TABLE note_categories ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE note_categories ADD COLUMN updated_at TEXT;
```

运行迁移脚本：
```bash
node server/migrations/001_add_category_fields.cjs
```

## ✅ 验证规则

1. **名称验证**:
   - 必填字段
   - 非空字符串
   - 长度：1-50 字符
   - 不区分大小写的唯一性检查

2. **颜色验证**:
   - 支持 hex 格式（#RGB, #RRGGBB, #RRGGBBAA）
   - 支持 rgb/rgba 格式
   - 默认值：#6366f1（紫色）

3. **排序验证**:
   - 数字类型
   - 如果未指定或为0，自动设置为最大值+1

## 📊 返回结构对比

### 扩展前：
```json
{
  "id": 1,
  "user_id": 123,
  "name": "工作",
  "color": "#6366f1",
  "created_at": "2025-10-19T10:00:00.000Z"
}
```

### 扩展后：
```json
{
  "success": true,
  "category": {
    "id": 1,
    "user_id": 123,
    "name": "工作",
    "color": "#6366f1",
    "description": "工作相关笔记",
    "icon": "💼",
    "sort_order": 1,
    "note_count": 0,
    "created_at": "2025-10-19T10:00:00.000Z",
    "updated_at": "2025-10-19T10:00:00.000Z"
  },
  "message": "Category created successfully"
}
```

## 🧪 测试建议

```javascript
// 测试用例
describe('createCategory API', () => {
  test('应成功创建基础分类', async () => {
    const result = await createCategory({ name: '测试分类' });
    expect(result.success).toBe(true);
    expect(result.category.name).toBe('测试分类');
    expect(result.category.color).toBe('#6366f1');
  });

  test('应成功创建完整分类', async () => {
    const result = await createCategory({
      name: '完整分类',
      color: '#ef4444',
      description: '测试描述',
      icon: '🎯',
      sortOrder: 5
    });
    expect(result.success).toBe(true);
    expect(result.category.icon).toBe('🎯');
    expect(result.category.sort_order).toBe(5);
  });

  test('应拒绝重复的分类名', async () => {
    await createCategory({ name: '重复测试' });
    await expect(
      createCategory({ name: '重复测试' })
    ).rejects.toThrow('Category already exists');
  });

  test('应拒绝空名称', async () => {
    await expect(
      createCategory({ name: '' })
    ).rejects.toThrow();
  });

  test('应拒绝超长名称', async () => {
    const longName = 'a'.repeat(51);
    await expect(
      createCategory({ name: longName })
    ).rejects.toThrow('must be less than 50 characters');
  });

  test('应拒绝无效颜色格式', async () => {
    await expect(
      createCategory({ name: '测试', color: 'invalid' })
    ).rejects.toThrow('Invalid color format');
  });
});
```

## 🚀 后续优化建议

1. **分类图标库**：预设常用图标供用户选择
2. **分类模板**：提供默认分类模板
3. **批量操作**：支持批量创建、导入分类
4. **分类统计**：添加更详细的统计信息
5. **分类层级**：支持子分类（父子关系）
6. **拖拽排序**：前端支持拖拽调整顺序
7. **分类归档**：软删除机制，支持归档分类

## 📚 相关接口

- `GET /api/notes/categories` - 获取所有分类
- `PUT /api/notes/categories/:id` - 更新分类
- `DELETE /api/notes/categories/:id` - 删除分类

## 🔗 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: React + Axios
- **验证**: 服务端验证 + 前端表单验证
