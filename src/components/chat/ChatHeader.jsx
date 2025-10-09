/**
 * 聊天区域头部组件
 * 显示对话标题和操作按钮
 */
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportMenu } from './ExportMenu'

export function ChatHeader({
  title,
  conversation,
  translate,
  showExportMenu,
  onToggleExportMenu,
  onCloseExportMenu
}) {
  return (
    <header className="chat-header">
      <div className="chat-header-slot" aria-hidden />
      <h1 className="chat-title">{title}</h1>
      <div className="chat-header-actions">
        <div className="chat-export-container">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExportMenu}
            title={translate?.('tooltips.exportConversation', 'Export conversation')}
            disabled={!conversation}
          >
            <Download className="w-4 h-4" />
          </Button>
          {showExportMenu && conversation ? (
            <div className="chat-header-export-menu">
              <ExportMenu
                conversation={conversation}
                translate={translate}
                onClose={onCloseExportMenu}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

