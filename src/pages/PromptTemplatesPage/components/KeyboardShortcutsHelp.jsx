import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

/**
 * Keyboard Shortcuts Help Dialog
 * 快捷键帮助对话框
 */
export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // 检测操作系统
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: '导航',
      items: [
        { keys: [cmdKey, 'K'], description: '聚焦搜索框' },
        { keys: ['Esc'], description: '关闭弹窗' },
      ]
    },
    {
      category: '操作',
      items: [
        { keys: [cmdKey, 'N'], description: '新建模板' },
        { keys: [cmdKey, 'F'], description: '切换收藏筛选' },
      ]
    },
    {
      category: '视图',
      items: [
        { keys: ['1'], description: '表格视图' },
        { keys: ['2'], description: '卡片视图' },
        { keys: ['3'], description: '列表视图' },
        { keys: ['4'], description: '看板视图' },
      ]
    }
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="查看快捷键"
        className="text-muted-foreground"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>快捷键</DialogTitle>
            <DialogDescription>
              使用键盘快捷键提升操作效率
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-sm">{item.description}</span>
                      <div className="flex gap-1">
                        {item.keys.map((key, keyIdx) => (
                          <Badge
                            key={keyIdx}
                            variant="secondary"
                            className="font-mono text-xs px-2 py-1"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 提示：在输入框中按 Esc 可以快速关闭弹窗
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
