// Storage Keys
export const CUSTOM_MODELS_KEY = 'custom-models.v1'
export const MODEL_CONFIG_KEY = 'model-config.v1'
export const LANGUAGE_KEY = 'app-language.v1'
export const THEME_KEY = 'theme-preference.v1'
export const DEEP_THINKING_KEY = 'deep-thinking-mode.v1'
export const SYSTEM_PROMPT_KEY = 'system-prompt.v1'

// Defaults
export const FALLBACK_PROVIDER = 'openai'

// Providers Configuration
export const PROVIDERS = {
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
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest']
  },
  together: {
    label: 'Together AI',
    models: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3-8B-Instruct']
  },
  anthropic: {
    label: 'Anthropic',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
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

// Capabilities
export const STREAMING_CAPABLE_PROVIDERS = new Set([
  'openai',
  'deepseek',
  'moonshot',
  'groq',
  'mistral',
  'together',
  'anthropic',
  'google',
  'volcengine'
])

export const DEEP_THINKING_SUPPORTED_PROVIDERS = new Set(['openai'])

export const THIRD_PARTY_PROVIDERS = new Set([
  'openai',
  'deepseek',
  'moonshot',
  'groq',
  'mistral',
  'together',
  'anthropic',
  'google',
  'volcengine'
])

// Model Settings
export const DEFAULT_MODEL_SETTINGS = {
  apiKey: '',
  temperature: 0.7,
  maxTokens: 1024,
  supportsDeepThinking: false
}

// Translations
export const TRANSLATIONS = {
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
    confirms: {
      deleteMessage: 'Are you sure you want to delete this message?',
      deleteConversation: 'Are you sure you want to delete the conversation "{title}"?',
      clearAllConversations: 'Are you sure you want to clear all conversations?'
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
      messageEdited: 'Message edited successfully.',
      messageDeleted: 'Message deleted successfully.',
      messageRegenerating: 'Regenerating response...',
      deepThinkingUnsupported: 'This model does not support deep thinking mode.',
      exportSuccess: 'Conversation exported successfully.',
      exportFailed: 'Failed to export conversation.'
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
      copyMessage: 'Copy message',
      editMessage: 'Edit message',
      deleteMessage: 'Delete message',
      regenerate: 'Regenerate response',
      save: 'Save',
      cancel: 'Cancel'
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      export: 'Export'
    },
    toggles: {
      languageShortEnglish: 'EN',
      languageShortChinese: '中文',
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
      supportsDeepThinking: '支持深度思考',
      user: '你',
      assistant: '助手'
    },
    placeholders: {
      messageInput: '请输入消息...',
      customModel: '添加自定义模型'
    },
    hints: {
      supportsDeepThinking: '如果模型支持深度思考模式请启用此选项（例如 o1、o3-mini）'
    },
    sections: {
      reasoning: '思考过程',
      systemPrompt: '系统提示词'
    },
    confirms: {
      deleteMessage: '确定要删除这条消息吗？',
      deleteConversation: '确定要删除对话「{title}」吗？',
      clearAllConversations: '确定要清除所有对话吗？'
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
      messageEdited: '消息编辑成功。',
      messageDeleted: '消息删除成功。',
      messageRegenerating: '正在重新生成响应...',
      deepThinkingUnsupported: '该模型不支持深度思考模式。',
      exportSuccess: '对话导出成功。',
      exportFailed: '对话导出失败。'
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
      copyMessage: '复制消息',
      editMessage: '编辑消息',
      deleteMessage: '删除消息',
      regenerate: '重新生成响应',
      save: '保存',
      cancel: '取消'
    },
    actions: {
      save: '保存',
      cancel: '取消',
      export: '导出'
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

// Helper Functions
export function isDeepThinkingSupported() {
  if (typeof window === 'undefined') return false
  return !!window.ai
}

export function getDefaultModel(provider, customModels = {}) {
  const defaults = PROVIDERS[provider]?.models ?? []
  const customs = customModels[provider] ?? []
  return [...defaults, ...customs][0] ?? defaults[0] ?? 'gpt-4o-mini'
}

export function getTranslationValue(language, key) {
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

