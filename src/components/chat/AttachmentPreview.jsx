import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'

/**
 * 附件预览组件
 * 显示待发送的附件
 */
export function AttachmentPreview({ attachment, onRemove }) {
  return (
    <div className="attachment-preview">
      {attachment.category === 'image' ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="attachment-preview-image"
        />
      ) : (
        <div className="attachment-preview-file">
          <span className="attachment-preview-name">{attachment.name}</span>
          <span className="attachment-preview-size">
            {formatFileSize(attachment.size)}
          </span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="attachment-preview-remove"
        onClick={onRemove}
        aria-label="Remove attachment"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  )
}

