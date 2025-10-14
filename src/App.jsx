import { useState, useRef, useCallback, useMemo, memo } from 'react'
import { Toaster, toast } from 'sonner'

// Hooks
import { useConversationsDB as useConversations, conversationUtils } from '@/hooks/useConversationsDB'
import { useDataMigration } from '@/hooks/useDataMigration'
import { useTranslation } from '@/hooks/useTranslation'
import { useTheme } from '@/hooks/useTheme'
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useDeepThinking } from '@/hooks/useDeepThinking'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { useSystemPromptDB } from '@/hooks/useSystemPromptDB'
import { useMcpManager } from '@/hooks/useMcpManager'

// Components
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { ShortcutsDialog } from '@/components/common/ShortcutsDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataMigration } from '@/components/common/DataMigration'

// Utils
import { generateAIResponse, extractReasoningSegments } from '@/lib/aiClient'
import { readFileAsDataUrl, createAttachmentId } from '@/lib/utils'
import { PROVIDERS } from '@/lib/constants'


import './App.css'

import { createLogger } from 'lib/logger'
const logger = createLogger('App')


function App() {
  // ==================== Hooks ====================
  
  // 数据迁移
  const { migrationStatus } = useDataMigration()
  
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
    editMessage,
    loading: conversationsLoading
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
    customModels,
    models,
    loading: modelsLoading,
    setProvider,
    setModel,
    updateConfig,
    addCustomModel,
    removeCustomModel
  } = useModelConfigDB()

  // 深度思考
  const {
    isDeepThinking,
    isDeepThinkingAvailable,
    isButtonDisabled,      // 新增
    thinkingMode,          // 新增
    toggleDeepThinking
  } = useDeepThinking(modelConfig)

  // 系统提示词
  const {
    systemPrompt,
    loading: promptLoading,
    setMode: setSystemPromptMode,
    setGlobalPrompt,
    setModelPrompts,
    getEffectivePrompt
  } = useSystemPromptDB()

  // MCP 服务器
  const { getAllTools, callTool, loading: mcpLoading, error: mcpError } = useMcpManager()

  // ==================== 本地状态 ====================
  
  const [showSettings, setShowSettings] = useState(false)
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

  // ==================== 初始化 ====================

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

  // ==================== 优化: 缓存 MCP 工具列表 ====================
  
  // 缓存工具列表，避免每次渲染都重新获取
  const mcpTools = useMemo(() => {
    try {
      return getAllTools()
    } catch (error) {
      logger.error('[App] Failed to get MCP tools:', error)
      return []
    }
  }, [getAllTools])

  // ==================== 消息处理 ====================
  
  const regenerateAssistantReply = useCallback(async ({ messages, placeholderMessage }) => {
    if (!currentConversationId) return

    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    let accumulatedContent = ''
    let accumulatedReasoning = ''

    try {
      // 使用缓存的工具列表
      logger.log('[App] MCP Tools loaded:', mcpTools.length, mcpTools)
      
      const response = await generateAIResponse({
        messages,
        modelConfig: { ...modelConfig, deepThinking: isDeepThinking },
        signal: abortControllerRef.current.signal,
        systemPrompt,
        tools: mcpTools,
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

      // 检查是否有工具调用
      if (response?.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0) {
        logger.log('[App] 检测到工具调用，开始处理MCP服务请求')
        
        // 更新消息显示工具调用正在进行
        updateMessage(currentConversationId, placeholderMessage.id, () => ({
          content: '正在调用MCP服务获取信息...',
          status: 'loading',
          metadata: {
            ...(isDeepThinking ? { deepThinking: true } : {}),
            toolCalling: true
          }
        }))
        
        // 执行工具调用
        const toolResults = []
        let toolCallReasoning = accumulatedReasoning || ''
        
        for (const toolCall of response.tool_calls) {
          try {
            logger.log('[App] Processing tool call:', toolCall)
            const args = JSON.parse(toolCall.function.arguments)
            
            // 在思考过程中记录工具调用
            toolCallReasoning += `\n\n[MCP服务调用] ${toolCall.function.name}\n参数: ${JSON.stringify(args, null, 2)}\n`
            
            const result = await callTool(toolCall.function.name, args)
            
            // 在思考过程中记录工具调用结果
            if (result.success) {
              toolCallReasoning += `[搜索结果获取成功]\n${result.content}\n`
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolCall.function.name,
                content: result.content
              })
            } else {
              toolCallReasoning += `[搜索结果获取失败] ${result.error}\n`
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolCall.function.name,
                content: `Error: ${result.error}`
              })
            }
          } catch (error) {
            toolCallReasoning += `[工具调用异常] ${error.message}\n`
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: `Error: ${error.message}`
            })
          }
        }
        
        // 将工具调用和结果添加到消息历史
        const messagesWithTools = [
          ...messages,
          {
            role: 'assistant',
            content: response.content || null,
            tool_calls: response.tool_calls
          },
          ...toolResults
        ]
        
        // 添加系统提示，指导AI如何处理工具结果
        const systemPromptForToolResult = `
你现在已经获得了详细的搜索结果。请立即基于这些信息生成一个完整的回复：

**要求：**
1. 必须基于搜索结果中的具体信息进行分析，不要忽略任何重要内容
2. 生成至少500字的详细分析报告，确保内容丰富有价值
3. 使用结构化格式（标题、子标题、要点列表）使内容易读
4. 不要说"需要更多信息"或"让我再次搜索"，直接基于现有信息进行全面分析
5. 必须提及搜索结果中的具体内容、数据、案例和来源
6. 在适当位置添加重要信息的来源链接
7. 确保回复专业、准确、有深度

**现在就开始生成完整的回复，基于搜索结果提供有价值的分析。**
`
        
        // 使用工具结果重新生成回复，不再允许再次调用工具
        const finalResponse = await generateAIResponse({
          messages: [
            ...messagesWithTools,
            {
              role: 'system',
              content: systemPromptForToolResult,
              attachments: []
            }
          ],
          modelConfig: { ...modelConfig, deepThinking: true }, // 强制开启深度思考
          signal: abortControllerRef.current.signal,
          systemPrompt,
          tools: [], // 不允许再次调用工具，强制基于现有结果回复
          onToken: (token, fullText) => {
            if (typeof fullText === 'string') {
              accumulatedContent = fullText
            } else if (typeof token === 'string') {
              accumulatedContent += token
            }
            
            let displayContent = accumulatedContent
            let currentReasoning = toolCallReasoning
            
            // 提取新的推理内容
            if (accumulatedContent) {
              const segments = extractReasoningSegments(accumulatedContent)
              if (segments) {
                displayContent = segments.answer
                currentReasoning = toolCallReasoning + '\n\n[分析整理过程]\n' + segments.reasoning
              }
            }
            
            updateMessage(currentConversationId, placeholderMessage.id, () => ({
              content: displayContent,
              status: 'loading',
              metadata: {
                deepThinking: true, // 确保显示思考过程
                reasoning: currentReasoning,
                toolCalling: false
              }
            }))
          }
        })
        
        // 处理最终响应
        let finalContent = typeof finalResponse?.content === 'string'
          ? finalResponse.content
          : accumulatedContent
        let finalReasoning = toolCallReasoning
        
        // 提取最终的推理内容
        const contentForExtraction = finalContent || accumulatedContent
        if (contentForExtraction) {
          const segments = extractReasoningSegments(contentForExtraction)
          if (segments) {
            finalContent = segments.answer
            finalReasoning = toolCallReasoning + '\n\n[分析整理过程]\n' + segments.reasoning
          }
        }
        
        updateMessage(currentConversationId, placeholderMessage.id, () => ({
          content: finalContent,
          status: 'done',
          metadata: {
            deepThinking: true,
            reasoning: finalReasoning,
            toolCalling: false
          }
        }))
      } else {
        // 没有工具调用，正常处理
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
      }
    } catch (error) {
      logger.error('[App] Error in regenerateAssistantReply:', error)
      if (error.name !== 'AbortError') {
        logger.error('[App] API Error details:', {
          message: error.message,
          stack: error.stack,
          modelConfig,
          tools: tools?.length || 0
        })
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
    translate,
    mcpTools,
    callTool,
    systemPrompt
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
    <DataMigration language={language} translate={translate}>
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
          onOpenSettings={() => setShowSettings(true)}
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
          isButtonDisabled={isButtonDisabled}              // 新增
          thinkingMode={thinkingMode}                      // 新增
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

        {/* 设置页面 */}
        <SettingsPage
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          modelConfig={modelConfig}
          currentProvider={currentProvider}
          currentModel={currentModel}
          providerModels={currentProviderModels}
          customModels={customModels}
          models={models}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onRemoveModel={handleRemoveModel}
          onSaveConfig={handleSaveConfig}
          systemPrompt={systemPrompt}
          onSystemPromptModeChange={setSystemPromptMode}
          onSystemPromptGlobalChange={setGlobalPrompt}
          onSystemPromptModelChange={(modelKeys, prompt, newPrompts) => {
            if (newPrompts) {
              setModelPrompts([], '', newPrompts)
            } else {
              setModelPrompts(modelKeys, prompt)
            }
          }}
          theme={theme}
          onThemeChange={toggleTheme}
          language={language}
          onLanguageChange={toggleLanguage}
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

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        translate={translate}
      />
    </DataMigration>
  )
}

export default App

