# Prompt 模板管理功能 - 优化计划

> **文档版本**: v1.0
> **创建时间**: 2025-01-21
> **目标模块**: Prompt Templates Management
> **原则**: 复用现有基础设施，不影响其他功能模块

---

## 📊 当前系统状态

### ✅ 已完成功能（Phase 3）
- [x] 多工作簿管理
- [x] 动态字段系统（6种类型）
- [x] 字段CRUD（添加/删除/重命名/插入）
- [x] 字段验证和编辑器
- [x] 模板CRUD
- [x] Fork 功能（带字段匹配）
- [x] 4种视图（Table/Card/List/Kanban）
- [x] 批量操作
- [x] 搜索过滤

### 📦 项目现有基础设施
- ✅ **Toast 通知**: Sonner (已安装并使用)
- ✅ **UI 组件库**: Radix UI (完整组件集)
- ✅ **日期处理**: date-fns v4.1.0
- ✅ **动画**: framer-motion
- ✅ **主题**: next-themes
- ✅ **工具函数**: lodash
- ✅ **快捷键**: useKeyboardShortcuts hook
- ✅ **表格**: AG Grid Community

### ⚠️ 待优化问题
1. 使用原生 `alert()` 对话框（体验差）
2. 搜索无防抖（性能浪费）
3. 加载状态简陋（只有文字）
4. 收藏功能未实现（数据库已支持）
5. 缺少快捷键（hook已存在）
6. 无导入/导出功能
7. 无使用统计

---

## 🎯 优化目标

### 核心目标
1. **提升用户体验** - 专业、流畅、符合现代 Web 标准
2. **复用现有资源** - 零新增依赖或最小化依赖
3. **保持兼容性** - 不影响其他功能模块
4. **渐进式增强** - 可分批实施，不破坏现有功能

### 成功指标
- ✅ 所有 alert() 替换为 Toast
- ✅ 搜索响应时间 < 300ms
- ✅ 骨架屏加载体验
- ✅ 快捷键覆盖率 > 80%
- ✅ 收藏功能可用

---

## 📋 优化任务清单

### 🔴 第一优先级（立即实施）

#### 1. Toast 通知系统集成 ⭐⭐⭐⭐⭐

**问题描述:**
```javascript
// 当前代码使用 alert()
alert('保存模板失败：' + error.message);
alert('请先选择要复制的模板（1-3个）');
confirm('确定要删除模板吗？');
```

**优化方案:**
```javascript
import { toast } from 'sonner';

// 成功提示
toast.success('模板创建成功！');

// 错误提示
toast.error('保存失败：' + error.message);

// 警告提示
toast.warning('请先选择1-3个模板');

// 加载提示
const loadingId = toast.loading('正在复制模板...');
await forkTemplates();
toast.success('复制成功！', { id: loadingId });

// 确认对话框（使用 toast.promise）
toast.promise(
  deleteTemplate(id),
  {
    loading: '正在删除...',
    success: '删除成功！',
    error: '删除失败'
  }
);
```

**影响文件:**
- `src/pages/PromptTemplatesPage/index.jsx`
- `src/pages/PromptTemplatesPage/components/ForkTemplatesDialog.jsx`
- `src/pages/PromptTemplatesPage/components/AddFieldModal.jsx`
- `src/pages/PromptTemplatesPage/components/ColumnHeaderMenu.jsx`
- `src/pages/PromptTemplatesPage/components/TableView.jsx`
- `src/pages/PromptTemplatesPage/components/CardView.jsx`
- `src/pages/PromptTemplatesPage/components/ListView.jsx`
- `src/pages/PromptTemplatesPage/components/KanbanView.jsx`

**预估工作量:** 1 小时

**收益:**
- ✅ 非阻塞式通知
- ✅ 自动消失（可配置）
- ✅ 支持多个通知堆叠
- ✅ 符合项目整体风格
- ✅ 零新增依赖

---

#### 2. 搜索防抖优化 ⭐⭐⭐⭐

**问题描述:**
当前搜索每次输入都触发 API 请求，造成性能浪费。

**优化方案:**
```javascript
// 使用 lodash.debounce（项目已有）
import { debounce } from 'lodash';
import { useMemo, useCallback } from 'react';

// 在 PromptTemplatesPage 中
const debouncedLoadTemplates = useMemo(
  () => debounce((filters) => {
    loadTemplates(filters);
  }, 300),
  [loadTemplates]
);

const handleFilterChange = useCallback((newFilters) => {
  setFilters(newFilters);
  debouncedLoadTemplates(newFilters);
}, [debouncedLoadTemplates]);
```

**搜索高亮实现:**
```javascript
// 创建高亮工具函数
function highlightText(text, query) {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50">{part}</mark>
      : part
  );
}

// 在 Card/List/Kanban View 中使用
<div>{highlightText(template.name, filters.search)}</div>
<div>{highlightText(template.content, filters.search)}</div>
```

**影响文件:**
- `src/pages/PromptTemplatesPage/index.jsx`
- `src/pages/PromptTemplatesPage/components/CardView.jsx`
- `src/pages/PromptTemplatesPage/components/ListView.jsx`

**预估工作量:** 30 分钟

**收益:**
- ✅ 减少 API 调用次数（节省 70%+）
- ✅ 更快的响应速度
- ✅ 更直观的搜索结果
- ✅ 复用 lodash

---

#### 3. 骨架屏加载状态 ⭐⭐⭐⭐

**问题描述:**
加载状态只显示简单的"加载中..."文字。

**优化方案:**
```javascript
// 创建 Skeleton 组件
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// Table View 骨架屏
function TableViewSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="flex gap-4 border rounded p-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Card View 骨架屏
function CardViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
      {[1,2,3,4,5,6,7,8].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 使用
{loading ? <CardViewSkeleton /> : <CardView {...props} />}
```

**影响文件:**
- `src/pages/PromptTemplatesPage/components/Skeleton.jsx` (新建)
- `src/pages/PromptTemplatesPage/components/TableView.jsx`
- `src/pages/PromptTemplatesPage/components/CardView.jsx`
- `src/pages/PromptTemplatesPage/components/ListView.jsx`
- `src/pages/PromptTemplatesPage/components/KanbanView.jsx`

**预估工作量:** 1 小时

**收益:**
- ✅ 感知性能大幅提升
- ✅ 专业的加载体验
- ✅ 无需新依赖
- ✅ 可复用到其他模块

---

### 🟡 第二优先级（建议实施）

#### 4. 模板收藏功能 ⭐⭐⭐⭐

**数据库支持:**
```sql
-- 表已存在
CREATE TABLE user_template_favorites (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  workbook_id INTEGER,
  template_id INTEGER,
  created_at TEXT,
  UNIQUE(user_id, workbook_id, template_id)
);
```

**API 端点:**
```javascript
// server/routes/prompt-favorites.cjs 已实现
POST   /api/prompt-favorites        // 切换收藏
GET    /api/prompt-favorites        // 获取收藏列表
DELETE /api/prompt-favorites/:id    // 取消收藏
```

**前端实现:**
```javascript
// 添加收藏按钮
<Button
  variant="ghost"
  size="sm"
  onClick={() => toggleFavorite(template)}
>
  <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
</Button>

// Toolbar 过滤器
<Toggle
  pressed={filters.onlyFavorites}
  onPressedChange={(pressed) =>
    setFilters({ ...filters, onlyFavorites: pressed })
  }
>
  <Star className="h-4 w-4 mr-2" />
  收藏
</Toggle>
```

**影响文件:**
- `src/pages/PromptTemplatesPage/hooks/useFavorites.js` (新建)
- `src/pages/PromptTemplatesPage/index.jsx`
- `src/pages/PromptTemplatesPage/components/Toolbar.jsx`
- 所有视图组件

**预估工作量:** 2 小时

**收益:**
- ✅ 快速访问常用模板
- ✅ 个性化体验
- ✅ 数据库已支持

---

#### 5. 快捷键支持 ⭐⭐⭐⭐

**项目已有 hook:**
```javascript
// src/hooks/useKeyboardShortcuts.js 已存在
```

**实现方案:**
```javascript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// 在 PromptTemplatesPage 中
const shortcuts = {
  'ctrl+n': {
    description: '新建模板',
    action: () => !currentWorkbook?.is_system && handleOpenTemplateDialog()
  },
  'ctrl+f': {
    description: '搜索',
    action: () => searchInputRef.current?.focus()
  },
  'delete': {
    description: '删除选中',
    action: () => selectedTemplates.length > 0 && handleBatchDelete()
  },
  'ctrl+a': {
    description: '全选',
    action: (e) => {
      e.preventDefault();
      setSelectedTemplates(templates);
    }
  },
  'escape': {
    description: '取消选择',
    action: () => setSelectedTemplates([])
  },
  'ctrl+e': {
    description: '导出选中',
    action: () => selectedTemplates.length > 0 && handleExport()
  }
};

useKeyboardShortcuts(shortcuts);
```

**快捷键提示:**
```javascript
// 在 Toolbar 添加快捷键按钮
<Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)}>
  <Keyboard className="h-4 w-4" />
</Button>

// 复用项目已有的 ShortcutsDialog
<ShortcutsDialog
  open={showShortcuts}
  onOpenChange={setShowShortcuts}
  shortcuts={shortcuts}
/>
```

**影响文件:**
- `src/pages/PromptTemplatesPage/index.jsx`

**预估工作量:** 1 小时

**收益:**
- ✅ 提升操作效率
- ✅ 复用项目基础设施
- ✅ 符合整体交互风格

---

#### 6. 导入/导出功能 ⭐⭐⭐⭐

**JSON 导出:**
```javascript
function exportTemplates(templates, format = 'json') {
  const data = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    workbook: currentWorkbook.name,
    count: templates.length,
    templates: templates.map(t => ({
      name: t.name,
      content: t.content,
      fields_data: t.fields_data
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompts-${currentWorkbook.name}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast.success(`成功导出 ${templates.length} 个模板`);
}
```

**CSV 导出:**
```javascript
function exportToCSV(templates) {
  const headers = ['名称', '内容', '标签', '创建时间'];
  const rows = templates.map(t => [
    t.name,
    t.content.replace(/"/g, '""'), // 转义引号
    (t.fields_data?.tags || []).join(';'),
    t.created_at
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  // ... 下载
}
```

**JSON 导入:**
```javascript
function ImportDialog({ open, onOpenChange, onConfirm }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setPreview(data);
      } catch (error) {
        toast.error('文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入模板</DialogTitle>
        </DialogHeader>

        <Input type="file" accept=".json,.csv" onChange={handleFileChange} />

        {preview && (
          <div className="space-y-2">
            <p>将导入 {preview.count} 个模板</p>
            <ScrollArea className="h-48">
              {preview.templates.map((t, i) => (
                <div key={i} className="p-2 border-b">
                  {t.name}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onConfirm(preview)}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**影响文件:**
- `src/pages/PromptTemplatesPage/components/ImportDialog.jsx` (新建)
- `src/pages/PromptTemplatesPage/components/Toolbar.jsx`
- `src/pages/PromptTemplatesPage/index.jsx`

**预估工作量:** 2 小时

**收益:**
- ✅ 数据备份
- ✅ 跨设备迁移
- ✅ 团队分享

---

### 🟢 第三优先级（可选）

#### 7. 模板使用统计 ⭐⭐⭐

**数据库迁移:**
```sql
-- 新建迁移文件 024-add-usage-tracking.sql
ALTER TABLE prompt_templates
ADD COLUMN usage_count INTEGER DEFAULT 0;

ALTER TABLE prompt_templates
ADD COLUMN last_used_at TEXT;

CREATE INDEX idx_templates_usage ON prompt_templates(usage_count DESC);
```

**API 更新:**
```javascript
// server/routes/prompt-templates.cjs
// 在复制模板时增加计数
router.post('/:id/use', authMiddleware, async (req, res) => {
  const { id } = req.params;

  db.prepare(`
    UPDATE prompt_templates
    SET usage_count = usage_count + 1,
        last_used_at = datetime('now')
    WHERE id = ?
  `).run(id);

  res.json({ success: true });
});
```

**前端显示:**
```javascript
// 在 Card View 中
<Badge variant="outline" className="text-xs">
  <TrendingUp className="h-3 w-3 mr-1" />
  {template.usage_count || 0} 次
</Badge>

// 排序选项
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectItem value="created_at">创建时间</SelectItem>
  <SelectItem value="updated_at">更新时间</SelectItem>
  <SelectItem value="usage_count">使用频率 ⭐</SelectItem>
  <SelectItem value="last_used_at">最近使用</SelectItem>
</Select>
```

**影响文件:**
- `server/db/migrations/024-add-usage-tracking.sql` (新建)
- `server/routes/prompt-templates.cjs`
- 所有视图组件

**预估工作量:** 2 小时（含数据库迁移）

**收益:**
- ✅ 了解使用习惯
- ✅ 智能排序
- ✅ 数据分析基础

---

#### 8. 批量标签操作 ⭐⭐

**功能描述:**
选中多个模板后，批量添加或删除标签。

**实现:**
```javascript
<Dialog>
  <DialogHeader>
    <DialogTitle>批量编辑标签</DialogTitle>
    <DialogDescription>
      将对 {selectedTemplates.length} 个模板进行操作
    </DialogDescription>
  </DialogHeader>

  <div className="space-y-4">
    <div>
      <Label>添加标签</Label>
      <TagsEditor value={tagsToAdd} onChange={setTagsToAdd} />
    </div>

    <div>
      <Label>删除标签</Label>
      <TagsEditor value={tagsToRemove} onChange={setTagsToRemove} />
    </div>
  </div>

  <DialogFooter>
    <Button onClick={handleBatchUpdateTags}>应用</Button>
  </DialogFooter>
</Dialog>
```

**预估工作量:** 1.5 小时

---

#### 9. 模板预览弹窗 ⭐⭐

**功能描述:**
点击模板卡片打开完整预览对话框。

**实现:**
```javascript
<Dialog>
  <DialogContent className="max-w-3xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle>{template.name}</DialogTitle>
      <DialogDescription>
        创建于 {formatDate(template.created_at)}
      </DialogDescription>
    </DialogHeader>

    <ScrollArea className="flex-1">
      <div className="space-y-4">
        <div>
          <Label>模板内容</Label>
          <div className="bg-muted p-4 rounded whitespace-pre-wrap">
            {template.content}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 显示所有自定义字段 */}
        </div>
      </div>
    </ScrollArea>

    <DialogFooter>
      <Button onClick={() => copyToClipboard(template.content)}>
        <Copy className="mr-2" /> 复制
      </Button>
      <Button onClick={() => handleEdit(template)}>
        <Edit className="mr-2" /> 编辑
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**预估工作量:** 1 小时

---

## 📅 实施计划

### 第一周（优先级 🔴）
**目标:** 提升核心用户体验

| 任务 | 预估工作量 | 负责人 | 状态 |
|------|-----------|--------|------|
| Toast 通知系统 | 1h | - | ⏳ 待开始 |
| 搜索防抖优化 | 0.5h | - | ⏳ 待开始 |
| 骨架屏加载 | 1h | - | ⏳ 待开始 |

**总计:** 2.5 小时

---

### 第二周（优先级 🟡）
**目标:** 增强功能完整性

| 任务 | 预估工作量 | 负责人 | 状态 |
|------|-----------|--------|------|
| 模板收藏功能 | 2h | - | ⏳ 待开始 |
| 快捷键支持 | 1h | - | ⏳ 待开始 |
| 导入/导出 | 2h | - | ⏳ 待开始 |

**总计:** 5 小时

---

### 第三周（优先级 🟢，可选）
**目标:** 高级功能

| 任务 | 预估工作量 | 负责人 | 状态 |
|------|-----------|--------|------|
| 使用统计 | 2h | - | ⏳ 待开始 |
| 批量标签 | 1.5h | - | ⏳ 待开始 |
| 预览弹窗 | 1h | - | ⏳ 待开始 |

**总计:** 4.5 小时

---

## 🚫 不建议的优化

以下优化会增加复杂度或与项目架构冲突，**不建议实施**：

1. ❌ **引入新的状态管理库**（Redux/Zustand）
   - 原因: 项目已使用 React Context + hooks
   - 影响: 增加学习成本，与其他模块不一致

2. ❌ **替换 AG Grid**
   - 原因: 已集成且功能强大
   - 影响: 破坏现有 Table View

3. ❌ **引入 GraphQL**
   - 原因: 项目使用 REST API
   - 影响: 需要改造后端，影响所有模块

4. ❌ **添加实时协作**（WebSocket）
   - 原因: 需要基础设施支持
   - 影响: 可能影响其他模块的网络连接

5. ❌ **重写为 TypeScript**
   - 原因: 项目整体是 JSX
   - 影响: 增加维护成本，不一致

6. ❌ **引入重量级图表库**（ECharts）
   - 原因: 增加 bundle 大小
   - 建议: 如需图表，使用轻量的 Recharts

---

## ✅ 验收标准

### 第一周完成后
- [ ] 所有 `alert()` 和 `confirm()` 已替换为 Toast
- [ ] 搜索输入有防抖，延迟 300ms
- [ ] 所有视图有骨架屏加载状态
- [ ] 用户反馈：加载体验更流畅

### 第二周完成后
- [ ] 收藏功能可用，数据持久化
- [ ] 快捷键可用，有提示面板
- [ ] 可导出 JSON/CSV 格式
- [ ] 可导入 JSON 格式，有预览

### 第三周完成后（可选）
- [ ] 每个模板显示使用次数
- [ ] 可按使用频率排序
- [ ] 批量标签操作可用
- [ ] 预览弹窗完整显示所有信息

---

## 📊 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| Toast 与其他模块冲突 | 低 | 低 | 项目已广泛使用 Sonner |
| 搜索防抖影响实时性 | 低 | 低 | 300ms 延迟可接受 |
| 骨架屏增加代码量 | 中 | 低 | 可复用组件 |
| 导入破坏数据 | 中 | 高 | 添加数据验证和预览 |
| 快捷键冲突 | 低 | 中 | 使用 Ctrl/Cmd 组合键 |

---

## 📝 备注

### 依赖清单
所有优化均使用**项目已有依赖**，无需新增：
- ✅ sonner (Toast)
- ✅ lodash (debounce)
- ✅ framer-motion (动画)
- ✅ @radix-ui/* (UI组件)
- ✅ date-fns (日期格式化)
- ✅ lucide-react (图标)

### 兼容性
- ✅ 不影响其他页面（AgentsPage, NotesPage, DocumentsPage 等）
- ✅ 不修改全局样式
- ✅ 不修改数据库 schema（除非明确标注）
- ✅ 向后兼容现有数据

### 测试建议
每个功能完成后：
1. 手动测试所有视图（Table/Card/List/Kanban）
2. 测试系统工作簿和用户工作簿
3. 测试批量操作
4. 检查 Console 无错误
5. 验证数据持久化

---

## 🎯 总结

本优化计划聚焦于**用户体验提升**和**功能完整性**，遵循以下原则：

1. **复用优先** - 最大化利用项目现有基础设施
2. **渐进增强** - 可分批实施，互不影响
3. **零破坏** - 不影响其他功能模块
4. **轻量化** - 最小化新增依赖和代码

**预估总工作量:** 12 小时（分 3 周完成）

**建议立即启动:** 第一周的 3 个任务（2.5小时），收益最高。

---

**文档结束**
