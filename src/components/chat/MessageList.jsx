import { useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageItem } from './MessageItem'

/**
 * 消息列表组件
 * 显示所有消息并自动滚动到底部
 */
export function MessageList({ messages, translate }) {
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

  return (
    <div ref={listRef} className="message-list">
      {messages.length === 0 ? (
        <div className="message-list-empty">
          <p>{translate('placeholders.messageInput', 'Type a message...')}</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            translate={translate}
            onCopy={handleCopy}
          />
        ))
      )}
    </div>
  )
}

