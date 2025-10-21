import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowRight, Copy } from 'lucide-react';

/**
 * Fork Templates Dialog
 * 复制系统模板到用户工作簿（支持1-3个模板）
 * 包含字段匹配功能
 */
export default function ForkTemplatesDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedTemplates = [],
  sourceWorkbook,
  targetWorkbooks = []
}) {
  const [targetWorkbookId, setTargetWorkbookId] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [newFieldsToAdd, setNewFieldsToAdd] = useState([]);

  // 重置状态
  useEffect(() => {
    if (open) {
      setTargetWorkbookId(null);
      setFieldMapping({});
      setNewFieldsToAdd([]);
    }
  }, [open]);

  // 获取目标工作簿
  const targetWorkbook = useMemo(() => {
    return targetWorkbooks.find(wb => wb.id === targetWorkbookId);
  }, [targetWorkbooks, targetWorkbookId]);

  // 源工作簿字段
  const sourceFields = useMemo(() => {
    return sourceWorkbook?.field_schema || [];
  }, [sourceWorkbook]);

  // 目标工作簿字段
  const targetFields = useMemo(() => {
    return targetWorkbook?.field_schema || [];
  }, [targetWorkbook]);

  // 分析字段匹配
  const fieldAnalysis = useMemo(() => {
    const matching = []; // 名称相同的字段
    const missing = [];  // 目标工作簿缺失的字段
    const extra = [];    // 目标工作簿多余的字段

    sourceFields.forEach(sourceField => {
      const targetField = targetFields.find(f => f.name === sourceField.name);
      if (targetField) {
        matching.push({
          name: sourceField.name,
          sourceType: sourceField.type,
          targetType: targetField.type,
          typeMatch: sourceField.type === targetField.type
        });
      } else {
        missing.push(sourceField);
      }
    });

    targetFields.forEach(targetField => {
      if (!sourceFields.find(f => f.name === targetField.name)) {
        extra.push(targetField);
      }
    });

    return { matching, missing, extra };
  }, [sourceFields, targetFields]);

  // 处理字段映射变化
  const handleFieldMappingChange = (sourceFieldName, action) => {
    setFieldMapping(prev => ({
      ...prev,
      [sourceFieldName]: action
    }));

    // 如果选择"添加新字段"，自动勾选
    if (action === 'add') {
      const sourceField = sourceFields.find(f => f.name === sourceFieldName);
      if (sourceField && !newFieldsToAdd.find(f => f.name === sourceFieldName)) {
        setNewFieldsToAdd(prev => [...prev, sourceField]);
      }
    } else {
      // 取消勾选
      setNewFieldsToAdd(prev => prev.filter(f => f.name !== sourceFieldName));
    }
  };

  // 处理确认
  const handleConfirm = () => {
    if (!targetWorkbookId) {
      toast.error('请选择目标工作簿');
      return;
    }

    if (selectedTemplates.length === 0) {
      toast.error('请至少选择一个模板');
      return;
    }

    if (selectedTemplates.length > 3) {
      toast.error('最多只能复制 3 个模板');
      return;
    }

    // 检查缺失字段是否都已处理
    const unhandledFields = fieldAnalysis.missing.filter(
      field => !fieldMapping[field.name]
    );

    if (unhandledFields.length > 0) {
      toast.error(`请处理以下缺失字段：${unhandledFields.map(f => f.name).join(', ')}`);
      return;
    }

    onConfirm({
      targetWorkbookId,
      templateIds: selectedTemplates.map(t => t.id),
      fieldMapping,
      newFieldsToAdd
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            <Copy className="inline h-5 w-5 mr-2" />
            复制模板到工作簿
          </DialogTitle>
          <DialogDescription>
            已选择 {selectedTemplates.length} 个模板 (最多3个)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* 选择目标工作簿 */}
            <div className="space-y-2">
              <Label>目标工作簿</Label>
              <Select value={targetWorkbookId} onValueChange={setTargetWorkbookId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要复制到的工作簿" />
                </SelectTrigger>
                <SelectContent>
                  {targetWorkbooks
                    .filter(wb => !wb.is_system)
                    .map(wb => (
                      <SelectItem key={wb.id} value={wb.id}>
                        {wb.icon} {wb.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 已选择的模板列表 */}
            <div className="space-y-2">
              <Label>将复制以下模板</Label>
              <div className="bg-muted p-3 rounded-md space-y-1">
                {selectedTemplates.map((template, index) => (
                  <div key={template.id} className="text-sm">
                    {index + 1}. {template.name}
                  </div>
                ))}
              </div>
            </div>

            {/* 字段匹配分析 */}
            {targetWorkbookId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <Label className="text-base">字段匹配分析</Label>
                  </div>

                  {/* 匹配的字段 */}
                  {fieldAnalysis.matching.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-600">
                        ✓ 匹配字段 ({fieldAnalysis.matching.length})
                      </div>
                      <div className="space-y-1">
                        {fieldAnalysis.matching.map(field => (
                          <div
                            key={field.name}
                            className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded"
                          >
                            <Badge variant="outline">{field.name}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {field.sourceType} → {field.targetType}
                            </span>
                            {!field.typeMatch && (
                              <Badge variant="destructive" className="text-xs">
                                类型不匹配
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 缺失的字段 */}
                  {fieldAnalysis.missing.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-orange-600">
                        ⚠ 缺失字段 ({fieldAnalysis.missing.length})
                      </div>
                      <div className="space-y-2">
                        {fieldAnalysis.missing.map(field => (
                          <div
                            key={field.name}
                            className="bg-orange-50 p-3 rounded space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge>{field.name}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  ({field.type})
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={
                                  fieldMapping[field.name] === 'add'
                                    ? 'default'
                                    : 'outline'
                                }
                                onClick={() =>
                                  handleFieldMappingChange(field.name, 'add')
                                }
                              >
                                添加为新字段
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  fieldMapping[field.name] === 'ignore'
                                    ? 'default'
                                    : 'outline'
                                }
                                onClick={() =>
                                  handleFieldMappingChange(field.name, 'ignore')
                                }
                              >
                                忽略（留空）
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 提示信息 */}
                  {fieldAnalysis.missing.length === 0 &&
                    fieldAnalysis.matching.length > 0 && (
                      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                        ✨ 所有字段都匹配！可以直接复制模板。
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!targetWorkbookId}>
            复制 {selectedTemplates.length} 个模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
