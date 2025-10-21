import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Edit, Trash2, Plus, Star } from 'lucide-react';
import { formatFieldValue } from './FieldEditors';
import { KanbanViewSkeleton } from './SkeletonLoaders';
import ConfirmDialog from './ConfirmDialog';

/**
 * Kanban View Component
 * 看板视图 - 按字段分组展示模板
 */
export default function KanbanView({
  workbook,
  templates,
  loading,
  onUpdate,
  onDelete,
  onEditTemplate,
  onToggleFavorite,
  selectedTemplates = []
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // 获取自定义字段
  const customFields = workbook?.field_schema?.fields || [];

  // 可用于分组的字段（tags、text、boolean）
  const groupableFields = useMemo(() => {
    return customFields.filter(f =>
      ['tags', 'text', 'boolean'].includes(f.type)
    );
  }, [customFields]);

  // 当前分组字段
  const [groupByField, setGroupByField] = useState(
    groupableFields.length > 0 ? groupableFields[0].name : null
  );

  // 根据字段分组模板
  const groupedTemplates = useMemo(() => {
    if (!groupByField) return { '未分组': templates };

    const groups = {};
    const field = customFields.find(f => f.name === groupByField);

    if (!field) return { '未分组': templates };

    templates.forEach(template => {
      const value = template.fields_data?.[groupByField];

      if (field.type === 'tags') {
        // 标签字段：每个标签一个分组
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(tag => {
            if (!groups[tag]) groups[tag] = [];
            groups[tag].push(template);
          });
        } else {
          if (!groups['未标记']) groups['未标记'] = [];
          groups['未标记'].push(template);
        }
      } else if (field.type === 'boolean') {
        // 布尔字段：是/否两个分组
        const groupKey = value === true ? '是' : value === false ? '否' : '未设置';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(template);
      } else {
        // 文本字段：按值分组
        const groupKey = value || '未设置';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(template);
      }
    });

    return groups;
  }, [templates, groupByField, customFields]);

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
    return <KanbanViewSkeleton />;
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

  if (groupableFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-muted-foreground">
          看板视图需要至少一个可分组的字段（标签、文本或布尔值）
        </div>
        {!workbook.is_system && (
          <Button onClick={() => {}}>添加字段</Button>
        )}
      </div>
    );
  }

  const isSystem = workbook.is_system;

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">分组依据:</span>
          <Select value={groupByField} onValueChange={setGroupByField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupableFields.map(field => (
                <SelectItem key={field.name} value={field.name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          共 {Object.keys(groupedTemplates).length} 个分组，{templates.length} 个模板
        </div>
      </div>

      {/* 看板列 */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {Object.entries(groupedTemplates).map(([groupName, groupTemplates]) => (
            <div
              key={groupName}
              className="flex flex-col w-80 bg-muted/30 rounded-lg border"
            >
              {/* 列头 */}
              <div className="flex items-center justify-between p-4 border-b bg-background/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{groupName}</h3>
                  <Badge variant="secondary">{groupTemplates.length}</Badge>
                </div>
              </div>

              {/* 卡片列表 */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {groupTemplates.map(template => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm line-clamp-2">
                          {template.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3">
                        {/* 内容预览 */}
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {template.content}
                        </p>

                        {/* 其他字段 */}
                        {customFields
                          .filter(f => f.name !== groupByField && f.type === 'tags')
                          .slice(0, 1)
                          .map(field => {
                            const tags = template.fields_data?.[field.name];
                            if (!Array.isArray(tags) || tags.length === 0) return null;

                            return (
                              <div key={field.name} className="flex flex-wrap gap-1">
                                {tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{tags.length - 3}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                        {/* 操作按钮 */}
                        <div className="flex gap-1 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleFavorite?.(template.id, workbook.id, template.is_favorite)}
                            title={template.is_favorite ? '取消收藏' : '收藏'}
                            className={template.is_favorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
                          >
                            <Star className={`h-3 w-3 ${template.is_favorite ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => handleCopy(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            复制
                          </Button>
                          {!isSystem && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(template)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(template)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
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
