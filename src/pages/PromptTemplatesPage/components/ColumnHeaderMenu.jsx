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
  EyeOff,
} from 'lucide-react';

/**
 * Column header dropdown menu for field operations.
 */
export default function ColumnHeaderMenu({
  fieldName,
  fieldType,
  workbook,
  onInsertLeft,
  onInsertRight,
  onRename,
  onDelete,
  onHide,
  isBuiltIn = false,
}) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleRename = () => {
    if (isBuiltIn || !onRename) {
      return;
    }
    setNewName(fieldName);
    setShowRenameDialog(true);
    setOpen(false);
  };

  const handleConfirmRename = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === fieldName) {
      setShowRenameDialog(false);
      return;
    }
    onRename?.(fieldName, trimmed);
    setShowRenameDialog(false);
  };

  const handleDelete = () => {
    if (isBuiltIn || !onDelete) {
      return;
    }
    setOpen(false);
    const message = `\u786e\u5b9a\u8981\u5220\u9664\u5b57\u6bb5 \u201c${fieldName}\u201d \u5417\uff1f\n\n\u6b64\u64cd\u4f5c\u5c06\u5220\u9664\u6240\u6709\u8bb0\u5f55\u4e2d\u8be5\u5b57\u6bb5\u7684\u6570\u636e\uff0c\u4e14\u65e0\u6cd5\u64a4\u9500\u3002`;
    if (window.confirm(message)) {
      onDelete(fieldName);
    }
  };

  const handleInsertLeft = () => {
    setOpen(false);
    onInsertLeft?.(fieldName);
  };

  const handleInsertRight = () => {
    setOpen(false);
    onInsertRight?.(fieldName);
  };

  const handleHide = () => {
    setOpen(false);
    onHide?.(fieldName);
  };

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <span className="flex-1">{fieldName}</span>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-accent ml-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleInsertLeft}>
              <ArrowLeftToLine className="h-4 w-4 mr-2" />
              {'\u5728\u5de6\u4fa7\u63d2\u5165\u5217'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInsertRight}>
              <ArrowRightToLine className="h-4 w-4 mr-2" />
              {'\u5728\u53f3\u4fa7\u63d2\u5165\u5217'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename} disabled={isBuiltIn || !onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              {'\u91cd\u547d\u540d'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHide} disabled={!onHide}>
              <EyeOff className="h-4 w-4 mr-2" />
              {'\u9690\u85cf\u5217'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
              disabled={isBuiltIn || !onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {'\u5220\u9664\u5b57\u6bb5'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{'\u91cd\u547d\u540d\u5b57\u6bb5'}</DialogTitle>
            <DialogDescription>
              {'\u4e3a\u5b57\u6bb5 \u201c'}{fieldName}{'\u201d \u8bbe\u7f6e\u65b0\u540d\u79f0'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">{'\u65b0\u540d\u79f0'}</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={'\u8bf7\u8f93\u5165\u65b0\u540d\u79f0'}
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
              {'\u53d6\u6d88'}
            </Button>
            <Button onClick={handleConfirmRename}>{'\u786e\u5b9a'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
