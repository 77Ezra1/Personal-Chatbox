import { Download, Copy, FileText, FileJson } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { exportConversation, copyConversation } from '@/lib/export'

/**
 * 导出菜单组件
 * 提供多种导出格式选项
 */
export function ExportMenu({ conversation, translate, onClose }) {
  const [copying, setCopying] = useState(false)

  const handleExport = (format) => {
    try {
      exportConversation(conversation, format)
      toast.success(translate?.('toasts.exportSuccess', 'Conversation exported successfully.'))
      if (onClose) onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(translate?.('toasts.exportFailed', 'Failed to export conversation.'))
    }
  }

  const handleCopy = async (format) => {
    setCopying(true)
    try {
      const success = await copyConversation(conversation, format)
      if (success) {
        toast.success(translate?.('toasts.messageCopied', 'Message copied to clipboard.'))
      } else {
        toast.error(translate?.('toasts.failedToCopy', 'Failed to copy message.'))
      }
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error(translate?.('toasts.failedToCopy', 'Failed to copy message.'))
    } finally {
      setCopying(false)
      if (onClose) onClose()
    }
  }

  return (
    <div className="export-menu">
      <div className="export-menu-header">
        <h3>导出对话</h3>
      </div>

      <div className="export-menu-section">
        <h4>下载文件</h4>
        <div className="export-menu-options">
          <button
            className="export-menu-option"
            onClick={() => handleExport('markdown')}
          >
            <FileText size={18} />
            <span>Markdown (.md)</span>
          </button>

          <button
            className="export-menu-option"
            onClick={() => handleExport('text')}
          >
            <FileText size={18} />
            <span>纯文本 (.txt)</span>
          </button>

          <button
            className="export-menu-option"
            onClick={() => handleExport('json')}
          >
            <FileJson size={18} />
            <span>JSON (.json)</span>
          </button>
        </div>
      </div>

      <div className="export-menu-section">
        <h4>复制到剪贴板</h4>
        <div className="export-menu-options">
          <button
            className="export-menu-option"
            onClick={() => handleCopy('markdown')}
            disabled={copying}
          >
            <Copy size={18} />
            <span>{copying ? '复制中...' : 'Markdown 格式'}</span>
          </button>

          <button
            className="export-menu-option"
            onClick={() => handleCopy('text')}
            disabled={copying}
          >
            <Copy size={18} />
            <span>{copying ? '复制中...' : '纯文本格式'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

