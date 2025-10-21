import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Edit, Trash2, Star } from 'lucide-react';
import { formatFieldValue } from './FieldEditors';
import ConfirmDialog from './ConfirmDialog';
import { CardViewSkeleton } from './SkeletonLoaders';

/**
 * Card View Component
 * 卡片视图 - 以卡片形式展示模板
 */
export default function CardView({
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
    return <CardViewSkeleton />;
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

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => {
          const isSelected = localSelection.has(template.id);
          const isSystem = workbook.is_system;

          return (
            <Card
              key={template.id}
              className={`relative transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* 选择框 */}
              {!isSystem && (
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelection(template)}
                  />
                </div>
              )}

              <CardHeader className={!isSystem ? 'pt-12' : ''}>
                <CardTitle className="text-lg line-clamp-1">
                  {template.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.content}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 自定义字段 */}
                {customFields.slice(0, 3).map((field) => {
                  const value = template.fields_data?.[field.name];
                  if (!value && value !== 0 && value !== false) return null;

                  const formattedValue = formatFieldValue(field.type, value);

                  return (
                    <div key={field.name} className="flex flex-col gap-1">
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
                          <span className="line-clamp-1">{formattedValue}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 显示更多字段提示 */}
                {customFields.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{customFields.length - 3} 个字段
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2 justify-end border-t pt-4">
                {/* Favorite button */}
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
              </CardFooter>
            </Card>
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
