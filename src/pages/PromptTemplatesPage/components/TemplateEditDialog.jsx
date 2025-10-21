import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  getFieldEditor,
  validateFieldValue,
} from './FieldEditors';

/**
 * Template Edit Dialog
 * 模板编辑对话框 - 支持动态字段编辑
 */
export default function TemplateEditDialog({
  open,
  onOpenChange,
  onConfirm,
  template,
  workbook,
  mode = 'edit' // 'edit' | 'create'
}) {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    fields_data: {}
  });
  const [errors, setErrors] = useState({});

  // 初始化表单数据
  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name || '',
        content: template.content || '',
        fields_data: template.fields_data || {}
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        content: '',
        fields_data: {}
      });
    }
    setErrors({});
  }, [template, mode, open]);

  // 获取自定义字段schema
  const customFields = workbook?.field_schema?.fields || [];

  // 处理基础字段变化
  const handleBaseFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // 处理自定义字段变化
  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      fields_data: {
        ...prev.fields_data,
        [fieldName]: value
      }
    }));
    setErrors(prev => ({ ...prev, [fieldName]: undefined }));
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    // 验证名称（必填）
    if (!formData.name.trim()) {
      newErrors.name = '模板名称不能为空';
    }

    // 验证内容（必填）
    if (!formData.content.trim()) {
      newErrors.content = '模板内容不能为空';
    }

    // 验证自定义字段
    customFields.forEach(field => {
      const value = formData.fields_data[field.name];
      const validation = validateFieldValue(field.type, value, field.required);
      if (!validation.valid) {
        newErrors[field.name] = validation.error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onConfirm(formData);
    handleClose();
  };

  // 关闭对话框
  const handleClose = () => {
    setFormData({ name: '', content: '', fields_data: {} });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '创建新模板' : '编辑模板'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写模板信息和自定义字段'
              : '修改模板信息和自定义字段'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            {/* 基础字段 */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="required">
                  模板名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleBaseFieldChange('name', e.target.value)}
                  placeholder="为模板起一个名字"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content" className="required">
                  模板内容
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleBaseFieldChange('content', e.target.value)}
                  placeholder="输入 Prompt 模板内容..."
                  rows={6}
                  className={errors.content ? 'border-destructive' : ''}
                />
                {errors.content && (
                  <p className="text-xs text-destructive">{errors.content}</p>
                )}
              </div>
            </div>

            {/* 自定义字段 */}
            {customFields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">自定义字段</h4>

                  {customFields.map((field) => {
                    const FieldEditor = getFieldEditor(field.type);
                    const value = formData.fields_data[field.name];

                    return (
                      <div key={field.name} className="grid gap-2">
                        <Label
                          htmlFor={field.name}
                          className={field.required ? 'required' : ''}
                        >
                          {field.name}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <FieldEditor
                          value={value}
                          onChange={(newValue) =>
                            handleCustomFieldChange(field.name, newValue)
                          }
                          placeholder={`请输入${field.name}`}
                        />
                        {errors[field.name] && (
                          <p className="text-xs text-destructive">
                            {errors[field.name]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
