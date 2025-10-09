import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageSquare,
  Settings,
  Plus,
  Trash,
  Send,
  CircleStop,
  Languages,
  Moon,
  Sun,
  Paperclip,
  ImagePlus,
  BrainCircuit,
  X,
  Download,
  ArrowDown,
  PencilLine,
  Check,
  X as CloseIcon,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { MarkdownRenderer } from '@/components/markdown-renderer.jsx'
import { Toaster, toast } from 'sonner'
import { generateAIResponse, extractReasoningSegments } from '@/lib/aiClient.js'
import { useConversations, conversationUtils } from '@/hooks/useConversations.js'
import './App.css'

function isDeepThinkingSupported() {
  if (typeof window === 'undefined') return false
  return !!window.ai
}

const CUSTOM_MODELS_KEY = 'custom-models.v1'
const MODEL_CONFIG_KEY = 'model-config.v1'
const LANGUAGE_KEY = 'app-language.v1'
const THEME_KEY = 'theme-preference.v1'
const FALLBACK_PROVIDER = 'openai'
const DEEP_THINKING_KEY = 'deep-thinking-mode.v1'
const SYSTEM_PROMPT_KEY = 'system-prompt.v1'

const TRANSLATIONS = {
  en: {
    headings: {
      conversation: 'Conversation',
      modelConfiguration: 'Model configuration'
    },
    buttons: {
      newConversation: 'New conversation',
      add: 'Add',
      save: 'Save',
      uploadAttachment: 'Upload attachment',
      addImage: 'Add image',
      deepThinking: 'Deep thinking',
      download: 'Download',
      copyMessage: 'Copy message',
      scrollToLatest: 'Scroll to latest'
    },
    labels: {
      provider: 'Provider',
      modelId: 'Model ID',
      model: 'Model',
      apiKey: 'API key',
      temperature: 'Temperature',
      maxTokens: 'Max tokens',
      user: 'You',
      assistant: 'Assistant'
    },
    placeholders: {
      messageInput: 'Type a message...',
      customModel: 'Enter custom model'
    },
    sections: {
      reasoning: 'Reasoning',
      systemPrompt: 'System prompt'
    },
    toasts: {
      generationCancelled: 'Generation cancelled.',
      generationStopped: 'Generation stopped',
      noContent: 'No content returned. Please try again.',
      failedToGenerate: 'Failed to generate response.',
      configSaved: 'Configuration saved.',
      configSaveFailed: 'Failed to save configuration.',
      attachmentReadFailed: 'Failed to read attachment. Please try again.',
      systemPromptSaved: 'System prompt updated.',
      messageCopied: 'Message copied to clipboard.',
      failedToCopy: 'Failed to copy message.',
      deepThinkingUnsupported: 'This model does not support deep thinking mode.'
    },
    tooltips: {
      stopGenerating: 'Stop generating',
      clearConversations: 'Clear all conversations',
      toggleLanguage: 'Toggle language',
      toggleTheme: 'Toggle theme',
      openSettings: 'Open settings',
      uploadAttachment: 'Upload attachment',
      addImage: 'Insert image',
      toggleDeepThinking: 'Toggle deep thinking mode',
      removeAttachment: 'Remove attachment',
      copyMessage: 'Copy message'
    },
    toggles: {
      languageShortEnglish: 'EN',
      languageShortChinese: '涓枃',
      light: 'Light',
      dark: 'Dark',
      deepThinkingOn: 'Deep thinking: On',
      deepThinkingOff: 'Deep thinking: Off'
    },
    providers: {
      openai: 'OpenAI',
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot',
      groq: 'Groq',
      mistral: 'Mistral',
      together: 'Together AI',
      anthropic: 'Anthropic',
      google: 'Google Gemini',
      volcengine: 'Volcano Engine'
    }
  },
  zh: {
    headings: {
      conversation: '对话',
      modelConfiguration: '模型配置'
    },
    buttons: {
      newConversation: '新建对话',
      add: '添加',
      save: '保存',
      uploadAttachment: '上传附件',
      addImage: '添加图片',
      deepThinking: '深度思考',
      download: '下载',
      copyMessage: '复制消息',
      scrollToLatest: '滚动到底部'
    },
    labels: {
      provider: '服务商',
      modelId: '模型 ID',
      model: '模型',
      apiKey: 'API 密钥',
      temperature: '温度',
      maxTokens: '最大 Token 数',
      user: '你',
      assistant: '助手'
    },
    placeholders: {
      messageInput: '请输入消息...',
      customModel: '添加自定义模型'
    },
    sections: {
      reasoning: '思考过程',
      systemPrompt: '系统提示词'
    },
    toasts: {
      generationCancelled: '生成已取消。',
      generationStopped: '生成已停止。',
      noContent: '没有返回内容，请重试。',
      failedToGenerate: '生成响应失败。',
      configSaved: '配置已保存。',
      configSaveFailed: '配置保存失败。',
      attachmentReadFailed: '附件读取失败，请重试。',
      systemPromptSaved: '系统提示已更新。',
      messageCopied: '消息已复制到剪贴板。',
      failedToCopy: '消息复制失败。',
      deepThinkingUnsupported: '该模型不支持深度思考模式。'
    },
    tooltips: {
      stopGenerating: '停止生成',
      clearConversations: '清除所有对话',
      toggleLanguage: '切换语言',
      toggleTheme: '切换主题',
      openSettings: '打开设置',
      uploadAttachment: '上传附件',
      addImage: '插入图片',
      toggleDeepThinking: '切换深度思考模式',
      removeAttachment: '移除附件',
      copyMessage: '复制消息'
    },
    toggles: {
      languageShortEnglish: 'EN',
      languageShortChinese: '中文',
      light: '浅色',
      dark: '深色',
      deepThinkingOn: '深度思考：开启',
      deepThinkingOff: '深度思考：关闭'
    },
    providers: {
      openai: 'OpenAI',
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot',
      groq: 'Groq',
      mistral: 'Mistral',
      together: 'Together AI',
      anthropic: 'Anthropic',
      google: 'Google Gemini',
      volcengine: '火山引擎'
    }
  }
}

const createAttachmentId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const formatFileSize = (bytes = 0) => {
  if (!bytes || Number.isNaN(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const formatted = unitIndex === 0 || size >= 10 ? Math.round(size) : Number(size.toFixed(1))
  return `${formatted} ${units[unitIndex]}`
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '')
      }
      reader.onerror = () => {
        reject(reader.error ?? new Error('Failed to read file'))
      }
      reader.onabort = () => reject(new Error('File reading aborted'))
      reader.readAsDataURL(file)
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to read file'))
    }
  })

function getTranslationValue(language, key) {
  const segments = key.split('.')
  let current = TRANSLATIONS[language]
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return undefined
    }
    current = current[segment]
  }
  return typeof current === 'string' ? current : undefined
}

const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo']
  },
  deepseek: {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  moonshot: {
    label: 'Moonshot',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k']
  },
  groq: {
    label: 'Groq',
    models: ['mixtral-8x7b-32768', 'llama3-70b-8192']
  },
  mistral: {
    label: 'Mistral',
    models: ['mistral-large-latest', 'mistral-medium']
  },
  together: {
    label: 'Together AI',
    models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3-8B-Instruct']
  },
  anthropic: {
    label: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet']
  },
  google: {
    label: 'Google Gemini',
    models: ['gemini-pro', 'gemini-ultra']
  },
  volcengine: {
    label: 'Volcano Engine',
    models: ['doubao-pro-32k']
  }
}

// DeepSeek 当前仅提供非流式接口，stream 参数会报错，因此不加入该集合
const STREAMING_CAPABLE_PROVIDERS = new Set([
  'openai',
  'moonshot',
  'groq',
  'mistral',
  'together',
  'anthropic',
  'google',
  'volcengine'
])

const DEEP_THINKING_SUPPORTED_PROVIDERS = new Set(['openai'])

const getDefaultModel = (provider, customModels = {}) => {
  const defaults = PROVIDERS[provider]?.models ?? []
  const customs = customModels[provider] ?? []
  return [...defaults, ...customs][0] ?? defaults[0] ?? 'gpt-4o-mini'
}

const THIRD_PARTY_PROVIDERS = new Set([
  'deepseek',
  'moonshot',
  'groq',
  'mistral',
  'together',
  'anthropic',
  'google',
  'volcengine'
])

const DEFAULT_MODEL_SETTINGS = {
  apiKey: '',
  temperature: 0.7,
  maxTokens: 1024
}

const toNumber = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const sanitizeModelSettings = (settings = {}) => ({
  apiKey: typeof settings.apiKey === 'string' ? settings.apiKey : DEFAULT_MODEL_SETTINGS.apiKey,
  temperature: toNumber(settings.temperature, DEFAULT_MODEL_SETTINGS.temperature),
  maxTokens: toNumber(settings.maxTokens, DEFAULT_MODEL_SETTINGS.maxTokens)
})

const cloneState = (value) => JSON.parse(JSON.stringify(value ?? {}))

const ensureProviderEntry = (state, provider, customModels = {}) => {
  let entry = state[provider]
  if (!entry || typeof entry !== 'object') {
    entry = { activeModel: '', models: {} }
  }
  if (!entry.models || typeof entry.models !== 'object') {
    entry.models = {}
  }
  if (typeof entry.activeModel !== 'string' || !entry.activeModel) {
    entry.activeModel = getDefaultModel(provider, customModels)
  }
  state[provider] = entry
  return entry
}

const ensureModelEntry = (state, provider, modelName, customModels = {}) => {
  const entry = ensureProviderEntry(state, provider, customModels)
  const targetModel = modelName || entry.activeModel || getDefaultModel(provider, customModels)
  if (!entry.models[targetModel]) {
    entry.models[targetModel] = sanitizeModelSettings()
  } else {
    entry.models[targetModel] = sanitizeModelSettings(entry.models[targetModel])
  }
  entry.activeModel = targetModel
  state[provider] = entry
  return { entry, model: targetModel }
}

const buildModelConfigFromState = (state, provider, modelName, customModels = {}) => {
  const { entry, model } = ensureModelEntry(state, provider, modelName, customModels)
  const settings = sanitizeModelSettings(entry.models[model])
  entry.models[model] = settings
  entry.activeModel = model
  state[provider] = entry
  return { provider, model, ...settings }
}

const applyModelSettings = (state, provider, modelName, customModels = {}, updates = {}) => {
  const { entry, model } = ensureModelEntry(state, provider, modelName, customModels)
  const existing = entry.models[model]
  const next =
    typeof updates === 'function' ? updates(existing) : { ...existing, ...updates }
  const sanitized = sanitizeModelSettings(next)
  entry.models[model] = sanitized
  entry.activeModel = model
  state[provider] = entry
  return sanitized
}

const loadStoredCustomModels = () => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = window.localStorage.getItem(CUSTOM_MODELS_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const loadStoredModelState = (customModels) => {
  const fallbackModel = getDefaultModel(FALLBACK_PROVIDER, customModels)
  const baseProviders = {
    [FALLBACK_PROVIDER]: {
      activeModel: fallbackModel,
      models: {
        [fallbackModel]: sanitizeModelSettings()
      }
    }
  }

  if (typeof window === 'undefined') {
    return {
      initialProvider: FALLBACK_PROVIDER,
      initialModel: fallbackModel,
      savedProviders: cloneState(baseProviders)
    }
  }

  try {
    const stored = window.localStorage.getItem(MODEL_CONFIG_KEY)
    if (!stored) {
      return {
        initialProvider: FALLBACK_PROVIDER,
        initialModel: fallbackModel,
        savedProviders: cloneState(baseProviders)
      }
    }

    const parsed = JSON.parse(stored)
    const providersInput =
      parsed && typeof parsed === 'object' && parsed.providers && typeof parsed.providers === 'object'
        ? parsed.providers
        : parsed && typeof parsed === 'object' && parsed.configs && typeof parsed.configs === 'object'
          ? parsed.configs
          : {}

    const normalizedProviders = {}

    Object.entries(providersInput).forEach(([provider, value]) => {
      if (!provider) return
      const activeModelRaw = typeof value?.activeModel === 'string' ? value.activeModel : ''
      const modelsRaw = value?.models && typeof value.models === 'object' ? value.models : {}
      const models = {}
      Object.entries(modelsRaw).forEach(([model, settings]) => {
        if (!model) return
        models[model] = sanitizeModelSettings(settings)
      })
      let activeModel = activeModelRaw
      if (!activeModel || !models[activeModel]) {
        activeModel = getDefaultModel(provider, customModels)
      }
      if (!models[activeModel]) {
        models[activeModel] = sanitizeModelSettings()
      }
      normalizedProviders[provider] = { activeModel, models }
    })

    if (!normalizedProviders[FALLBACK_PROVIDER]) {
      normalizedProviders[FALLBACK_PROVIDER] = cloneState(baseProviders[FALLBACK_PROVIDER])
    }

    let initialProvider = FALLBACK_PROVIDER
    if (
      typeof parsed?.lastProvider === 'string' &&
      normalizedProviders[parsed.lastProvider]
    ) {
      initialProvider = parsed.lastProvider
    } else {
      const providerKeys = Object.keys(normalizedProviders)
      if (providerKeys.length > 0) {
        initialProvider = providerKeys[0]
      }
    }

    return {
      initialProvider,
      initialModel:
        normalizedProviders[initialProvider]?.activeModel ??
        getDefaultModel(initialProvider, customModels),
      savedProviders: normalizedProviders
    }
  } catch {
    return {
      initialProvider: FALLBACK_PROVIDER,
      initialModel: fallbackModel,
      savedProviders: cloneState(baseProviders)
    }
  }
}


function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(conversation.title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  useEffect(() => {
    setDraftTitle(conversation.title)
  }, [conversation.title])

  const commitRename = useCallback(() => {
    const nextTitle = draftTitle.trim()
    if (nextTitle && nextTitle !== conversation.title) {
      onRename(conversation.id, nextTitle)
    } else {
      setDraftTitle(conversation.title)
    }
    setIsEditing(false)
  }, [conversation.id, conversation.title, draftTitle, onRename])

  const cancelRename = useCallback(() => {
    setDraftTitle(conversation.title)
    setIsEditing(false)
  }, [conversation.title])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }

  return (
    <div className={`conversation-item ${isActive ? 'active' : ''}`}>
      <button type="button" onClick={onSelect} className="conversation-item-main">
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        {isEditing ? (
          <input
            ref={inputRef}
            className="conversation-title-input"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            aria-label="Rename conversation"
          />
        ) : (
          <span className="conversation-title" title={conversation.title}>
            {conversation.title}
          </span>
        )}
      </button>
      <div className="conversation-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="conversation-action"
              onClick={commitRename}
              aria-label="Save name"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="conversation-action"
              onClick={cancelRename}
              aria-label="Cancel rename"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="conversation-action"
            onClick={(event) => {
              event.stopPropagation()
              setIsEditing(true)
            }}
            aria-label="Rename conversation"
          >
            <PencilLine className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          className="conversation-action"
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.(conversation.id, conversation.title)
          }}
          aria-label="Delete conversation"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function App() {
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
      removeConversation
    } = useConversations()

  const initialCustomModelsRef = useRef(null)
  if (initialCustomModelsRef.current === null) {
    initialCustomModelsRef.current = loadStoredCustomModels()
  }
  const [customModels, setCustomModels] = useState(initialCustomModelsRef.current)
  const [savedCustomModels, setSavedCustomModels] = useState(initialCustomModelsRef.current)
  const [systemPromptMode, setSystemPromptMode] = useState('global')
  const [globalSystemPrompt, setGlobalSystemPrompt] = useState('')
  const [modelSystemPrompts, setModelSystemPrompts] = useState({})

  const modelStateRef = useRef(null)
  if (modelStateRef.current === null) {
    modelStateRef.current = loadStoredModelState(initialCustomModelsRef.current)
  }

  const draftsRef = useRef(cloneState(modelStateRef.current.savedProviders))
  const [savedProviderConfigs, setSavedProviderConfigs] = useState(
    cloneState(modelStateRef.current.savedProviders)
  )
  const [modelConfig, setModelConfig] = useState(() =>
    buildModelConfigFromState(
      draftsRef.current,
      modelStateRef.current.initialProvider,
      modelStateRef.current.initialModel,
      initialCustomModelsRef.current
    )
  )
  const [draftFingerprint, setDraftFingerprint] = useState(() =>
    JSON.stringify(draftsRef.current)
  )

  const stripProvider = useCallback(
    (config) => {
      const { provider, model } = config
      const existing = draftsRef.current[provider]
      const snapshot = existing ? cloneState(existing) : { activeModel: model, models: {} }
      snapshot.activeModel = model
      snapshot.models = snapshot.models ?? {}
      snapshot.models[model] = sanitizeModelSettings(config)
      return snapshot
    },
    []
  )

  const resolveProviderConfig = useCallback(
    (provider) =>
      buildModelConfigFromState(
        draftsRef.current,
        provider,
        draftsRef.current[provider]?.activeModel,
        customModels
      ),
    [customModels]
  )

  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem(LANGUAGE_KEY)
    return stored === 'zh' ? 'zh' : 'en'
  })

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })

  const [showConfig, setShowConfig] = useState(false)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isDeepThinking, setIsDeepThinking] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DEEP_THINKING_KEY) === 'true'
  })
  const [supportsDeepThinking, setSupportsDeepThinking] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  const translate = useCallback(
    (key, fallback) =>
      getTranslationValue(language, key) ??
      fallback ??
      getTranslationValue('en', key) ??
      key,
    [language]
  )

  const hasUnsavedChanges = useMemo(() => {
    const savedSnapshot = JSON.stringify(savedProviderConfigs)
    if (savedSnapshot !== draftFingerprint) return true
    return JSON.stringify(customModels) !== JSON.stringify(savedCustomModels)
  }, [customModels, draftFingerprint, savedCustomModels, savedProviderConfigs])

  useEffect(() => {
    applyModelSettings(
      draftsRef.current,
      modelConfig.provider,
      modelConfig.model,
      customModels,
      modelConfig
    )
    setDraftFingerprint(JSON.stringify(draftsRef.current))
  }, [customModels, modelConfig])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(SYSTEM_PROMPT_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.mode === 'string') setSystemPromptMode(parsed.mode)
        if (typeof parsed.global === 'string') setGlobalSystemPrompt(parsed.global)
        if (parsed.perModel && typeof parsed.perModel === 'object') {
          setModelSystemPrompts(parsed.perModel)
        }
      }
    } catch (error) {
      console.warn('[SystemPrompt] Failed to restore state', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = {
      mode: systemPromptMode,
      global: globalSystemPrompt,
      perModel: modelSystemPrompts
    }
    window.localStorage.setItem(SYSTEM_PROMPT_KEY, JSON.stringify(payload))
  }, [systemPromptMode, globalSystemPrompt, modelSystemPrompts])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_KEY, language)
    }
  }, [language])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_KEY, theme)
    const root = window.document?.documentElement
    if (!root) return
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    setSupportsDeepThinking(isDeepThinkingSupported())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DEEP_THINKING_KEY, isDeepThinking ? 'true' : 'false')
  }, [isDeepThinking])

  useEffect(() => {
    if (!isDeepThinkingAvailable && isDeepThinking) {
      setIsDeepThinking(false)
      toast.info(
        translate('toasts.deepThinkingUnsupported', 'This model does not support deep thinking mode.')
      )
    }
  }, [isDeepThinkingAvailable, isDeepThinking, translate])

  const handleScrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    setIsScrolledToBottom(true)
  }, [])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 120
      const atBottom = scrollHeight - (scrollTop + clientHeight) <= threshold
      setIsScrolledToBottom(atBottom)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCopyMessage = useCallback(
    async (content) => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        toast.error(translate('toasts.failedToCopy', 'Failed to copy message.'))
        return
      }
      if (typeof content !== 'string' || content.trim().length === 0) {
        toast.error(translate('toasts.failedToCopy', 'Failed to copy message.'))
        return
      }
      const clipboard = navigator.clipboard
      if (!clipboard || typeof clipboard.writeText !== 'function') {
        toast.error(translate('toasts.failedToCopy', 'Failed to copy message.'))
        return
      }
      try {
        await clipboard.writeText(content)
        toast.success(translate('toasts.messageCopied', 'Message copied to clipboard.'))
      } catch (error) {
        console.error('Failed to copy message', error)
        toast.error(translate('toasts.failedToCopy', 'Failed to copy message.'))
      }
    },
    [translate]
  )

  const messageCount = currentConversation?.messages?.length ?? 0

  useEffect(() => {
    if (!isScrolledToBottom) return
    handleScrollToBottom()
  }, [handleScrollToBottom, isScrolledToBottom, messageCount])

  useEffect(() => {
    handleScrollToBottom()
  }, [handleScrollToBottom, currentConversationId])

  const [newModelName, setNewModelName] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const requestControllerRef = useRef(null)

  const availableProviders = useMemo(() => Object.keys(PROVIDERS), [])

  const availableModels = useMemo(() => {
    const defaults = PROVIDERS[modelConfig.provider]?.models ?? []
    const customs = customModels[modelConfig.provider] ?? []
    return Array.from(new Set([...defaults, ...customs])).filter(Boolean)
  }, [modelConfig.provider, customModels])

  const configuredModelOptions = useMemo(() => {
    const configured = savedProviderConfigs[modelConfig.provider]?.models ?? {}
    const configuredNames = Object.entries(configured)
      .filter(([, settings]) => settings?.apiKey && settings.apiKey.trim())
      .map(([name]) => name)
    return configuredNames
  }, [modelConfig.provider, savedProviderConfigs])

  const quickModelOptions = useMemo(() => {
    if (configuredModelOptions.length === 0) return []
    if (configuredModelOptions.includes(modelConfig.model)) {
      return configuredModelOptions
    }
    return modelConfig.model ? [modelConfig.model, ...configuredModelOptions] : configuredModelOptions
  }, [configuredModelOptions, modelConfig.model])

  const isDeepThinkingAvailable = useMemo(
    () =>
      supportsDeepThinking &&
      DEEP_THINKING_SUPPORTED_PROVIDERS.has(modelConfig.provider),
    [supportsDeepThinking, modelConfig.provider]
  )

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'zh' : 'en'))
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleToggleDeepThinking = useCallback(() => {
    if (!isDeepThinkingAvailable) {
      toast.info(
        translate('toasts.deepThinkingUnsupported', 'This model does not support deep thinking mode.')
      )
      return
    }
    setIsDeepThinking(prev => !prev)
  }, [isDeepThinkingAvailable, translate])

  const handleAttachmentSelection = useCallback(
    async (filesInput, categoryOverride) => {
      const files = Array.from(filesInput ?? []).filter(file => {
        if (!file) return false
        if (categoryOverride === 'image') {
          if (typeof file.type === 'string' && file.type) {
            return file.type.startsWith('image/')
          }
          return true
        }
        return true
      })
      if (!files.length) return
      try {
        const processed = await Promise.all(
          files.map(async (file) => {
            const type = typeof file.type === 'string' ? file.type : ''
            const category =
              categoryOverride ?? (type.startsWith('image/') ? 'image' : 'file')
            const dataUrl = await readFileAsDataUrl(file)
            return {
              id: createAttachmentId(),
              name: file.name || (category === 'image' ? 'image.png' : 'attachment'),
              size: file.size,
              type,
              dataUrl,
              lastModified: file.lastModified,
              category
            }
          })
        )
        setPendingAttachments(prev => {
          const existingKeys = new Set(
            prev.map(item => `${item.name}-${item.size}-${item.type}-${item.dataUrl.slice(0, 48)}`)
          )
          const unique = processed.filter(item => {
            if (!item) return false
            const key = `${item.name}-${item.size}-${item.type}-${item.dataUrl.slice(0, 48)}`
            if (existingKeys.has(key)) {
              return false
            }
            existingKeys.add(key)
            return true
          })
          return [...prev, ...unique]
        })
      } catch (error) {
        console.error('[Attachments] Failed to read file', error)
        toast.error(translate('toasts.attachmentReadFailed'))
      }
    },
    [translate]
  )

  const handleAttachmentInputChange = useCallback(
    async (event) => {
      const input = event.currentTarget ?? event.target
      const files = input?.files
      if (files?.length) {
        await handleAttachmentSelection(files, 'file')
      }
      if (input) {
        input.value = ''
      }
    },
    [handleAttachmentSelection]
  )

  const handleImageInputChange = useCallback(
    async (event) => {
      const input = event.currentTarget ?? event.target
      const files = input?.files
      if (files?.length) {
        await handleAttachmentSelection(files, 'image')
      }
      if (input) {
        input.value = ''
      }
    },
    [handleAttachmentSelection]
  )

  const handleUploadAttachmentClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUploadClick = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleRemoveAttachment = useCallback((attachmentId) => {
    setPendingAttachments(prev => prev.filter(item => item.id !== attachmentId))
  }, [])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((event) => {
    event.preventDefault()
    const related = event.relatedTarget
    if (related && event.currentTarget.contains(related)) {
      return
    }
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback(
    async (event) => {
      event.preventDefault()
      setIsDragActive(false)
      const files = event.dataTransfer?.files
      if (!files?.length) return
      await handleAttachmentSelection(files)
    },
    [handleAttachmentSelection]
  )

  const handlePaste = useCallback(
    (event) => {
      const files = event.clipboardData?.files
      if (!files?.length) return
      const pastedText = event.clipboardData?.getData('text')
      if (!pastedText) {
        event.preventDefault()
      }
      handleAttachmentSelection(files)
    },
    [handleAttachmentSelection]
  )

  const handleSaveConfiguration = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!hasUnsavedChanges) return
    try {
      const nextSavedConfigs = {
        ...savedProviderConfigs,
        [modelConfig.provider]: stripProvider(modelConfig)
      }
      const payload = {
        lastProvider: modelConfig.provider,
        providers: nextSavedConfigs,
        configs: nextSavedConfigs
      }
      window.localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(payload))
      window.localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels))
      setSavedProviderConfigs(nextSavedConfigs)
      setSavedCustomModels(customModels)
      draftsRef.current[modelConfig.provider] = stripProvider(modelConfig)
      setDraftFingerprint(JSON.stringify(draftsRef.current))
      toast.success(translate('toasts.configSaved'))
    } catch (error) {
      console.error(error)
      toast.error(translate('toasts.configSaveFailed'))
    }
  }, [
    customModels,
    hasUnsavedChanges,
    modelConfig,
    savedProviderConfigs,
    stripProvider,
    translate
  ])

  const languageToggleLabel =
    language === 'en'
      ? getTranslationValue('zh', 'toggles.languageShortChinese') ?? '涓枃'
      : getTranslationValue('en', 'toggles.languageShortEnglish') ?? 'EN'

  const isDarkMode = theme === 'dark'

  useEffect(() => {
    if (modelConfig.provider === 'volcengine') return
    if (!availableModels.length) return
    if (!availableModels.includes(modelConfig.model)) {
      setModelConfig(prev => ({
        ...prev,
        model: availableModels[0]
      }))
    }
  }, [availableModels, modelConfig.model, modelConfig.provider])

  const handleProviderChange = (event) => {
    const nextProvider = event.target.value
    if (nextProvider === modelConfig.provider) return
    const nextConfig = resolveProviderConfig(nextProvider)
    setModelConfig(nextConfig)
    setNewModelName('')
  }

  const handleAddCustomModel = () => {
    const trimmed = newModelName.trim()
    if (!trimmed) return
    const provider = modelConfig.provider
    const existing = availableModels
    if (existing.includes(trimmed)) {
      setModelConfig(prev => ({ ...prev, model: trimmed }))
      setNewModelName('')
      return
    }
    setCustomModels(prev => ({
      ...prev,
      [provider]: [...(prev[provider] ?? []), trimmed]
    }))
    setModelConfig(prev => ({ ...prev, model: trimmed }))
    setNewModelName('')
  }

  const handleRemoveCustomModel = (provider, model) => {
    setCustomModels(prev => {
      const existing = prev[provider] ?? []
      if (!existing.includes(model)) return prev
      const filtered = existing.filter(item => item !== model)
      const next = { ...prev }
      if (filtered.length) {
        next[provider] = filtered
      } else {
        delete next[provider]
      }
      if (provider === modelConfig.provider && modelConfig.model === model) {
        const fallback = getDefaultModel(provider, next)
        setModelConfig(prevConfig => ({
          ...prevConfig,
          model: fallback
        }))
      }
      return next
    })
  }

  const handleStopGenerating = () => {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    setIsTyping(false)
    if (!currentConversation) return
    const conversationId = currentConversation.id
    const pending = [...(currentConversation.messages ?? [])]
      .reverse()
      .find(msg => msg.role === 'assistant' && msg.status === 'loading')
    if (pending) {
      updateMessage(conversationId, pending.id, () => ({
        status: 'error',
        content: translate('toasts.generationCancelled')
      }))
    }
    toast.info(translate('toasts.generationStopped'))
  }

  const handleSendMessage = async () => {
    if (isTyping) return
    const messageContent = inputMessage.trim()
    const attachmentsPayload = pendingAttachments.map(attachment => ({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      dataUrl: attachment.dataUrl,
      lastModified: attachment.lastModified,
      category: attachment.category
    }))
    if (!messageContent && attachmentsPayload.length === 0) return

    const conversation = currentConversation ?? conversations[0]
    if (!conversation) {
      addConversation()
      return
    }
    const conversationId = conversation.id

    const userMessage = appendMessage(conversationId, {
      role: 'user',
      content: messageContent,
      status: 'done',
      attachments: attachmentsPayload,
      metadata: {
        deepThinking: isDeepThinking
      }
    })

    const placeholder = appendMessage(conversationId, {
      id: conversationUtils.createMessage({ role: 'assistant' }).id,
      role: 'assistant',
      content: '',
      status: 'loading'
    })

    setInputMessage('')
    setPendingAttachments([])
    setIsTyping(true)

    const controller = new AbortController()
    requestControllerRef.current = controller

    const supportsStreaming = STREAMING_CAPABLE_PROVIDERS.has(modelConfig.provider)
    try {
      let latestContent = ''
      let latestReasoning = ''
      const runtimeModelConfig = {
        ...modelConfig,
        deepThinking: isDeepThinking
      }
      const response = await generateAIResponse({
        messages: [...(conversation.messages ?? []), userMessage],
        modelConfig: runtimeModelConfig,
        signal: controller.signal,
        systemPrompt: {
          mode: systemPromptMode,
          prompt: globalSystemPrompt,
          prompts: modelSystemPrompts
        },
        onToken: supportsStreaming
          ? (delta, fullText) => {
              if (isDeepThinking) {
                const segments = extractReasoningSegments(fullText) ?? { answer: fullText, reasoning: '' }
                latestContent = segments.answer
                if (segments.reasoning) {
                  latestReasoning = segments.reasoning
                }
              } else {
                latestContent = fullText
              }
              updateMessage(conversationId, placeholder.id, () => ({
                content: isDeepThinking ? latestContent : fullText,
                status: 'loading'
              }))
            }
          : undefined
      })

      const finalContent = (response?.content ?? latestContent ?? '').trim()
      if (finalContent) {
        const reasoningText = isDeepThinking
          ? response?.reasoning ?? (latestReasoning || null)
          : null
        const metadata = { raw: response?.raw }
        if (isDeepThinking) {
          metadata.deepThinking = true
          if (reasoningText) {
            metadata.reasoning = reasoningText
          }
        }
        updateMessage(conversationId, placeholder.id, () => ({
          content: finalContent,
          status: 'done',
          metadata
        }))
      } else {
        const fallback = translate('toasts.noContent')
        updateMessage(conversationId, placeholder.id, () => ({
          content: fallback,
          status: 'error',
          metadata: { raw: response?.raw }
        }))
        toast.warning(fallback)
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.error(error)
      const fallbackMessage = translate('toasts.failedToGenerate')
      const message =
        typeof error?.message === 'string' && error.message.trim()
          ? error.message
          : fallbackMessage
      toast.error(message)
      updateMessage(conversationId, placeholder.id, () => ({
        content: message,
        status: 'error'
      }))
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsTyping(false)
    }
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" richColors />

      <aside className="sidebar">
        <div className="sidebar-header">
          <Button className="new-chat-btn" onClick={() => addConversation()}>
            <Plus className="w-4 h-4" />
            <span>{translate('buttons.newConversation')}</span>
          </Button>
        </div>

        <div className="conversation-list">
          {conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentConversationId}
              onSelect={() => selectConversation(conv.id)}
              onRename={renameConversation}
              onDelete={(id, title) => {
                const shouldDelete = window.confirm(
                  translate('toasts.confirmDeleteConversation') ??
                    `Delete conversation "${title || id}"?`
                )
                if (shouldDelete) {
                  removeConversation(id)
                }
              }}
            />
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-actions-group">
            <Button
              variant="ghost"
              size="icon"
              className="theme-toggle"
              onClick={clearAllConversations}
              title={translate('tooltips.clearConversations')}
              aria-label={translate('tooltips.clearConversations')}
            >
              <Trash className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="language-toggle"
              onClick={toggleLanguage}
              title={translate('tooltips.toggleLanguage')}
              aria-label={translate('tooltips.toggleLanguage')}
            >
              <Languages className="w-4 h-4" />
              <span>{languageToggleLabel}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="theme-toggle"
              onClick={toggleTheme}
              title={translate('tooltips.toggleTheme')}
              aria-label={translate('tooltips.toggleTheme')}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="theme-toggle"
            onClick={() => setShowConfig(prev => !prev)}
            title={translate('tooltips.openSettings')}
            aria-label={translate('tooltips.openSettings')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </aside>

      <main className="chat-area">
        <div className="chat-header">
          <div className="chat-header-slot" aria-hidden="true" />
          <h2 className="chat-title" title={currentConversation?.title}>
            {currentConversation?.title ?? translate('headings.conversation')}
          </h2>
            <div className="chat-actions" aria-hidden="true" />
        </div>

        <div className="messages-wrapper">
          <div
            className="messages-container"
            ref={messagesContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {(currentConversation?.messages ?? []).map((message) => {
              const isUser = message.role === 'user'
              const canCopyMessage =
                typeof message.content === 'string' && message.content.trim().length > 0
              const copyLabel = translate('tooltips.copyMessage', 'Copy message')
              return (
                <div
                  key={message.id}
                  className={`message ${isUser ? 'message-user' : 'message-ai'}`}
                >
                  <div
                    className={`message-content ${
                      isUser ? 'message-content-user' : 'message-content-ai'
                    } ${message.status === 'error' ? 'message-error' : ''} ${
                      canCopyMessage ? 'has-copy-button' : ''
                    }`}
                  >
                    {canCopyMessage ? (
                      <button
                        type="button"
                        className="message-copy-button"
                        onClick={() => handleCopyMessage(message.content)}
                        aria-label={copyLabel}
                        title={copyLabel}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    ) : null}
                    <MarkdownRenderer
                      content={message.content || (message.status === 'loading' ? '...' : '')}
                      isStreaming={message.status === 'loading'}
                    />
                    {message.metadata?.reasoning && (
                      <details className="reasoning-block">
                        <summary>{translate('sections.reasoning')}</summary>
                        <MarkdownRenderer content={message.metadata.reasoning} />
                      </details>
                    )}
                    {message.metadata?.deepThinking && (
                      <div className="deep-thinking-badge">
                        <BrainCircuit className="w-4 h-4" />
                        <span>{translate('toggles.deepThinkingOn')}</span>
                      </div>
                    )}
                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map(attachment => {
                          const isImageAttachment =
                            attachment.category === 'image' && attachment.dataUrl
                          return (
                            <div
                              key={attachment.id ?? `${attachment.name}-${attachment.size}-${attachment.type}`}
                              className={`attachment-item${isImageAttachment ? ' attachment-item-image' : ''}`}
                            >
                              <div className="attachment-preview">
                                {isImageAttachment ? (
                                  <img
                                    src={attachment.dataUrl}
                                    alt={attachment.name || translate('buttons.addImage')}
                                  />
                                ) : (
                                  <Paperclip className="attachment-icon" />
                                )}
                              </div>
                              {!isImageAttachment && (
                                <div className="attachment-details">
                                  <div className="attachment-name">
                                    {attachment.name || translate('buttons.uploadAttachment')}
                                  </div>
                                  <div className="attachment-meta">
                                    {formatFileSize(attachment.size)}
                                    {attachment.type ? ` | ${attachment.type}` : ''}
                                  </div>
                                </div>
                              )}
                              {attachment.dataUrl ? (
                                <a
                                  className={`attachment-download${isImageAttachment ? ' attachment-download-overlay' : ''}`}
                                  href={attachment.dataUrl}
                                  download={attachment.name || 'attachment'}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={translate('buttons.download')}
                                >
                                  <Download className="w-4 h-4" stroke="#1F2430" color="#1F2430" />
                                </a>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {!isScrolledToBottom && (
            <button
              type="button"
              className="scroll-to-bottom-btn"
              onClick={handleScrollToBottom}
              aria-label={translate('buttons.scrollToLatest', 'Scroll to latest messages')}
            >
              <ArrowDown className="w-4 h-4" />
              <span>{translate('buttons.scrollToLatest', 'Latest')}</span>
            </button>
          )}
        </div>

        <div
          className={`input-area ${isDragActive ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleAttachmentInputChange}
            style={{ display: 'none' }}
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageInputChange}
            style={{ display: 'none' }}
          />

          <div className="input-toolbar">
            <Button
              type="button"
              variant="ghost"
              className="toolbar-button"
              onClick={handleUploadAttachmentClick}
              title={translate('tooltips.uploadAttachment')}
              aria-label={translate('tooltips.uploadAttachment')}
            >
              <Paperclip className="w-4 h-4" />
              <span>{translate('buttons.uploadAttachment')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="toolbar-button"
              onClick={handleImageUploadClick}
              title={translate('tooltips.addImage')}
              aria-label={translate('tooltips.addImage')}
            >
              <ImagePlus className="w-4 h-4" />
              <span>{translate('buttons.addImage')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`toolbar-button ${
                isDeepThinking && isDeepThinkingAvailable ? 'toolbar-button-active' : ''
              }`}
              onClick={handleToggleDeepThinking}
              title={translate(
                isDeepThinkingAvailable
                  ? 'tooltips.toggleDeepThinking'
                  : 'toasts.deepThinkingUnsupported',
                isDeepThinkingAvailable
                  ? 'Toggle deep thinking mode'
                  : 'This model does not support deep thinking mode.'
              )}
              aria-label={translate(
                isDeepThinkingAvailable
                  ? 'tooltips.toggleDeepThinking'
                  : 'toasts.deepThinkingUnsupported',
                isDeepThinkingAvailable
                  ? 'Toggle deep thinking mode'
                  : 'This model does not support deep thinking mode.'
              )}
              aria-pressed={isDeepThinking}
              disabled={!isDeepThinkingAvailable}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>{translate(isDeepThinking ? 'toggles.deepThinkingOn' : 'toggles.deepThinkingOff')}</span>
            </Button>
            {modelConfig.apiKey?.trim() && quickModelOptions.length > 0 ? (
              <div className="toolbar-model-select">
                <label className="visually-hidden" htmlFor="quick-model-select">
                  {translate('labels.model')}
                </label>
                <select
                  id="quick-model-select"
                  value={modelConfig.model}
                  onChange={(event) =>
                    setModelConfig(prev => ({ ...prev, model: event.target.value }))
                  }
                  className="toolbar-model-dropdown"
                >
                  {quickModelOptions.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {pendingAttachments.length > 0 && (
            <div className="pending-attachments">
              {pendingAttachments.map(attachment => (
                <div key={attachment.id} className="pending-attachment">
                  <div className="pending-attachment-preview">
                    {attachment.category === 'image' && attachment.dataUrl ? (
                      <img src={attachment.dataUrl} alt={attachment.name || translate('buttons.addImage')} />
                    ) : (
                      <Paperclip className="attachment-icon" />
                    )}
                  </div>
                  <div className="pending-attachment-info">
                    <span className="pending-attachment-name">{attachment.name}</span>
                    <span className="pending-attachment-size">{formatFileSize(attachment.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="pending-attachment-remove"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    title={translate('tooltips.removeAttachment')}
                    aria-label={translate('tooltips.removeAttachment')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="input-container">
            <input
              type="text"
              className="message-input"
              placeholder={translate('placeholders.messageInput')}
              value={inputMessage}
              onPaste={handlePaste}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSendMessage()
                }
              }}
            />

            <Button
              onClick={isTyping ? handleStopGenerating : handleSendMessage}
              size="icon"
              className={isTyping ? 'stop-button' : 'send-button'}
              variant={isTyping ? 'ghost' : 'default'}
              disabled={!isTyping && inputMessage.trim().length === 0 && pendingAttachments.length === 0}
              title={translate(isTyping ? 'tooltips.stopGenerating' : 'buttons.send')}
              aria-label={translate(isTyping ? 'tooltips.stopGenerating' : 'buttons.send')}
            >
              {isTyping ? <CircleStop className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </main>

      <aside className={`config-panel ${showConfig ? 'open' : ''}`}>
        <div className="config-header">
          <h3 className="text-lg font-semibold">
            {translate('headings.modelConfiguration')}
          </h3>
        </div>

        <div className="config-content">
          <div className="config-section">
            <label className="config-label">{translate('labels.provider')}</label>
            <select
              value={modelConfig.provider}
              onChange={handleProviderChange}
              className="config-select"
            >
              {availableProviders.map(provider => (
                <option key={provider} value={provider}>
                  {translate(
                    `providers.${provider}`,
                    PROVIDERS[provider]?.label ?? provider
                  )}
                </option>
              ))}
            </select>
          </div>

          {modelConfig.provider === 'volcengine' ? (
            <div className="config-section">
              <label className="config-label">{translate('labels.modelId')}</label>
              <input
                className="config-input"
                type="text"
                value={modelConfig.model}
                onChange={(event) =>
                  setModelConfig(prev => ({ ...prev, model: event.target.value }))
                }
              />
            </div>
          ) : (
            <div className="config-section">
              <label className="config-label">{translate('labels.model')}</label>
              <select
                value={modelConfig.model}
                onChange={(event) =>
                  setModelConfig(prev => ({ ...prev, model: event.target.value }))
                }
                className="config-select"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <div className="custom-models-field">
                <input
                  type="text"
                  className="config-input"
                  placeholder={translate('placeholders.customModel')}
                  value={newModelName}
                  onChange={(event) => setNewModelName(event.target.value)}
                />
                <Button type="button" onClick={handleAddCustomModel}>
                  {translate('buttons.add')}
                </Button>
              </div>
              {(customModels[modelConfig.provider] ?? []).length > 0 && (
                <div className="custom-models-list">
                  {(customModels[modelConfig.provider] ?? []).map(model => (
                    <span key={model} className="custom-model-pill">
                      {model}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomModel(modelConfig.provider, model)}
                      >
                        脳
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="config-section">
            <label className="config-label">{translate('labels.apiKey')}</label>
            <input
              className="config-input"
              type="password"
              value={modelConfig.apiKey}
              onChange={(event) =>
                setModelConfig(prev => ({ ...prev, apiKey: event.target.value }))
              }
            />
          </div>

          <div className="config-section">
            <div className="config-slider-row">
              <label className="config-label" htmlFor="temperature-slider">
                {translate('labels.temperature')}
              </label>
              <span className="config-slider-value">{modelConfig.temperature.toFixed(1)}</span>
            </div>
            <input
              className="config-slider"
              id="temperature-slider"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={modelConfig.temperature}
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={modelConfig.temperature}
              aria-valuetext={modelConfig.temperature.toFixed(1)}
              aria-label={translate('labels.temperature')}
              onChange={(event) =>
                setModelConfig(prev => ({
                  ...prev,
                  temperature: Number(event.target.value)
                }))
              }
            />
          </div>

          <div className="config-section">
            <label className="config-label">{translate('labels.maxTokens')}</label>
            <input
              className="config-input"
              type="number"
              min={1}
              value={modelConfig.maxTokens}
              onChange={(event) =>
                setModelConfig(prev => ({
                  ...prev,
                  maxTokens: Number(event.target.value)
                }))
              }
            />
          </div>

          <div className="config-section">
            <h4 className="config-subheading">{translate('sections.systemPrompt')}</h4>
            <div className="system-prompt-mode">
              <label className="system-prompt-radio">
                <input
                  type="radio"
                  name="system-prompt-mode"
                  value="global"
                  checked={systemPromptMode === 'global'}
                  onChange={() => setSystemPromptMode('global')}
                />
                <span>{translate('sections.systemPrompt')} - Global</span>
              </label>
              <label className="system-prompt-radio">
                <input
                  type="radio"
                  name="system-prompt-mode"
                  value="per-model"
                  checked={systemPromptMode === 'per-model'}
                  onChange={() => setSystemPromptMode('per-model')}
                />
                <span>{translate('sections.systemPrompt')} - Per model</span>
              </label>
            </div>

            {systemPromptMode === 'global' ? (
              <textarea
                className="config-textarea"
                rows={4}
                value={globalSystemPrompt}
                onChange={(event) => setGlobalSystemPrompt(event.target.value)}
                placeholder="Enter system prompt applied to all models"
              />
            ) : (
              <div className="per-model-prompt-list">
                {Object.entries(savedProviderConfigs).flatMap(([providerId, data]) => {
                  const configuredModels = Object.keys(data?.models ?? {})
                  return configuredModels.map(modelName => {
                    const key = `${providerId}:${modelName}`
                    return (
                      <div key={key} className="per-model-item">
                        <div className="per-model-label">
                          <span>{providerId}</span>
                          <span>·</span>
                          <span>{modelName}</span>
                        </div>
                        <textarea
                          className="config-textarea"
                          rows={3}
                          value={modelSystemPrompts[key] ?? ''}
                          onChange={(event) =>
                            setModelSystemPrompts(prev => ({
                              ...prev,
                              [key]: event.target.value
                            }))
                          }
                          placeholder="System prompt for this model"
                        />
                      </div>
                    )
                  })
                })}
                {Object.values(savedProviderConfigs).every(config => !Object.keys(config?.models ?? {}).length) && (
                  <p className="config-helper">No configured models available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="config-footer">
          <Button
            type="button"
            className="save-config-button"
            onClick={handleSaveConfiguration}
            disabled={!hasUnsavedChanges}
          >
            {translate('buttons.save')}
          </Button>
        </div>
      </aside>
    </div>
  )
}

export default App

