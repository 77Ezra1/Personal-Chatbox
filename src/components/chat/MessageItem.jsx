import { useState } from 'react'
import { Copy, Edit, Trash2, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { formatFileSize } from '@/lib/utils'

/**
 * 单条消息组件
 * 显示消息内容、附件和操作按钮
 */
export function MessageItem({ message, translate, onCopy, onEdit, onDelete, onRegenerate }) {
  const { role, content, metadata, attachments, status, edited } = message
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      onCopy?.()
    } catch (error) {
      console.error('Failed to copy message:', error)
      // Fallback: 创建临时文本区域
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        onCopy?.()
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(content)
  }

  const handleDelete = () => {
    if (confirm(translate('confirms.deleteMessage', 'Are you sure you want to delete this message?'))) {
      onDelete?.(message.id)
    }
  }

  const handleRegenerate = () => {
    onRegenerate?.(message.id)
  }

  return (
    <div className={`message message-${role}`}>
      {/* 消息内容 */}
      <div className={`message-content message-content-${role}`}>
        {/* 附件列表 */}
        {attachments && attachments.length > 0 && (
          <div className="message-attachments">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="message-attachment">
                {attachment.category === 'image' ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="attachment-image"
                  />
                ) : (
                  <div className="attachment-file">
                    <span className="attachment-name">{attachment.name}</span>
                    <span className="attachment-size">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 消息文本 */}
        {content && !isEditing && (
          <div className="message-text">
            <MarkdownRenderer content={content} />
            {edited && (
              <span className="message-edited">
                {translate('labels.edited', '(edited)')}
              </span>
            )}
          </div>
        )}

        {/* 编辑模式 */}
        {isEditing && (
          <div className="message-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="message-edit-textarea"
              rows={5}
              autoFocus
            />
            <div className="message-edit-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveEdit}
                title={translate('tooltips.save', 'Save')}
              >
                <Check className="w-4 h-4" />
                {translate('actions.save', 'Save')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                title={translate('tooltips.cancel', 'Cancel')}
              >
                <X className="w-4 h-4" />
                {translate('actions.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* 思考过程 */}
        {metadata?.reasoning && (
          <details className="reasoning-block">
            <summary>{translate('sections.reasoning', 'Reasoning')}</summary>
            <div className="reasoning-content">
              <MarkdownRenderer content={metadata.reasoning} />
            </div>
          </details>
        )}

        {/* 加载状态 */}
        {status === 'loading' && !content && (
          <div className="message-loading">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && (
          <div className="message-error">
            {translate('toasts.failedToGenerate', 'Failed to generate response.')}
          </div>
        )}

        {/* 操作按钮 */}
        {content && status === 'done' && !isEditing && (
          <div className="message-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              title={translate('tooltips.copyMessage', 'Copy message')}
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            {role === 'user' && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                title={translate('tooltips.editMessage', 'Edit message')}
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
            
            {role === 'assistant' && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                title={translate('tooltips.regenerate', 'Regenerate response')}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                title={translate('tooltips.deleteMessage', 'Delete message')}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

