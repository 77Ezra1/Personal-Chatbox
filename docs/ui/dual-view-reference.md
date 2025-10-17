# 双视图功能快速参考

## 🚀 快速开始

### 文档管理页面
1. 访问 `/documents` 路由
2. 在左侧边栏顶部找到视图切换按钮
3. 点击 **☰** 使用列表视图
4. 点击 **▦** 使用卡片视图

### 密码管理页面
1. 访问 `/password-vault` 路由
2. 在左侧边栏顶部找到视图切换按钮
3. 点击 **☰** 使用列表视图
4. 点击 **▦** 使用卡片视图

## 📁 关键文件

### 组件文件
```
src/components/documents/
  ├── DocumentList.jsx       # 文档列表组件(含双视图)
  └── DocumentList.css       # 文档列表样式

src/components/password-vault/
  ├── PasswordList.jsx       # 密码列表组件(含双视图)
  └── PasswordList.css       # 密码列表样式(新建)
```

### 页面文件
```
src/pages/
  ├── DocumentsPage.jsx      # 文档管理页面
  ├── DocumentsPage.css      # 文档页面样式
  ├── PasswordVaultPage.jsx  # 密码管理页面
  └── PasswordVaultPage.css  # 密码页面样式
```

## 🎨 视图对比

### 列表视图 (List View - ☰)
```jsx
// 特点
- 紧凑的纵向排列
- 每行显示一个项目
- 适合快速浏览大量数据
- 显示更多元信息

// 使用场景
✓ 快速查找特定项目
✓ 需要查看详细信息
✓ 管理大量条目(100+)
```

### 卡片视图 (Card View - ▦)
```jsx
// 特点
- 网格布局,自适应列数
- 视觉丰富,易于区分
- 大图标展示
- 渐变背景头部

// 使用场景
✓ 浏览和探索内容
✓ 关注图标和视觉元素
✓ 展示和演示
```

## 💻 代码示例

### 在组件中使用
```jsx
// DocumentList 组件
<DocumentList
  documents={documents}
  selectedDocumentId={selectedDocument?.id}
  onSelectDocument={handleSelectDocument}
  onDeleteDocument={handleDeleteDocument}
  onToggleFavorite={handleToggleFavorite}
  translate={translate}
  viewMode={viewMode}  // 'list' 或 'card'
/>

// PasswordList 组件
<PasswordList
  entries={entries}
  selectedEntryId={selectedEntry?.id}
  onSelectEntry={handleSelectEntry}
  onDeleteEntry={handleDeleteEntry}
  onToggleFavorite={handleToggleFavorite}
  viewMode={viewMode}  // 'list' 或 'card'
/>
```

### 添加视图切换按钮
```jsx
// 在页面头部添加
const [viewMode, setViewMode] = useState('list');

<div className="view-mode-toggle">
  <button
    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
    onClick={() => setViewMode('list')}
    title="列表视图"
  >
    ☰
  </button>
  <button
    className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`}
    onClick={() => setViewMode('card')}
    title="卡片视图"
  >
    ▦
  </button>
</div>
```

## 🎯 样式类名

### 文档管理
```css
/* 容器 */
.document-list-wrapper
.document-list      /* 列表视图 */
.document-grid      /* 卡片视图 */

/* 列表项 */
.document-item
.document-item-icon
.document-item-content
.document-item-title
.document-item-actions

/* 卡片项 */
.document-card
.document-card-header
.document-card-icon
.document-card-body
.document-card-title
.document-card-actions
```

### 密码管理
```css
/* 容器 */
.vault-list-wrapper
.vault-list         /* 列表视图 */
.vault-grid         /* 卡片视图 */

/* 列表项 */
.vault-item
.vault-item-icon
.vault-item-content
.vault-item-title
.vault-item-actions

/* 卡片项 */
.vault-card
.vault-card-header
.vault-card-icon
.vault-card-body
.vault-card-title
.vault-card-actions
```

### 视图切换按钮
```css
/* 通用(在两个页面都使用) */
.view-mode-toggle   /* 按钮组容器 */
.view-mode-btn      /* 单个按钮 */
.view-mode-btn.active  /* 激活状态 */
```

## 🔧 自定义配置

### 修改网格列数
```css
/* DocumentList.css */
.document-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  /* 修改 280px 调整最小卡片宽度,从而影响列数 */
}

/* PasswordList.css */
.vault-grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  /* 修改 260px 调整最小卡片宽度 */
}
```

### 修改卡片样式
```css
/* 卡片高度 */
.document-card,
.vault-card {
  height: 100%;  /* 自适应高度 */
  /* 或设置固定高度: height: 300px; */
}

/* 卡片图标大小 */
.document-card-icon,
.vault-card-icon {
  font-size: 3.5rem;  /* 修改图标大小 */
}

/* 卡片间距 */
.document-grid,
.vault-grid {
  gap: 12px;  /* 修改卡片间距 */
}
```

## 📱 响应式断点

### 文档管理
```css
/* 桌面 (>1024px) */
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))

/* 平板 (768px-1024px) */
自适应列数

/* 移动 (<768px) */
单列布局,卡片宽度自适应
```

### 密码管理
```css
/* 桌面 (>768px) */
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))

/* 移动 (<768px) */
grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))
```

## 🐛 常见问题

### Q: 视图切换后内容不显示?
A: 检查 `viewMode` prop 是否正确传递到列表组件

### Q: 卡片布局不对齐?
A: 检查 CSS Grid 的 `minmax` 值是否合适,确保容器有足够宽度

### Q: 按钮样式不显示?
A: 确保导入了正确的 CSS 文件,检查 `.view-mode-toggle` 样式是否加载

### Q: 暗色主题下颜色不对?
A: 检查 CSS 变量是否正确使用,确保使用 `var(--primary)` 等主题变量

### Q: 移动端操作按钮看不见?
A: 移动端默认显示操作按钮,检查 `opacity: 1` 媒体查询是否生效

## 🚀 性能优化建议

1. **大数据量优化**
   - 使用虚拟滚动(react-window)处理 1000+ 项目
   - 实现分页或无限滚动

2. **动画性能**
   - 使用 CSS transform 而非 position
   - 避免在列表项上使用复杂动画

3. **图片优化**
   - 使用懒加载加载图标/图片
   - 考虑使用 SVG 代替位图图标

4. **状态管理**
   - 使用 localStorage 持久化视图偏好
   - 考虑使用 Context 统一管理视图状态

## 📚 相关文档

- [DUAL_VIEW_OPTIMIZATION_COMPLETE.md](./DUAL_VIEW_OPTIMIZATION_COMPLETE.md) - 完整优化报告
- [v0.dev 设计系统](https://v0.dev/) - 设计参考
- CSS Grid 布局 - MDN Web Docs

---

**创建时间**: 2025-10-17
**版本**: 1.0.0
**维护者**: Development Team
