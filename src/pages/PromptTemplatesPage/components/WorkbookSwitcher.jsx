import { Plus, MoreVertical, Trash2, Edit3, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Workbook Switcher Component (工作簿切换器)
 * 简化版 - MVP功能
 */
export default function WorkbookSwitcher({
  workbooks,
  currentWorkbook,
  onSwitch,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate
}) {
  const handleCreate = () => {
    const name = prompt('请输入新工作簿名称：');
    if (name && name.trim()) {
      onCreate({ name: name.trim(), description: '', icon: '📊' });
    }
  };

  const handleRename = () => {
    if (!currentWorkbook) return;
    if (currentWorkbook.is_system) return; // 系统工作簿不可重命名
    const name = prompt('重命名工作簿：', currentWorkbook.name || '');
    if (name && name.trim() && name.trim() !== currentWorkbook.name) {
      onUpdate?.(currentWorkbook.id, { name: name.trim() });
    }
  };

  const handleDuplicate = () => {
    if (!currentWorkbook) return;
    onDuplicate?.(currentWorkbook.id);
  };

  const handleDelete = () => {
    if (!currentWorkbook) return;
    if (currentWorkbook.is_system) return; // 系统工作簿不可删除
    if (confirm(`确定要删除工作簿 "${currentWorkbook.name}" 吗？\n\n此操作将删除该工作簿下的所有模板，且无法恢复。`)) {
      onDelete?.(currentWorkbook.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-between">
            <span className="flex items-center gap-2">
              <span>{currentWorkbook?.icon || '📊'}</span>
              <span className="truncate">
                {currentWorkbook?.name || '选择工作簿'}
              </span>
            </span>
            <svg
              className="ml-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px]">
          {workbooks.map((workbook) => (
            <DropdownMenuItem
              key={workbook.id}
              onClick={() => onSwitch(workbook)}
              className="flex items-center gap-2"
            >
              <span>{workbook.icon}</span>
              <span className="flex-1 truncate">{workbook.name}</span>
              {workbook.is_system && (
                <span className="text-xs text-muted-foreground">系统</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="icon" onClick={handleCreate}>
        <Plus className="h-4 w-4" />
      </Button>

      {/* 管理当前工作簿的操作菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="管理工作簿">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={handleDuplicate} disabled={!currentWorkbook}>
            <Copy className="mr-2 h-4 w-4" /> 复制工作簿
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename} disabled={!currentWorkbook || currentWorkbook?.is_system}>
            <Edit3 className="mr-2 h-4 w-4" /> 重命名
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={!currentWorkbook || currentWorkbook?.is_system}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 删除工作簿
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
