import { useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageItem } from './MessageItem'

/**
 * 消息列表组件
 * 显示所有消息并自动滚动到底部
 */
export function MessageList({ messages, translate, onEdit, onDelete, onRegenerate, onShowConfirm }) {
  const listRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleCopy = () => {
    toast.success(translate('toasts.messageCopied', 'Message copied to clipboard.'))
  }

  const handleEdit = (messageId, newContent) => {
    onEdit?.(messageId, newContent)
    toast.success(translate('toasts.messageEdited', 'Message edited successfully.'))
  }

  const handleDelete = (messageId) => {
    onDelete?.(messageId)
    toast.success(translate('toasts.messageDeleted', 'Message deleted successfully.'))
  }

  const handleRegenerate = (messageId) => {
    onRegenerate?.(messageId)
  }

  return (
    <div ref={listRef} className="messages-container">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="welcome-message">
            <h2>你好，我是Personal Chatbox</h2>
            <p>希望与你聊的开心...</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            translate={translate}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRegenerate={handleRegenerate}
            onShowConfirm={onShowConfirm}
          />
        ))
      )}
    </div>
  )
}

