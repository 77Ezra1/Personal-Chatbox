import { useState, useRef, useCallback } from 'react'
import { Toaster, toast } from 'sonner'

// Hooks
import { useConversations, conversationUtils } from '@/hooks/useConversations'
import { useTranslation } from '@/hooks/useTranslation'
import { useTheme } from '@/hooks/useTheme'
import { useModelConfig } from '@/hooks/useModelConfig'
import { useDeepThinking } from '@/hooks/useDeepThinking'

// Components
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { ConfigPanel } from '@/components/config/ConfigPanel'

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
    replaceConversationMessages
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
  
  const [showConfig, setShowConfig] = useState(false)
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
    } catch (error) {
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

      await generateAIResponse({
        messages,
        config: modelConfig,
        isDeepThinking,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk
          updateMessage(currentConversationId, placeholderMessage.id, () => ({
            content: accumulatedContent,
            status: 'loading'
          }))
        }
      })

      // 提取思考过程和答案
      let finalContent = accumulatedContent
      let finalReasoning = null

      if (isDeepThinking && accumulatedContent) {
        const segments = extractReasoningSegments(accumulatedContent)
        if (segments) {
          finalContent = segments.answer
          finalReasoning = segments.reasoning
        }
      }

      // 完成更新
      updateMessage(currentConversationId, placeholderMessage.id, () => ({
        content: finalContent,
        status: 'done',
        metadata: finalReasoning ? { reasoning: finalReasoning, deepThinking: isDeepThinking } : {}
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

  // ==================== 渲染 ====================
  
  // 转换对话对象为数组
  const conversationList = Object.values(conversations || {})

  return (
    <div className={`app ${theme}`}>
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
        translate={translate}
      />

      {/* 配置面板 */}
      {showConfig && (
        <ConfigPanel
          modelConfig={modelConfig}
          currentProvider={currentProvider}
          currentModel={currentModel}
          providerModels={currentProviderModels}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowConfig(false)}
          translate={translate}
        />
      )}

      {/* Toast 通知 */}
      <Toaster position="top-center" />
    </div>
  )
}

export default App

