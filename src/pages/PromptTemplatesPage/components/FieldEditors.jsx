import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * Field Editors - 字段类型专用编辑器
 * 为每种字段类型提供验证和专门的编辑界面
 */

// 单行文本编辑器
export function TextEditor({ value, onChange, placeholder = '请输入文本' }) {
  return (
    <Input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// 多行文本编辑器
export function LongTextEditor({ value, onChange, placeholder = '请输入多行文本' }) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="resize-none"
    />
  );
}

// 标签编辑器
export function TagsEditor({ value, onChange, placeholder = '按 Enter 添加标签' }) {
  const [inputValue, setInputValue] = useState('');
  const tags = Array.isArray(value) ? value : [];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAddTag}
        placeholder={placeholder}
      />
    </div>
  );
}

// 数字编辑器（仅允许数字）
export function NumberEditor({ value, onChange, placeholder = '请输入数字' }) {
  const handleChange = (e) => {
    const inputValue = e.target.value;

    // 允许空值、负号、数字和小数点
    if (inputValue === '' || inputValue === '-' || /^-?\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue === '' ? null : inputValue);
    }
  };

  const handleBlur = (e) => {
    const inputValue = e.target.value;
    if (inputValue && inputValue !== '-') {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <Input
      type="text"
      value={value !== null && value !== undefined ? String(value) : ''}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="font-mono"
    />
  );
}

// 日期时间编辑器
export function DateTimeEditor({ value, onChange, placeholder = '选择日期时间' }) {
  const [date, setDate] = useState(value ? new Date(value) : undefined);
  const [time, setTime] = useState(
    value ? format(new Date(value), 'HH:mm', { locale: zhCN }) : '12:00'
  );

  const handleDateChange = (newDate) => {
    if (!newDate) {
      setDate(undefined);
      onChange(null);
      return;
    }

    setDate(newDate);
    const [hours, minutes] = time.split(':');
    const combined = new Date(newDate);
    combined.setHours(parseInt(hours), parseInt(minutes));
    onChange(combined.toISOString());
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (date) {
      const [hours, minutes] = newTime.split(':');
      const combined = new Date(date);
      combined.setHours(parseInt(hours), parseInt(minutes));
      onChange(combined.toISOString());
    }
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP', { locale: zhCN }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {date && (
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-32"
        />
      )}
    </div>
  );
}

// 布尔值编辑器
export function BooleanEditor({ value, onChange, label = '启用' }) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value === true}
        onCheckedChange={onChange}
        id="boolean-switch"
      />
      <label
        htmlFor="boolean-switch"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {value === true ? '是' : '否'}
      </label>
    </div>
  );
}

/**
 * 获取字段编辑器组件
 */
export function getFieldEditor(fieldType) {
  switch (fieldType) {
    case 'text':
      return TextEditor;
    case 'longtext':
      return LongTextEditor;
    case 'tags':
      return TagsEditor;
    case 'number':
      return NumberEditor;
    case 'datetime':
      return DateTimeEditor;
    case 'boolean':
      return BooleanEditor;
    default:
      return TextEditor;
  }
}

/**
 * 验证字段值
 */
export function validateFieldValue(fieldType, value, required) {
  // 必填验证
  if (required) {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: '此字段为必填项' };
    }
    if (fieldType === 'tags' && (!Array.isArray(value) || value.length === 0)) {
      return { valid: false, error: '至少需要一个标签' };
    }
  }

  // 类型验证
  switch (fieldType) {
    case 'number':
      if (value !== null && value !== undefined && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { valid: false, error: '必须是有效的数字' };
        }
      }
      break;

    case 'datetime':
      if (value && isNaN(new Date(value).getTime())) {
        return { valid: false, error: '无效的日期时间格式' };
      }
      break;

    case 'boolean':
      if (value !== null && value !== undefined && typeof value !== 'boolean') {
        return { valid: false, error: '必须是布尔值' };
      }
      break;

    case 'tags':
      if (value !== null && value !== undefined && !Array.isArray(value)) {
        return { valid: false, error: '标签必须是数组格式' };
      }
      break;
  }

  return { valid: true };
}

/**
 * 格式化字段值用于显示
 */
export function formatFieldValue(fieldType, value) {
  if (value === null || value === undefined) {
    return '';
  }

  switch (fieldType) {
    case 'tags':
      return Array.isArray(value) ? value.join(', ') : '';

    case 'boolean':
      return value === true ? '是' : value === false ? '否' : '';

    case 'datetime':
      try {
        return format(new Date(value), 'yyyy-MM-dd HH:mm', { locale: zhCN });
      } catch {
        return String(value);
      }

    case 'number':
      return String(value);

    default:
      return String(value);
  }
}
