import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { formatFileSize } from '@/lib/utils'

/**
 * 单条消息组件
 * 显示消息内容、附件和操作按钮
 */
export function MessageItem({ message, translate, onCopy }) {
  const { role, content, metadata, attachments, status } = message

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
      .then(() => onCopy?.())
      .catch(() => {})
  }

  return (
    <div className={`message-item ${role}`}>
      {/* 消息头像 */}
      <div className="message-avatar">
        {role === 'user' 
          ? translate('labels.user', 'You')
          : translate('labels.assistant', 'Assistant')
        }
      </div>

      {/* 消息内容 */}
      <div className="message-content">
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
        {content && (
          <div className="message-text">
            <MarkdownRenderer content={content} />
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
        {role === 'assistant' && content && status === 'done' && (
          <div className="message-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              title={translate('tooltips.copyMessage', 'Copy message')}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

