import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

/**
 * Add Field Modal Component
 * 添加自定义字段的弹窗
 */
export default function AddFieldModal({ open, onOpenChange, onConfirm, workbook }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [isEditable, setIsEditable] = useState(true);

  // 字段类型选项
  const fieldTypes = [
    { value: 'text', label: '单行文本', icon: '📝', description: '简短的文本内容' },
    { value: 'longtext', label: '多行文本', icon: '📄', description: '较长的文本内容' },
    { value: 'tags', label: '标签', icon: '🏷️', description: '多个标签值' },
    { value: 'number', label: '数字', icon: '🔢', description: '仅支持数字' },
    { value: 'datetime', label: '日期时间', icon: '📅', description: '日期和时间' },
    { value: 'boolean', label: '布尔值', icon: '✓', description: '是/否 或 真/假' },
  ];

  const handleConfirm = () => {
    if (!fieldName.trim()) {
      toast.error('请输入字段名称');
      return;
    }

    // 检查字段名是否已存在
    const existingSchema = workbook.field_schema?.fields || [];
    if (existingSchema.some(f => f.name === fieldName.trim())) {
      toast.error('字段名称已存在');
      return;
    }

    // 检查字段数量限制（最多50个）
    if (existingSchema.length >= 50) {
      toast.error('已达到最大字段数量限制（50个）');
      return;
    }

    const newField = {
      name: fieldName.trim(),
      type: fieldType,
      required: isRequired,
      editable: isEditable,
    };

    onConfirm(newField);
    handleReset();
  };

  const handleReset = () => {
    setFieldName('');
    setFieldType('text');
    setIsRequired(false);
    setIsEditable(true);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加自定义字段</DialogTitle>
          <DialogDescription>
            为工作簿添加新的字段列。最多可添加 50 个自定义字段。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 字段名称 */}
          <div className="grid gap-2">
            <Label htmlFor="field-name">字段名称 *</Label>
            <Input
              id="field-name"
              placeholder="例如：优先级、状态、描述等"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            />
          </div>

          {/* 字段类型 */}
          <div className="grid gap-2">
            <Label htmlFor="field-type">字段类型 *</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger id="field-type">
                <SelectValue placeholder="选择字段类型" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 字段选项 */}
          <div className="grid gap-3 pt-2 border-t">
            {/* 必填选项 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required">必填字段</Label>
                <p className="text-xs text-muted-foreground">
                  创建新记录时必须填写此字段
                </p>
              </div>
              <Switch
                id="required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            {/* 可编辑选项 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="editable">允许编辑</Label>
                <p className="text-xs text-muted-foreground">
                  创建后是否允许修改此字段的值
                </p>
              </div>
              <Switch
                id="editable"
                checked={isEditable}
                onCheckedChange={setIsEditable}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            添加字段
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
