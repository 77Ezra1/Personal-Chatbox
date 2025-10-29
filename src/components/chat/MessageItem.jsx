import { useState } from 'react'
import { Copy, Edit, Trash2, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { ThinkingProcess } from './ThinkingProcess'
import { TypingIndicator } from './TypingIndicator'
import { formatFileSize } from '@/lib/utils'

import { createLogger } from '../../lib/logger'
const logger = createLogger('MessageItem')


/**
 * 单条消息组件
 * 显示消息内容、附件和操作按钮
 */
export function MessageItem({ message, translate, onCopy, onEdit, onDelete, onRegenerate, onShowConfirm }) {
  const { role, content, metadata, attachments, status, edited } = message
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  const isUser = role === 'user'
  const canCopyMessage = typeof content === 'string' && content.trim().length > 0
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      onCopy?.()
    } catch (error) {
      logger.error('Failed to copy message:', error)
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
        logger.error('Fallback copy also failed:', fallbackError)
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
    onShowConfirm?.({
      title: translate('confirms.deleteMessageTitle', 'Delete Message'),
      message: translate('confirms.deleteMessage', 'Are you sure you want to delete this message?'),
      variant: 'danger',
      onConfirm: () => onDelete?.(message.id)
    })
  }

  const handleRegenerate = () => {
    onRegenerate?.(message.id)
  }

  const hasFooterActions =
    status === 'done' &&
    !isEditing &&
    (canCopyMessage || (isUser && onEdit) || (!isUser && onRegenerate) || onDelete)

  const shouldShowFooter = hasFooterActions

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
      <div className="message-body">
        <div
          className={`message-content ${
            isUser ? 'message-content-user' : 'message-content-ai'
          } ${status === 'error' ? 'message-error' : ''}`}
        >
          {/* 思考过程组件 - 使用增强版 */}
          {!isEditing && metadata?.deepThinking && (metadata?.reasoning || status === 'loading') && (
            <ThinkingProcess 
              reasoning={metadata.reasoning}
              isStreaming={status === 'loading'}
              translate={translate}
            />
          )}

          {/* 消息内容 - 正常显示 */}
          {!isEditing && (
            <>
              {/* 如果正在加载且没有内容，显示动态思考指示器 */}
              {status === 'loading' && !content && !isUser && (
                <TypingIndicator type="simple" message={translate('status.thinking', '正在思考')} />
              )}

              {/* 正常内容渲染 */}
              {(content || status !== 'loading') && (
                <MarkdownRenderer
                  content={content || ''}
                  isStreaming={status === 'loading'}
                />
              )}

              {edited && (
                <span className="message-edited">
                  {translate('labels.edited', '(edited)')}
                </span>
              )}
            </>
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

          {/* 附件列表 */}
          {hasAttachments && (
            <div className="message-attachments">
              {attachments.map((attachment) => {
                const isImageAttachment = attachment.category === 'image' && attachment.dataUrl
                return (
                  <div
                    key={attachment.id}
                    className={`attachment-item${isImageAttachment ? ' attachment-item-image' : ''}`}
                  >
                    <div className="attachment-preview">
                      {isImageAttachment ? (
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name || translate('buttons.addImage', 'Add image')}
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
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {shouldShowFooter && (
          <div
            className={`message-footer ${
              isUser ? 'message-footer-user' : 'message-footer-ai'
            }`}
          >
            {hasFooterActions && (
              <div className="message-actions">
                {canCopyMessage && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    title={translate('tooltips.copyMessage', 'Copy message')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
                {isUser && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    title={translate('tooltips.editMessage', 'Edit message')}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}

                {!isUser && onRegenerate && (
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
        )}
      </div>
    </div>
  )
}

