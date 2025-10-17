# 笔记功能文档 / Notes Feature Documentation

## 概述 / Overview

完整的笔记管理系统，支持富文本编辑、分类、标签、搜索和导入导出功能。

A complete note management system with rich text editing, categories, tags, search, and import/export functionality.

## 功能特性 / Features

### 1. 笔记管理 / Note Management
- ✅ 创建、编辑、删除笔记
- ✅ 富文本编辑器（支持Markdown语法）
- ✅ 实时预览功能
- ✅ 收藏笔记
- ✅ 归档笔记

### 2. 分类和标签 / Categories and Tags
- ✅ 自定义分类管理
- ✅ 多标签支持
- ✅ 标签统计
- ✅ 按分类/标签过滤

### 3. 搜索和过滤 / Search and Filter
- ✅ 全文搜索（FTS5）
- ✅ 降级LIKE搜索支持
- ✅ 按分类过滤
- ✅ 按标签过滤
- ✅ 仅显示收藏
- ✅ 显示/隐藏归档
- ✅ 多种排序方式（更新时间、创建时间、标题）

### 4. 导入导出 / Import/Export
- ✅ JSON格式导出
- ✅ JSON格式导入
- ✅ 批量操作支持

### 5. 统计信息 / Statistics
- ✅ 总笔记数
- ✅ 收藏笔记数
- ✅ 分类数量
- ✅ 标签数量

## 技术架构 / Technical Architecture

### 后端 / Backend

#### 数据库表结构
```sql
-- 笔记表
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'default',
  tags TEXT DEFAULT '[]',
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 笔记标签关联表
CREATE TABLE note_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 笔记分类表
CREATE TABLE note_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);
```

#### API端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes | 获取所有笔记 |
| GET | /api/notes/:id | 获取单个笔记 |
| POST | /api/notes | 创建新笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/notes/batch-delete | 批量删除笔记 |
| GET | /api/notes/search | 搜索笔记 |
| GET | /api/notes/categories | 获取所有分类 |
| POST | /api/notes/categories | 创建新分类 |
| PUT | /api/notes/categories/:id | 更新分类 |
| DELETE | /api/notes/categories/:id | 删除分类 |
| GET | /api/notes/tags | 获取所有标签 |
| GET | /api/notes/statistics | 获取统计信息 |
| POST | /api/notes/export | 导出笔记 |
| POST | /api/notes/import | 导入笔记 |

#### 服务层
- `server/services/noteService.cjs`: 笔记业务逻辑
- `server/routes/notes.cjs`: API路由处理

### 前端 / Frontend

#### 组件结构
```
src/
├── components/
│   └── notes/
│       ├── NoteEditor.jsx      # 笔记编辑器
│       ├── NoteEditor.css      # 编辑器样式
│       ├── NoteList.jsx        # 笔记列表
│       └── NoteList.css        # 列表样式
├── pages/
│   ├── NotesPage.jsx           # 笔记主页面
│   └── NotesPage.css           # 页面样式
└── lib/
    └── notesApi.js             # API客户端
```

#### 核心组件

##### NoteEditor
- 标题编辑
- 内容编辑（支持Markdown）
- 实时预览
- 格式化工具栏
- 分类选择
- 标签管理
- 快捷键支持（Ctrl+S保存，Esc取消）

##### NoteList
- 笔记卡片展示
- 收藏/取消收藏
- 快速删除
- 点击查看详情

##### NotesPage
- 侧边栏：搜索、过滤、统计、笔记列表
- 主内容区：查看器或编辑器
- 操作按钮：导出、导入

## 使用指南 / Usage Guide

### 创建笔记 / Creating a Note
1. 点击"新建笔记"按钮
2. 输入标题和内容
3. 选择分类（可选）
4. 添加标签（可选）
5. 点击"保存"或按Ctrl+S

### 编辑笔记 / Editing a Note
1. 在列表中选择笔记
2. 点击"编辑"按钮
3. 修改内容
4. 保存更改

### 搜索笔记 / Searching Notes
1. 在搜索框输入关键词
2. 系统会实时搜索标题和内容
3. 支持FTS5全文搜索

### 过滤笔记 / Filtering Notes
- 按分类过滤
- 按标签过滤
- 仅显示收藏
- 显示/隐藏归档
- 自定义排序方式

### 导入导出 / Import/Export
**导出：**
1. 点击"导出"按钮
2. 自动下载JSON文件

**导入：**
1. 点击"导入"按钮
2. 选择JSON文件
3. 系统自动导入笔记

## 快捷键 / Keyboard Shortcuts

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存笔记 |
| Esc | 取消编辑 |
| Enter/逗号 | 添加标签 |

## Markdown支持 / Markdown Support

编辑器支持以下Markdown语法：

```markdown
# 标题1
## 标题2
### 标题3

**粗体**
*斜体*

- 无序列表
1. 有序列表

[链接](https://example.com)

`行内代码`

​```
代码块
​```
```

## 国际化 / Internationalization

支持中英文双语：
- 英文（English）
- 中文（简体）

翻译文件位于：`src/lib/constants.js`

## 数据库迁移 / Database Migration

迁移文件：`server/db/migrations/018-add-notes.sql`

自动执行：系统启动时自动运行迁移

## 性能优化 / Performance Optimization

1. **索引优化**：为常用查询字段添加索引
2. **FTS全文搜索**：使用SQLite FTS5提供快速搜索
3. **分页加载**：支持分页参数，避免一次加载过多数据
4. **懒加载**：NotesPage使用React.lazy延迟加载

## 安全性 / Security

1. **认证保护**：所有API端点需要用户认证
2. **用户隔离**：每个用户只能访问自己的笔记
3. **SQL注入防护**：使用参数化查询
4. **XSS防护**：前端使用dangerouslySetInnerHTML时进行内容清理

## 未来计划 / Future Plans

- [ ] Markdown导出
- [ ] PDF导出
- [ ] 图片上传支持
- [ ] 笔记协作功能
- [ ] 版本历史
- [ ] 回收站功能
- [ ] 快捷笔记（快速创建）
- [ ] 笔记模板
- [ ] 代码高亮
- [ ] 数学公式支持（LaTeX）

## 故障排查 / Troubleshooting

### 搜索不工作
- 确保数据库支持FTS5
- 检查notes_fts虚拟表是否正确创建
- 系统会自动降级为LIKE搜索

### 笔记无法保存
- 检查用户认证状态
- 查看浏览器控制台错误
- 检查后端日志

### 导入失败
- 确保JSON格式正确
- 检查文件大小限制
- 验证notes数组格式

## 技术支持 / Technical Support

如有问题，请查看：
- 浏览器控制台日志
- 后端服务器日志
- 数据库连接状态

## 更新日志 / Changelog

### v1.0.0 (2025-01-17)
- ✅ 初始版本发布
- ✅ 完整的笔记CRUD功能
- ✅ 富文本编辑器
- ✅ 分类和标签系统
- ✅ 全文搜索
- ✅ 导入导出
- ✅ 中英文支持
