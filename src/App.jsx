import { useState, useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import AnalyticsPage from '@/pages/AnalyticsPage'
import { ShortcutsDialog } from '@/components/common/ShortcutsDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataMigration } from '@/components/common/DataMigration'
import { OnboardingTour } from '@/components/common/OnboardingTour'

// Lazy load pages for better performance
const AgentsPage = lazy(() => import('@/pages/AgentsPage'))
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage'))
const NotesPage = lazy(() => import('@/pages/NotesPage'))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'))
const PasswordVaultPage = lazy(() => import('@/pages/PasswordVaultPage'))
const McpCustomPage = lazy(() => import('@/pages/McpCustomPage'))
const PromptTemplatesPage = lazy(() => import('@/pages/PromptTemplatesPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))

// Utils
import { generateAIResponse, extractReasoningSegments } from '@/lib/aiClient'
import { readFileAsDataUrl, createAttachmentId } from '@/lib/utils'
import { PROVIDERS } from '@/lib/constants'
import { createLogger } from '@/lib/logger'
import { supportsFunctionCalling } from '@/lib/modelCompatibility'

import './App.css'

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
  const [showAnalytics, setShowAnalytics] = useState(false)
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
  // 同时检查模型是否支持 Function Calling
  const mcpTools = useMemo(() => {
    // 检查当前模型是否支持 Function Calling
    const modelSupportsFc = supportsFunctionCalling(modelConfig.provider, modelConfig.model)

    // 如果不支持，返回空数组，禁用工具调用
    if (!modelSupportsFc) {
      logger.warn(`[App] Model ${modelConfig.provider}/${modelConfig.model} does not support Function Calling, tools disabled`)
      return []
    }

    try {
      const tools = getAllTools()
      logger.log(`[App] Loaded ${tools.length} MCP tools for model ${modelConfig.model}`)
      return tools
    } catch (error) {
      logger.error('[App] Failed to get MCP tools:', error)
      return []
    }
  }, [getAllTools, modelConfig.provider, modelConfig.model, supportsFunctionCalling])

  // ==================== 消息处理 ====================

  const regenerateAssistantReply = useCallback(async ({ messages, placeholderMessage }) => {
    // 🔍 调试日志
    logger.log('[regenerateAssistantReply] Called with:', {
      messagesCount: messages?.length,
      currentConversationId,
      hasPlaceholder: !!placeholderMessage
    })

    if (!currentConversationId) {
      logger.error('[regenerateAssistantReply] No current conversation ID!')
      return
    }

    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    let accumulatedContent = ''
    let accumulatedReasoning = ''
    let usageData = null // 保存 usage 信息

    try {
      // 使用缓存的工具列表
      logger.log('[App] MCP Tools loaded:', mcpTools.length, mcpTools)

      const response = await generateAIResponse({
        messages,
        modelConfig: { ...modelConfig, deepThinking: isDeepThinking },
        signal: abortControllerRef.current.signal,
        systemPrompt,
        tools: mcpTools,
        onToken: (token, fullText, reasoning) => {
          // 更新内容
          if (typeof fullText === 'string') {
            accumulatedContent = fullText
          } else if (typeof token === 'string') {
            accumulatedContent += token
          }

          // 更新reasoning
          if (reasoning) {
            accumulatedReasoning = reasoning
          }

          // 在流式输出时，如果开启深度思考模式，实时提取并分离reasoning和answer
          let displayContent = accumulatedContent
          if (isDeepThinking && accumulatedContent && !reasoning) {
            // 只有在后端没有直接提供reasoning时才从content中提取
            const segments = extractReasoningSegments(accumulatedContent)
            if (segments) {
              displayContent = segments.answer
              accumulatedReasoning = segments.reasoning
            }
          }

          // 调试日志：每次更新时输出状态
          if (token && accumulatedContent.length % 100 < token.length) {
            logger.log(`[onToken] 更新消息: content长度=${displayContent.length}, reasoning=${!!accumulatedReasoning}, status=loading`)
          }

          updateMessage(currentConversationId, placeholderMessage.id, () => ({
            content: displayContent,
            status: 'loading',
            metadata: {
              ...(isDeepThinking ? { deepThinking: true } : {}),
              ...(accumulatedReasoning ? { reasoning: accumulatedReasoning } : {}),
              ...(usageData ? { usage: usageData } : {})
            }
          }))
        }
      })

      // 保存 usage 信息
      if (response?.usage) {
        usageData = response.usage
        logger.log('[App] Token usage:', usageData)
      }

      // 检查是否有工具调用
      if (response?.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0) {
        logger.log('[App] 检测到工具调用，开始处理MCP服务请求')

        // 更新消息显示工具调用正在进行
        updateMessage(currentConversationId, placeholderMessage.id, () => ({
          content: '正在调用MCP服务获取信息...',
          status: 'loading',
          metadata: {
            ...(isDeepThinking ? { deepThinking: true } : {}),
            toolCalling: true,
            ...(usageData ? { usage: usageData } : {})
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
          onToken: (token, fullText, reasoning) => {
            // 更新内容
            if (typeof fullText === 'string') {
              accumulatedContent = fullText
            } else if (typeof token === 'string') {
              accumulatedContent += token
            }

            let displayContent = accumulatedContent
            let currentReasoning = toolCallReasoning

            // 如果后端直接提供reasoning,使用它
            if (reasoning) {
              currentReasoning = toolCallReasoning + '\n\n' + reasoning
            }

            // 如果没有直接提供reasoning,从content中提取
            if (!reasoning && accumulatedContent) {
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
                toolCalling: false,
                ...(usageData ? { usage: usageData } : {})
              }
            }))
          }
        })

        // 处理最终响应
        let finalContent = typeof finalResponse?.content === 'string'
          ? finalResponse.content
          : accumulatedContent
        let finalReasoning = toolCallReasoning

        // 累积工具调用的 usage 信息
        if (finalResponse?.usage) {
          if (usageData) {
            // 合并两次调用的 token 数
            usageData = {
              prompt_tokens: (usageData.prompt_tokens || 0) + (finalResponse.usage.prompt_tokens || 0),
              completion_tokens: (usageData.completion_tokens || 0) + (finalResponse.usage.completion_tokens || 0),
              total_tokens: (usageData.total_tokens || 0) + (finalResponse.usage.total_tokens || 0)
            }
          } else {
            usageData = finalResponse.usage
          }
          logger.log('[App] Tool call final usage:', usageData)
        }

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
            toolCalling: false,
            ...(usageData ? { usage: usageData } : {})
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
            ...(finalReasoning ? { reasoning: finalReasoning } : {}),
            ...(usageData ? { usage: usageData } : {})
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

        // 显示更具体的错误信息
        if (error.message?.includes('API key') || error.message?.includes('configure')) {
          toast.error(language === 'zh' ? '请先在设置中配置 API 密钥' : 'Please configure API key in settings first')
        } else {
          toast.error(translate('toasts.failedToGenerate'))
        }

        updateMessage(currentConversationId, placeholderMessage.id, () => ({
          status: 'error',
          content: error.message?.includes('API key')
            ? (language === 'zh' ? '⚠️ 请先配置 API 密钥\n\n请点击左侧设置图标，选择 AI 服务提供商（如 DeepSeek），并输入您的 API 密钥。'
              : '⚠️ Please configure API key first\n\nClick the settings icon on the left, select an AI provider (e.g., DeepSeek), and enter your API key.')
            : undefined
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
    systemPrompt,
    language
  ])

  const handleSendMessage = useCallback(async (content, attachments = []) => {
    // 🔍 调试日志
    logger.log('[handleSendMessage] Called with:', {
      content: content?.substring(0, 50),
      attachmentsCount: attachments.length,
      currentConversationId,
      isGenerating,
      hasCurrentConversation: !!currentConversation
    })

    if (!content.trim() && attachments.length === 0) {
      logger.warn('[handleSendMessage] Empty content and no attachments')
      return
    }

    if (isGenerating) {
      logger.warn('[handleSendMessage] Already generating, skipping')
      return
    }

    if (!currentConversationId) {
      logger.error('[handleSendMessage] No current conversation ID!')
      return
    }

    const existingMessages = currentConversation?.messages || []
    logger.log('[handleSendMessage] Existing messages count:', existingMessages.length)

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
            onOpenAnalytics={() => setShowAnalytics(true)}
            onShowConfirm={(config) => setConfirmDialog({ ...config, isOpen: true })}
            translate={translate}
          />

          {/* 主内容区 - 使用路由 */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              {/* 聊天主页 */}
              <Route path="/" element={
                <ChatContainer
                  conversation={currentConversation}
                  messages={currentConversation?.messages || []}
                  isGenerating={isGenerating}
                  pendingAttachments={pendingAttachments}
                  isDeepThinking={isDeepThinking}
                  isDeepThinkingAvailable={isDeepThinkingAvailable}
                  isButtonDisabled={isButtonDisabled}
                  thinkingMode={thinkingMode}
                  modelConfig={modelConfig}
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
              } />

              {/* Agent 管理页面 */}
              <Route path="/agents" element={<AgentsPage />} />

              {/* Workflow 管理页面 */}
              <Route path="/workflows" element={<WorkflowsPage />} />

              {/* 笔记管理页面 */}
              <Route path="/notes" element={<NotesPage />} />

              {/* 文档管理页面 */}
              <Route path="/documents" element={<DocumentsPage />} />

              {/* 密码保险库页面 */}
              <Route path="/password-vault" element={<PasswordVaultPage />} />

              {/* MCP自定义配置页面 */}
              <Route path="/mcp" element={<McpCustomPage />} />

              {/* Prompt模板库页面 */}
              <Route path="/prompt-templates" element={<PromptTemplatesPage />} />

              {/* 默认重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

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

          {/* 数据分析页面 */}
          {showAnalytics && (
            <div className="analytics-overlay" onClick={() => setShowAnalytics(false)}>
              <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="analytics-close"
                  onClick={() => setShowAnalytics(false)}
                  aria-label="关闭分析页面"
                >
                  ×
                </button>
                <AnalyticsPage />
              </div>
            </div>
          )}
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

        {/* 新用户引导 */}
        <OnboardingTour />
      </DataMigration>
  )
}

export default App

