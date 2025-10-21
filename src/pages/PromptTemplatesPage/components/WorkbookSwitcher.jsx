import { Plus } from 'lucide-react';
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
  onCreate
}) {
  const handleCreate = () => {
    const name = prompt('请输入新工作簿名称：');
    if (name && name.trim()) {
      onCreate({ name: name.trim(), description: '', icon: '📊' });
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
    </div>
  );
}
