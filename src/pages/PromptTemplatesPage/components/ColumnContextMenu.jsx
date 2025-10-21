import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  ArrowLeftToLine,
  ArrowRightToLine,
  Pencil,
  Trash2,
  EyeOff,
  Pin,
  PinOff
} from 'lucide-react';

/**
 * Column Context Menu Component
 * 列的右键菜单（插入、删除、重命名、隐藏、固定）
 */
export default function ColumnContextMenu({
  children,
  field,
  workbook,
  onInsertLeft,
  onInsertRight,
  onRename,
  onDelete,
  onToggleVisibility,
  onTogglePin
}) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState('');

  // 是否可以删除（内置字段不能删除）
  const isBuiltIn = ['id', 'name', 'content', 'created_at'].includes(field);
  const isSystemWorkbook = workbook?.is_system;

  const handleRename = () => {
    setNewName(field);
    setShowRenameDialog(true);
  };

  const handleConfirmRename = () => {
    if (!newName.trim() || newName === field) {
      setShowRenameDialog(false);
      return;
    }
    onRename(field, newName.trim());
    setShowRenameDialog(false);
  };

  const handleDelete = () => {
    if (confirm(`确定要删除字段 "${field}" 吗？此操作将删除所有记录中该字段的数据。`)) {
      onDelete(field);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {/* 插入列 */}
          {!isSystemWorkbook && (
            <>
              <ContextMenuItem onClick={() => onInsertLeft(field)}>
                <ArrowLeftToLine className="h-4 w-4 mr-2" />
                在左侧插入列
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onInsertRight(field)}>
                <ArrowRightToLine className="h-4 w-4 mr-2" />
                在右侧插入列
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {/* 重命名 */}
          {!isBuiltIn && !isSystemWorkbook && (
            <ContextMenuItem onClick={handleRename}>
              <Pencil className="h-4 w-4 mr-2" />
              重命名
            </ContextMenuItem>
          )}

          {/* 删除 */}
          {!isBuiltIn && !isSystemWorkbook && (
            <ContextMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              删除字段
            </ContextMenuItem>
          )}

          {!isBuiltIn && !isSystemWorkbook && <ContextMenuSeparator />}

          {/* 隐藏/显示 */}
          <ContextMenuItem onClick={() => onToggleVisibility(field)}>
            <EyeOff className="h-4 w-4 mr-2" />
            隐藏列
          </ContextMenuItem>

          {/* 固定/取消固定 */}
          <ContextMenuItem onClick={() => onTogglePin(field)}>
            <Pin className="h-4 w-4 mr-2" />
            固定到左侧
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onTogglePin(field, 'right')}>
            <PinOff className="h-4 w-4 mr-2" />
            固定到右侧
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 重命名对话框 */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>重命名字段</DialogTitle>
            <DialogDescription>
              为字段 "{field}" 设置新名称
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
