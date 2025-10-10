import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 通用确认对话框组件
 * 用于替代浏览器原生的window.confirm
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'default', // 'default' | 'danger'
  translate
}) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm?.()
    onCancel?.() // 执行确认操作后自动关闭弹窗
  }

  const handleCancel = () => {
    onCancel?.()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

  return (
    <div className="confirm-dialog-overlay" onClick={handleOverlayClick}>
      <div className="confirm-dialog">
        {/* 头部 */}
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
          <button
            className="confirm-dialog-close"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>

        {/* 底部按钮 */}
        <div className="confirm-dialog-footer">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            {cancelText || translate?.('confirms.cancelButton', 'Cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmText || translate?.('confirms.confirmButton', 'Confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}

