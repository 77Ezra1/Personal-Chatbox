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
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

// Utils
import { generateAIResponse, extractReasoningSegments } from '@/lib/aiClient'
import { readFileAsDataUrl, createAttachmentId } from '@/lib/utils'
import { PROVIDERS } from '@/lib/constants'

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
    updateConfig,
    removeCustomModel
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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'default'
  })
  
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
  
  const regenerateAssistantReply = useCallback(async ({ messages, placeholderMessage }) => {
    if (!currentConversationId) return

    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    let accumulatedContent = ''
    let accumulatedReasoning = ''

    try {
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
          
          // 在流式输出时，如果开启深度思考模式，实时提取并分离reasoning和answer
          let displayContent = accumulatedContent
          if (isDeepThinking && accumulatedContent) {
            const segments = extractReasoningSegments(accumulatedContent)
            if (segments) {
              displayContent = segments.answer
              accumulatedReasoning = segments.reasoning
            }
          }
          
          updateMessage(currentConversationId, placeholderMessage.id, () => ({
            content: displayContent,
            status: 'loading',
            metadata: {
              ...(isDeepThinking ? { deepThinking: true } : {}),
              ...(accumulatedReasoning ? { reasoning: accumulatedReasoning } : {})
            }
          }))
        }
      })

      let finalContent = typeof response?.content === 'string'
        ? response.content
        : accumulatedContent
      let finalReasoning = response?.reasoning ?? accumulatedReasoning ?? null

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
        updateMessage(currentConversationId, placeholderMessage.id, (prev) => ({
          content: accumulatedContent || prev.content || translate('messages.generationStopped', 'Generation stopped.'),
          status: 'done',
          metadata: {
            ...(prev?.metadata || {}),
            cancelReason: 'aborted'
          }
        }))
        toast.info(translate('toasts.generationStopped'))
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [
    currentConversationId,
    modelConfig,
    isDeepThinking,
    updateMessage,
    translate
  ])

  const handleSendMessage = useCallback(async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return
    if (isGenerating) return

    const existingMessages = currentConversation?.messages || []

    const userMessage = conversationUtils.createMessage({
      role: 'user',
      content,
      attachments
    })
    appendMessage(currentConversationId, userMessage)

    setPendingAttachments([])

    const placeholderMessage = conversationUtils.createMessage({
      role: 'assistant',
      content: '',
      status: 'loading'
    })
    appendMessage(currentConversationId, placeholderMessage)

    await regenerateAssistantReply({
      messages: [...existingMessages, userMessage],
      placeholderMessage
    })
  }, [
    currentConversationId,
    currentConversation,
    appendMessage,
    regenerateAssistantReply,
    isGenerating
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
    if (isGenerating) return

    // 找到要重新生成的消息
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return
    
    // 找到对应的用户消息
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && currentConversation.messages[userMessageIndex].role !== 'user') {
      userMessageIndex--
    }
    
    if (userMessageIndex < 0) return
    
    // 删除旧的助手回复
    deleteMessage(currentConversationId, messageId)

    const messagesAfterDeletion = currentConversation.messages
      .filter(msg => msg.id !== messageId)

    // 显示提示
    toast.info(translate('toasts.messageRegenerating', 'Regenerating response...'))

    const placeholderMessage = conversationUtils.createMessage({
      role: 'assistant',
      content: '',
      status: 'loading'
    })
    appendMessage(currentConversationId, placeholderMessage)

    await regenerateAssistantReply({
      messages: messagesAfterDeletion,
      placeholderMessage
    })
  }, [
    currentConversationId,
    currentConversation,
    isGenerating,
    deleteMessage,
    appendMessage,
    regenerateAssistantReply,
    translate
  ])

  // ==================== 对话操作 ====================
  
  const handleNewConversation = useCallback(() => {
    addConversation(translate('buttons.newConversation'))
  }, [addConversation, translate])

  // ==================== 配置操作 ====================

  const handleSaveConfig = useCallback((config) => {
    updateConfig(config)
  }, [updateConfig])

  const handleRemoveModel = useCallback((modelId) => {
    // 检查是否是自定义模型（不在PROVIDERS的默认模型列表中）
    const defaultModels = PROVIDERS[currentProvider]?.models || []
    if (defaultModels.includes(modelId)) {
      toast.error(
        language === 'zh' 
          ? '无法删除默认模型' 
          : 'Cannot remove default model'
      )
      return
    }

    // 显示确认对话框
    setConfirmDialog({
      isOpen: true,
      title: language === 'zh' ? '确认删除' : 'Confirm Delete',
      message: language === 'zh'
        ? `确定要删除模型 "${modelId}" 吗？`
        : `Are you sure you want to remove model "${modelId}"?`,
      variant: 'danger',
      onConfirm: () => {
        removeCustomModel(currentProvider, modelId)
        
        // 如果删除的是当前选中的模型，切换到默认模型
        if (currentModel === modelId) {
          const remainingModels = currentProviderModels.filter(m => m !== modelId)
          const nextModel = remainingModels[0] || defaultModels[0] || ''
          setModel(nextModel)
        }
        
        toast.success(
          language === 'zh' 
            ? `已删除模型 "${modelId}"` 
            : `Model "${modelId}" removed`
        )
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }, [currentProvider, currentModel, currentProviderModels, removeCustomModel, setModel, language])

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
          language={language}
          theme={theme}
          currentConversation={currentConversation}
          onToggleLanguage={toggleLanguage}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setShowConfig(true)}
          onShowConfirm={(config) => setConfirmDialog({ ...config, isOpen: true })}
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
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onToggleDeepThinking={toggleDeepThinking}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerateMessage}
          onShowConfirm={(config) => setConfirmDialog({ ...config, isOpen: true })}
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
          onRemoveModel={handleRemoveModel}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowConfig(false)}
          isOpen={showConfig}
          translate={translate}
          language={language}
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

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={language === 'zh' ? '确定' : 'Confirm'}
        cancelText={language === 'zh' ? '取消' : 'Cancel'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}

export default App

