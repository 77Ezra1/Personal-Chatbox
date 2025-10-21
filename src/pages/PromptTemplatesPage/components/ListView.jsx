import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Edit, Trash2, ChevronRight, Star } from 'lucide-react';
import { formatFieldValue } from './FieldEditors';
import { ListViewSkeleton } from './SkeletonLoaders';
import ConfirmDialog from './ConfirmDialog';

/**
 * List View Component
 * 列表视图 - 紧凑的列表形式展示模板
 */
export default function ListView({
  workbook,
  templates,
  loading,
  onUpdate,
  onDelete,
  onSelectionChange,
  onEditTemplate,
  onToggleFavorite,
  selectedTemplates = []
}) {
  const [localSelection, setLocalSelection] = useState(new Set(selectedTemplates.map(t => t.id)));
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // 获取自定义字段
  const customFields = workbook?.field_schema?.fields || [];

  // 处理选择
  const handleToggleSelection = (template) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(template.id)) {
      newSelection.delete(template.id);
    } else {
      newSelection.add(template.id);
    }
    setLocalSelection(newSelection);

    // 通知父组件
    const selectedList = templates.filter(t => newSelection.has(t.id));
    onSelectionChange(selectedList);
  };

  // 处理展开/收起
  const handleToggleExpand = (templateId) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedIds(newExpanded);
  };

  // 处理复制
  const handleCopy = (template) => {
    navigator.clipboard.writeText(template.content);
    toast.success('模板内容已复制到剪贴板');
  };

  // 处理编辑
  const handleEdit = (template) => {
    if (onEditTemplate) {
      onEditTemplate(template);
    }
  };

  // 处理删除
  const handleDelete = (template) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      onDelete(templateToDelete.id);
      toast.success('模板已删除');
      setTemplateToDelete(null);
    }
  };

  if (loading) {
    return <ListViewSkeleton />;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-muted-foreground">暂无模板</div>
        {!workbook.is_system && (
          <Button onClick={() => onEditTemplate?.()}>创建第一个模板</Button>
        )}
      </div>
    );
  }

  const isSystem = workbook.is_system;

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="space-y-2">
        {templates.map((template) => {
          const isSelected = localSelection.has(template.id);
          const isExpanded = expandedIds.has(template.id);

          return (
            <div
              key={template.id}
              className={`border rounded-lg transition-all ${
                isSelected ? 'ring-2 ring-primary bg-accent/5' : 'hover:bg-accent/5'
              }`}
            >
              {/* 列表项主体 */}
              <div className="flex items-center gap-3 p-4">
                {/* 选择框 */}
                {!isSystem && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelection(template)}
                  />
                )}

                {/* 展开/收起按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleToggleExpand(template.id)}
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </Button>

                {/* 模板名称和内容预览 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{template.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {template.content}
                  </div>
                </div>

                {/* 快速显示标签字段 */}
                {customFields
                  .filter(f => f.type === 'tags')
                  .slice(0, 1)
                  .map(field => {
                    const tags = template.fields_data?.[field.name];
                    if (!Array.isArray(tags) || tags.length === 0) return null;

                    return (
                      <div key={field.name} className="flex gap-1">
                        {tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    );
                  })}

                {/* 操作按钮 */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleFavorite?.(template.id, workbook.id, template.is_favorite)}
                    title={template.is_favorite ? '取消收藏' : '收藏'}
                    className={template.is_favorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
                  >
                    <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(template)}
                    title="复制内容"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!isSystem && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template)}
                        title="删除"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* 展开的详细信息 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-3">
                  {/* 完整内容 */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      模板内容
                    </div>
                    <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                      {template.content}
                    </div>
                  </div>

                  {/* 自定义字段 */}
                  {customFields.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {customFields.map((field) => {
                        const value = template.fields_data?.[field.name];
                        if (!value && value !== 0 && value !== false) return null;

                        const formattedValue = formatFieldValue(field.type, value);

                        return (
                          <div key={field.name} className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">
                              {field.name}
                            </div>
                            <div className="text-sm">
                              {field.type === 'tags' ? (
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(value) ? value : []).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              ) : field.type === 'boolean' ? (
                                <Badge variant={value ? 'default' : 'secondary'}>
                                  {formattedValue}
                                </Badge>
                              ) : (
                                <span>{formattedValue}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 元数据 */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>ID: {template.id}</span>
                    <span>
                      创建时间: {new Date(template.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="删除模板"
        description={`确定要删除模板"${templateToDelete?.name}"吗？\n此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </div>
  );
}
