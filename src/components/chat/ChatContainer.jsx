import { useEffect, useState } from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

/**
 * 聊天容器组件
 * 组合聊天相关的所有子组件
 */
export function ChatContainer({
  conversation,
  messages,
  isGenerating,
  pendingAttachments,
  isDeepThinking,
  isDeepThinkingAvailable,
  onSendMessage,
  onStopGeneration,
  onAddAttachment,
  onRemoveAttachment,
  onToggleDeepThinking,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  translate
}) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  const toggleExportMenu = () => {
    if (!conversation) return
    setShowExportMenu((prev) => !prev)
  }

  const closeExportMenu = () => {
    setShowExportMenu(false)
  }

  useEffect(() => {
    setShowExportMenu(false)
  }, [conversation?.id])

  return (
    <main className="chat-area">
      {/* 头部 */}
      <ChatHeader
        title={conversation?.title || translate('buttons.newConversation', 'New conversation')}
        conversation={conversation}
        translate={translate}
        showExportMenu={showExportMenu}
        onToggleExportMenu={toggleExportMenu}
        onCloseExportMenu={closeExportMenu}
      />

      {/* 消息列表 */}
      <MessageList
        messages={messages}
        translate={translate}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        onRegenerate={onRegenerateMessage}
      />

      {/* 输入区域 */}
      <MessageInput
        isGenerating={isGenerating}
        pendingAttachments={pendingAttachments}
        isDeepThinking={isDeepThinking}
        isDeepThinkingAvailable={isDeepThinkingAvailable}
        onSend={onSendMessage}
        onStop={onStopGeneration}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        onToggleDeepThinking={onToggleDeepThinking}
        translate={translate}
      />
    </main>
  )
}

