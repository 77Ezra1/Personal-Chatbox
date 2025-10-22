import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Trash2,
  Edit
} from 'lucide-react';

/**
 * Row Context Menu Component
 * 行的右键菜单（插入行、删除行等）
 */
export default function RowContextMenu({
  children,
  rowData,
  isSystem,
  onInsertAbove,
  onInsertBelow,
  onEdit,
  onDelete,
  onDuplicate
}) {
  const handleInsertAbove = () => {
    if (onInsertAbove) onInsertAbove(rowData);
  };

  const handleInsertBelow = () => {
    if (onInsertBelow) onInsertBelow(rowData);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(rowData);
  };

  const handleDuplicate = () => {
    if (onDuplicate) onDuplicate(rowData);
  };

  const handleDelete = () => {
    if (!rowData?._isPlaceholder && onDelete) {
      if (confirm(`确定要删除模板"${rowData.name}"吗？`)) {
        onDelete(rowData);
      }
    }
  };

  // 系统工作簿只读
  if (isSystem) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleInsertAbove}>
          <ArrowUpToLine className="h-4 w-4 mr-2" />
          在上方插入行
        </ContextMenuItem>
        <ContextMenuItem onClick={handleInsertBelow}>
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          在下方插入行
        </ContextMenuItem>
        <ContextMenuSeparator />
        {!rowData?._isPlaceholder && (
          <>
            <ContextMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              复制
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              删除行
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
