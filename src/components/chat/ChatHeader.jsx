/**
 * 聊天区域头部组件
 * 显示对话标题和操作按钮
 */
import { Download, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportMenu } from './ExportMenu'

export function ChatHeader({
  title,
  conversation,
  translate,
  showExportMenu,
  onToggleExportMenu,
  onCloseExportMenu,
  onToggleDevMode,
  isDevMode
}) {
  return (
    <header className="chat-header">
      <div className="chat-header-slot" aria-hidden />
      <h1 className="chat-title">{title}</h1>
      <div className="chat-header-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDevMode}
          title={translate?.('tooltips.toggleDevMode', 'Toggle Dev Mode')}
        >
          <Code2 className="w-4 h-4 mr-2" />
          {isDevMode ? (translate?.('labels.devModeOn', '编程模式') || '编程模式') : (translate?.('labels.devModeOff', '普通模式') || '普通模式')}
        </Button>
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

