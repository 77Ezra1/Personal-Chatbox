import { useState, useRef, useCallback } from 'react'
import { Toaster, toast } from 'sonner'

// Hooks
import { useConversations, conversationUtils } from '@/hooks/useConversations'
import { useTranslation } from '@/hooks/useTranslation'
import { useTheme } from '@/hooks/useTheme'
import { useModelConfig } from '@/hooks/useModelConfig'
import { useDeepThinking } from '@/hooks/useDeepThinking'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

// Components
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { ConfigPanel } from '@/components/config/ConfigPanel'
import { ShortcutsDialog } from '@/components/common/ShortcutsDialog'

// Utils
import { generateAIResponse, extractReasoningSegments } from '@/lib/aiClient'
import { readFileAsDataUrl, createAttachmentId } from '@/lib/utils'

import './App.css'

function App() {
  // ==================== Hooks ====================
  
  // 对话管理
  const {
    conversations,
    currentConversation,
    currentConversationId,
    selectConversation,
    addConversation,
    clearAllConversations,
    appendMessage,
    updateMessage,
    renameConversation,
    removeConversation,
    replaceConversationMessages,
    deleteMessage,
    editMessage
  } = useConversations()

  // 国际化
  const { language, toggleLanguage, translate } = useTranslation()

  // 主题
  const { theme, toggleTheme } = useTheme()

  // 模型配置
  const {
    modelConfig,
    currentProvider,
    currentModel,
    currentProviderModels,
    setProvider,
    setModel,
    updateConfig
  } = useModelConfig()

  // 深度思考
  const {
    isDeepThinking,
    isDeepThinkingAvailable,
    toggleDeepThinking
  } = useDeepThinking(modelConfig)

  // ==================== 本地状态 ====================
  
  const [showConfig, setShowConfig] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const abortControllerRef = useRef(null)

  // ==================== 附件处理 ====================
  
  const handleAddAttachment = useCallback(async (file) => {
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const attachment = {
        id: createAttachmentId(),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        category: file.type.startsWith('image/') ? 'image' : 'file'
      }
      setPendingAttachments(prev => [...prev, attachment])
    } catch {
      toast.error(translate('toasts.attachmentReadFailed'))
    }
  }, [translate])

  const handleRemoveAttachment = useCallback((id) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id))
  }, [])

  // ==================== 消息处理 ====================
  
  const handleSendMessage = useCallback(async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return
    if (isGenerating) return

    // 添加用户消息
    const userMessage = conversationUtils.createMessage({
      role: 'user',
      content,
      attachments
    })
    appendMessage(currentConversationId, userMessage)

    // 清空输入
    setPendingAttachments([])

    // 创建占位符消息
    const placeholderMessage = conversationUtils.createMessage({
      role: 'assistant',
      content: '',
      status: 'loading'
    })
    appendMessage(currentConversationId, placeholderMessage)

    // 生成 AI 响应
    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    try {
      const messages = [
        ...(currentConversation?.messages || []),
        userMessage
      ]

      let accumulatedContent = ''

      const response = await generateAIResponse({
        messages,
        modelConfig: { ...modelConfig, deepThinking: isDeepThinking },
        signal: abortControllerRef.current.signal,
        onToken: (token, fullText) => {
          if (typeof fullText === 'string') {
            accumulatedContent = fullText
          } else if (typeof token === 'string') {
            accumulatedContent += token
          }
          updateMessage(currentConversationId, placeholderMessage.id, () => ({
            content: accumulatedContent,
            status: 'loading'
          }))
        }
      })

      // 提取思考过程和答案
      let finalContent = typeof response?.content === 'string'
        ? response.content
        : accumulatedContent
      let finalReasoning = response?.reasoning ?? null

      if (isDeepThinking) {
        const contentForExtraction = finalContent || accumulatedContent
        if (!finalReasoning && contentForExtraction) {
          const segments = extractReasoningSegments(contentForExtraction)
          if (segments) {
            finalContent = segments.answer
            finalReasoning = segments.reasoning
          }
        }
      }

      // 完成更新
      updateMessage(currentConversationId, placeholderMessage.id, () => ({
        content: finalContent,
        status: 'done',
        metadata: {
          ...(isDeepThinking ? { deepThinking: true } : {}),
          ...(finalReasoning ? { reasoning: finalReasoning } : {})
        }
      }))

    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error(translate('toasts.failedToGenerate'))
        updateMessage(currentConversationId, placeholderMessage.id, () => ({
          status: 'error'
        }))
      } else {
        toast.info(translate('toasts.generationStopped'))
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [
    currentConversationId,
    currentConversation,
    modelConfig,
    isDeepThinking,
    isGenerating,
    appendMessage,
    updateMessage,
    translate
  ])

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }, [])

  const handleEditMessage = useCallback((messageId, newContent) => {
    if (!currentConversationId) return
    editMessage(currentConversationId, messageId, newContent)
  }, [currentConversationId, editMessage])

  const handleDeleteMessage = useCallback((messageId) => {
    if (!currentConversationId) return
    deleteMessage(currentConversationId, messageId)
  }, [currentConversationId, deleteMessage])

  const handleRegenerateMessage = useCallback(async (messageId) => {
    if (!currentConversationId || !currentConversation) return
    
    // 找到要重新生成的消息
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return
    
    // 找到对应的用户消息
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && currentConversation.messages[userMessageIndex].role !== 'user') {
      userMessageIndex--
    }
    
    if (userMessageIndex < 0) return
    
    const userMessage = currentConversation.messages[userMessageIndex]
    
    // 删除旧的助手回复
    deleteMessage(currentConversationId, messageId)
    
    // 显示提示
    toast.info(translate('toasts.messageRegenerating', 'Regenerating response...'))
    
    // 重新发送消息
    await handleSendMessage(userMessage.content, userMessage.attachments || [])
  }, [currentConversationId, currentConversation, deleteMessage, handleSendMessage, translate])

  // ==================== 对话操作 ====================
  
  const handleNewConversation = useCallback(() => {
    addConversation(translate('buttons.newConversation'))
  }, [addConversation, translate])

  const handleClearConversation = useCallback(() => {
    replaceConversationMessages(currentConversationId, [])
  }, [currentConversationId, replaceConversationMessages])

  // ==================== 配置操作 ====================
  
  const handleSaveConfig = useCallback((config) => {
    updateConfig(config)
  }, [updateConfig])

  // ==================== 快捷键 ====================
  
  useKeyboardShortcuts([
    {
      ...DEFAULT_SHORTCUTS.NEW_CONVERSATION,
      handler: handleNewConversation
    },
    {
      ...DEFAULT_SHORTCUTS.SETTINGS,
      handler: () => setShowConfig(true)
    },
    {
      ...DEFAULT_SHORTCUTS.SHOW_SHORTCUTS,
      handler: () => setShowShortcuts(true)
    },
    {
      ...DEFAULT_SHORTCUTS.CLOSE_DIALOG,
      handler: () => {
        setShowConfig(false)
        setShowShortcuts(false)
      }
    },
    {
      ...DEFAULT_SHORTCUTS.TOGGLE_THEME,
      handler: toggleTheme
    }
  ])

  // ==================== 渲染 ====================
  
  // 转换对话对象为数组
  const conversationList = Object.values(conversations || {})

  return (
    <>
      {/* Toast 通知 */}
      <Toaster position="top-center" />

      <div className={`app-container ${theme}`}>
        {/* 侧边栏 */}
        <Sidebar
          conversations={conversationList}
          currentConversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={handleNewConversation}
          onRenameConversation={renameConversation}
          onDeleteConversation={removeConversation}
          onClearAll={clearAllConversations}
          translate={translate}
        />

        {/* 聊天区域 */}
        <ChatContainer
          conversation={currentConversation}
          messages={currentConversation?.messages || []}
          isGenerating={isGenerating}
          pendingAttachments={pendingAttachments}
          isDeepThinking={isDeepThinking}
          isDeepThinkingAvailable={isDeepThinkingAvailable}
          language={language}
          theme={theme}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onToggleDeepThinking={toggleDeepThinking}
          onToggleLanguage={toggleLanguage}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setShowConfig(true)}
          onClearConversation={handleClearConversation}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerateMessage}
          translate={translate}
        />

        {/* 配置面板 */}
        <ConfigPanel
          modelConfig={modelConfig}
          currentProvider={currentProvider}
          currentModel={currentModel}
          providerModels={currentProviderModels}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowConfig(false)}
          isOpen={showConfig}
          translate={translate}
        />
      </div>

      {/* 快捷键帮助 */}
      {showShortcuts && (
        <ShortcutsDialog
          shortcuts={DEFAULT_SHORTCUTS}
          onClose={() => setShowShortcuts(false)}
          translate={translate}
        />
      )}
    </>
  )
}

export default App

