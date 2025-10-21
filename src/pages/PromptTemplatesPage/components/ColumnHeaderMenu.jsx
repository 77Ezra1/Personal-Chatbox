import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  ArrowLeftToLine,
  ArrowRightToLine,
  Pencil,
  Trash2,
  EyeOff
} from 'lucide-react';

/**
 * Column Header Menu Component
 * 列头的下拉菜单（用于自定义字段的操作）
 */
export default function ColumnHeaderMenu({
  fieldName,
  fieldType,
  workbook,
  onInsertLeft,
  onInsertRight,
  onRename,
  onDelete,
  onHide
}) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleRename = () => {
    setNewName(fieldName);
    setShowRenameDialog(true);
    setOpen(false);
  };

  const handleConfirmRename = () => {
    if (!newName.trim() || newName === fieldName) {
      setShowRenameDialog(false);
      return;
    }
    onRename(fieldName, newName.trim());
    setShowRenameDialog(false);
  };

  const handleDelete = () => {
    setOpen(false);
    if (confirm(`确定要删除字段 "${fieldName}" 吗？\n\n此操作将：\n1. 删除所有记录中该字段的数据\n2. 无法撤销`)) {
      onDelete(fieldName);
    }
  };

  const handleInsertLeft = () => {
    setOpen(false);
    onInsertLeft(fieldName);
  };

  const handleInsertRight = () => {
    setOpen(false);
    onInsertRight(fieldName);
  };

  const handleHide = () => {
    setOpen(false);
    onHide(fieldName);
  };

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <span className="flex-1">{fieldName}</span>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-accent ml-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleInsertLeft}>
              <ArrowLeftToLine className="h-4 w-4 mr-2" />
              在左侧插入列
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInsertRight}>
              <ArrowRightToLine className="h-4 w-4 mr-2" />
              在右侧插入列
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename}>
              <Pencil className="h-4 w-4 mr-2" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHide}>
              <EyeOff className="h-4 w-4 mr-2" />
              隐藏列
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              删除字段
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 重命名对话框 */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>重命名字段</DialogTitle>
            <DialogDescription>
              为字段 "{fieldName}" 设置新名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">新名称</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="请输入新名称"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmRename}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
