import { useEffect, useState, memo, useCallback } from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { CodePreview } from './CodePreview'
import { CommandPalette } from '@/components/common/CommandPalette'
import { commandManager } from '@/lib/commands'
import { shortcutManager } from '@/lib/shortcuts'

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
  const [isFullscreen, setIsFullscreen] = useState(false) // 全屏预览模式
  const [showCommandPalette, setShowCommandPalette] = useState(false) // 指令面板

  // 优化：使用 useCallback 缓存事件处理器
  const toggleExportMenu = useCallback(() => {
    if (!conversation) return
    setShowExportMenu((prev) => !prev)
  }, [conversation])

  const closeExportMenu = useCallback(() => {
    setShowExportMenu(false)
  }, [])

  // 执行指令
  const executeCommand = useCallback(async (command, parameters) => {
    console.log('[ChatContainer] Executing command:', command.name, parameters)

    try {
      // 构建指令上下文
      const context = {
        // 消息操作
        sendMessage: onSendMessage,
        messages,

        // 对话操作
        conversation,
        createNewConversation: () => {
          // TODO: 需要从父组件传入
          console.log('[Command] Create new conversation')
        },

        // 编辑操作
        regenerateLastMessage: () => {
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === 'assistant') {
              onRegenerateMessage(lastMessage.id)
            }
          }
        },
        editLastUserMessage: () => {
          if (messages && messages.length > 0) {
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                onEditMessage(messages[i].id)
                break
              }
            }
          }
        },
        undoLastExchange: () => {
          if (messages && messages.length >= 2) {
            const lastAssistant = messages[messages.length - 1]
            const lastUser = messages[messages.length - 2]
            if (lastAssistant.role === 'assistant' && lastUser.role === 'user') {
              onDeleteMessage(lastAssistant.id)
              onDeleteMessage(lastUser.id)
            }
          }
        },

        // 确认对话框
        showConfirm: onShowConfirm,

        // 翻译函数
        translate,

        // 开发模式
        setDevMode,
        devMode,

        // 参数
        parameters
      }

      // 执行指令
      const result = await commandManager.executeCommand(
        command.trigger,
        parameters,
        context
      )

      if (result.success) {
        console.log('[Command] Success:', result.message)
      } else {
        console.error('[Command] Failed:', result.message)
      }

      return result
    } catch (error) {
      console.error('[Command] Error:', error)
      return {
        success: false,
        message: `指令执行失败: ${error.message}`
      }
    }
  }, [
    onSendMessage,
    messages,
    conversation,
    onRegenerateMessage,
    onEditMessage,
    onDeleteMessage,
    onShowConfirm,
    translate,
    devMode
  ])

  useEffect(() => {
    setShowExportMenu(false)
  }, [conversation?.id])

  // 监听快捷键（使用动态快捷键系统）
  useEffect(() => {
    // 注册快捷键监听器
    const openCommandPaletteHandler = () => {
      console.log('[ChatContainer] Command palette shortcut triggered')
      setShowCommandPalette(true)
    }

    const toggleDevModeHandler = () => {
      console.log('[ChatContainer] Dev mode shortcut triggered')
      setDevMode(v => !v)
    }

    const clearConversationHandler = () => {
      console.log('[ChatContainer] Clear conversation shortcut triggered')
      if (messages && messages.length > 0) {
        if (onShowConfirm) {
          onShowConfirm({
            title: '清空对话',
            message: '确定要清空当前对话的所有消息吗？此操作无法撤销。',
            onConfirm: () => {
              // TODO: 实现清空对话功能
              console.log('[ChatContainer] Clear conversation confirmed')
            }
          })
        }
      }
    }

    // 注册监听器
    shortcutManager.registerListener('openCommandPalette', openCommandPaletteHandler)
    shortcutManager.registerListener('toggleDevMode', toggleDevModeHandler)
    shortcutManager.registerListener('clearConversation', clearConversationHandler)

    // 清理函数
    return () => {
      shortcutManager.unregisterListener('openCommandPalette', openCommandPaletteHandler)
      shortcutManager.unregisterListener('toggleDevMode', toggleDevModeHandler)
      shortcutManager.unregisterListener('clearConversation', clearConversationHandler)
    }
  }, [messages, onShowConfirm])

  // 单独的 useEffect 用于启动全局监听器（只执行一次）
  useEffect(() => {
    console.log('[ChatContainer] Checking global shortcut listener...')
    if (!shortcutManager.globalListener) {
      console.log('[ChatContainer] Starting global shortcut listener')
      shortcutManager.startGlobalListener()
    } else {
      console.log('[ChatContainer] Global shortcut listener already running')
    }
  }, []) // 空依赖数组，只在组件挂载时执行一次

  // 自动检测代码生成并切换到编程模式
  useEffect(() => {
    if (!messages || messages.length === 0) {
      // 没有消息时，关闭dev模式
      if (devMode) {
        console.log('[ChatContainer] No messages, disabling dev mode')
        setDevMode(false)
      }
      return
    }

    // 检查最近的几条消息（包括tool和assistant消息）
    const recentMessages = messages.slice(-15) // 检查最后15条消息
    let hasFileWrite = false

    console.log('[ChatContainer] Checking', recentMessages.length, 'messages for HTML file generation')

    for (const msg of recentMessages) {
      if (!msg.content) continue
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)

      console.log('[ChatContainer] Checking message:', msg.role, content.substring(0, 150) + '...')

      // 检测工具调用结果（tool消息）- 这是关键！
      if (msg.role === 'tool') {
        if (content.includes('Successfully wrote to') && content.includes('.html')) {
          console.log('[ChatContainer] ✅ Detected HTML file write in tool result:', content.substring(0, 200))
          hasFileWrite = true
          break
        }
      }

      // 检测AI消息中的文件生成描述
      if (msg.role === 'assistant') {
        if (
          /Successfully wrote to\s+[^\s]*\.html/i.test(content) ||
          /write_file.*?\.html/i.test(content) ||
          content.includes('filesystem_write_file') ||
          /创建.*?\.html.*文件/i.test(content) ||
          /生成.*?\.html.*文件/i.test(content)
        ) {
          console.log('[ChatContainer] ✅ Detected HTML file write in AI message')
          hasFileWrite = true
          break
        }
      }
    }

    console.log('[ChatContainer] hasFileWrite:', hasFileWrite, 'devMode:', devMode)

    // 只有在检测到文件写入时才自动开启编程模式
    if (hasFileWrite && !devMode) {
      console.log('[ChatContainer] Auto-enabling dev mode for file preview')
      setDevMode(true)
    }
  }, [messages, devMode])

  return (
    <main className={`chat-area ${devMode ? 'chat-area--dev' : ''} ${isFullscreen ? 'chat-area--fullscreen' : ''}`}>
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
            onCommandTrigger={() => setShowCommandPalette(true)} // 新增：/ 触发指令
            translate={translate}
          />
        </div>

        {devMode && (
          <div className="chat-split-right">
            <div className="devpanel-header">
              <span className="devpanel-title">{translate?.('labels.devPanel', '编码/预览')}</span>
              <button
                className="devpanel-fullscreen"
                onClick={() => setIsFullscreen(v => !v)}
                title={isFullscreen ? '退出全屏' : '全屏预览'}
              >
                {isFullscreen ? '退出全屏' : '全屏'}
              </button>
            </div>
            <div className="devpanel-body">
              <CodePreview messages={messages} translate={translate} />
            </div>
          </div>
        )}
      </div>

      {/* 指令面板 */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExecuteCommand={executeCommand}
      />
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

