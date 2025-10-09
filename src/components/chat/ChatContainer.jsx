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
  language,
  theme,
  onSendMessage,
  onStopGeneration,
  onAddAttachment,
  onRemoveAttachment,
  onToggleDeepThinking,
  onToggleLanguage,
  onToggleTheme,
  onOpenSettings,
  onClearConversation,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  translate
}) {
  return (
    <main className="chat-container">
      {/* 头部 */}
      <ChatHeader
        title={conversation?.title || translate('buttons.newConversation', 'New conversation')}
        language={language}
        theme={theme}
        conversation={conversation}
        onClear={onClearConversation}
        onToggleLanguage={onToggleLanguage}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
        translate={translate}
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

