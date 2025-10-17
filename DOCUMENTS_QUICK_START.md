# 文档管理功能 - 快速启动指南

## 🎉 功能已完成！

文档管理模块已完全实现，包含以下所有功能：

### ✅ 已实现的功能

1. **完整的CRUD操作**
   - 创建、读取、更新、删除文档
   - 文档编辑器with图标选择器
   - 标签系统和分类管理

2. **高级搜索和过滤**
   - 全文搜索（FTS5支持）
   - 按分类、标签过滤
   - 收藏和归档功能
   - 多种排序选项

3. **统计功能**
   - 访问次数追踪
   - 文档统计仪表板
   - 最常访问文档

4. **数据管理**
   - 导出为JSON
   - 从JSON导入
   - 批量操作支持

5. **UI设计**
   - v0.dev风格设计
   - 响应式布局
   - 暗色模式支持
   - 流畅动画效果

## 🚀 快速启动

### 1. 启动服务

```bash
# 启动开发服务器
npm run dev

# 或使用一键启动脚本
./start-dev.sh
```

### 2. 访问文档管理

1. 打开浏览器访问 http://localhost:5173
2. 在侧边栏点击 **📖 Documents** (带有"New"标签)
3. 开始使用！

### 3. 创建第一个文档

1. 点击左上角的 **"+ New"** 按钮
2. 填写信息：
   - 标题：例如 "React 官方文档"
   - URL: https://react.dev
   - 选择一个图标 📚
   - 添加描述和标签
3. 点击 **Save**

### 4. 使用功能

**查看文档：**
- 点击文档卡片查看详情
- 点击"Open Link"按钮在新标签页打开

**搜索：**
- 在搜索框输入关键词实时搜索

**过滤：**
- 使用分类和标签下拉菜单过滤
- 勾选"Favorites Only"只显示收藏

**收藏：**
- 点击文档卡片上的⭐图标

**编辑：**
- 选择文档后点击右上角"Edit"按钮

**删除：**
- 点击文档卡片右侧的🗑️图标

## 📁 文件结构

```
server/
├── db/
│   └── migrations/
│       └── 020-add-documents.sql        # 数据库迁移文件
├── routes/
│   └── documents.cjs                     # API路由
└── services/
    └── documentService.cjs               # 业务逻辑

src/
├── components/
│   └── documents/
│       ├── DocumentList.jsx              # 文档列表组件
│       ├── DocumentList.css
│       ├── DocumentEditor.jsx            # 文档编辑器
│       └── DocumentEditor.css
├── pages/
│   ├── DocumentsPage.jsx                 # 主页面
│   └── DocumentsPage.css
└── lib/
    └── documentsApi.js                   # API客户端

docs/
└── DOCUMENTS_FEATURE.md                  # 完整功能文档
```

## 🎨 UI 特性

### v0.dev 设计风格
- 简洁的卡片布局
- 柔和的悬停效果
- 流畅的动画过渡
- 现代化的图标系统
- 响应式设计

### 主题支持
- 自动适配亮色/暗色主题
- 优雅的颜色过渡
- 可访问性优化

## 🔧 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite with FTS5 (全文搜索)
- **前端**: React 18 + Vite
- **UI**: CSS Variables + Tailwind
- **路由**: React Router v6
- **状态管理**: React Hooks
- **图标**: Lucide React + Emoji

## 📊 数据库迁移

数据库迁移文件会在服务器启动时自动运行。如果需要手动运行：

```bash
# 运行迁移
node server/db/run-migration.cjs
```

迁移文件位置：`server/db/migrations/020-add-documents.sql`

## 🎯 使用示例

### 示例1：添加技术文档
```
标题: React Documentation
URL: https://react.dev
分类: Frontend
标签: react, javascript, library
图标: ⚛️
```

### 示例2：添加API参考
```
标题: OpenAI API Reference
URL: https://platform.openai.com/docs
分类: AI/ML
标签: api, openai, gpt
图标: 🤖
收藏: ✓
```

### 示例3：添加学习资源
```
标题: JavaScript MDN
URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript
分类: Learning
标签: javascript, mdn, tutorial
图标: 📚
```

## 🐛 故障排除

### 数据库未迁移
如果遇到表不存在的错误：
```bash
# 重新运行迁移
node server/db/run-migration.cjs
```

### 路由不工作
确保 [App.jsx](src/App.jsx:695) 中已添加文档路由：
```jsx
<Route path="/documents" element={<DocumentsPage />} />
```

### 侧边栏没有显示
确保 [Sidebar.jsx](src/components/sidebar/Sidebar.jsx:44) 中已添加导航项：
```jsx
{ path: '/documents', icon: BookOpen, label: translate('sidebar.documents', 'Documents'), badge: 'New' }
```

## 📚 完整文档

查看 [DOCUMENTS_FEATURE.md](docs/DOCUMENTS_FEATURE.md) 获取：
- 详细的API文档
- 数据库设计说明
- 使用场景示例
- 未来规划

## 🎉 开始使用

现在你可以：

1. ✅ 启动服务器
2. ✅ 访问 /documents 页面
3. ✅ 创建你的第一个文档
4. ✅ 享受高效的文档管理体验！

---

**提示**: 文档管理功能完全独立，不会影响现有的聊天、笔记等功能。所有数据都存储在本地数据库中，可以随时导出备份。
