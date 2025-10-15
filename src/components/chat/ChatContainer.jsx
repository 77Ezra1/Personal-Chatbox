import { useEffect, useState, memo, useCallback } from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

/**
 * 聊天容器组件
 * 组合聊天相关的所有子组件
 *
 * 优化：使用 memo 避免不必要的重渲染
 */
export const ChatContainer = memo(function ChatContainer({
  conversation,
  messages,
  isGenerating,
  pendingAttachments,
  isDeepThinking,
  isDeepThinkingAvailable,
  isButtonDisabled,      // 新增
  thinkingMode,          // 新增
  onSendMessage,
  onStopGeneration,
  onAddAttachment,
  onRemoveAttachment,
  onToggleDeepThinking,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  onShowConfirm,
  translate
}) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false) // 预览默认收起

  // 优化：使用 useCallback 缓存事件处理器
  const toggleExportMenu = useCallback(() => {
    if (!conversation) return
    setShowExportMenu((prev) => !prev)
  }, [conversation])

  const closeExportMenu = useCallback(() => {
    setShowExportMenu(false)
  }, [])

  useEffect(() => {
    setShowExportMenu(false)
  }, [conversation?.id])

  return (
    <main className={`chat-area ${devMode ? 'chat-area--dev' : ''}`}>
      {/* 头部 */}
      <ChatHeader
        title={conversation?.title || translate('buttons.newConversation', 'New conversation')}
        conversation={conversation}
        translate={translate}
        showExportMenu={showExportMenu}
        onToggleExportMenu={toggleExportMenu}
        onCloseExportMenu={closeExportMenu}
        onToggleDevMode={() => setDevMode(v => !v)}
        isDevMode={devMode}
      />

      <div className="chat-split">
        <div className="chat-split-left">
          {/* 消息列表 */}
          <MessageList
            messages={messages}
            translate={translate}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onRegenerate={onRegenerateMessage}
            onShowConfirm={onShowConfirm}
          />

          {/* 输入区域 */}
          <MessageInput
            isGenerating={isGenerating}
            pendingAttachments={pendingAttachments}
            isDeepThinking={isDeepThinking}
            isDeepThinkingAvailable={isDeepThinkingAvailable}
            isButtonDisabled={isButtonDisabled}      // 新增
            thinkingMode={thinkingMode}              // 新增
            onSend={onSendMessage}
            onStop={onStopGeneration}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            onToggleDeepThinking={onToggleDeepThinking}
            translate={translate}
          />
        </div>

        {devMode && (
          <div className={`chat-split-right ${showPreview ? 'open' : 'collapsed'}`}>
            <div className="devpanel-header">
              <span className="devpanel-title">{translate?.('labels.devPanel', '编码/预览')}</span>
              <button
                className="devpanel-toggle"
                onClick={() => setShowPreview(v => !v)}
                title={showPreview ? (translate?.('labels.collapse', '收起') || '收起') : (translate?.('labels.expand', '展开') || '展开')}
              >
                {showPreview ? (translate?.('labels.collapse', '收起') || '收起') : (translate?.('labels.expand', '展开') || '展开')}
              </button>
            </div>
            {showPreview && (
              <div className="devpanel-body">
                {/* 这里后续可接入实时预览（如 /preview 路由或 iframe 指向本地构建/预览） */}
                <div className="devpanel-placeholder">
                  {translate?.('labels.previewPlaceholder', '预览已开启，等待模型生成/应用变更...')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数 - 只在这些属性变化时才重新渲染
  return (
    prevProps.conversation?.id === nextProps.conversation?.id &&
    prevProps.conversation?.title === nextProps.conversation?.title &&
    prevProps.messages === nextProps.messages &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.isDeepThinking === nextProps.isDeepThinking &&
    prevProps.isButtonDisabled === nextProps.isButtonDisabled &&
    prevProps.pendingAttachments === nextProps.pendingAttachments
  )
})

