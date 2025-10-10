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
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  deepseek: {
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions'
  },
  moonshot: {
    label: 'Moonshot',
    endpoint: 'https://api.moonshot.ai/v1/chat/completions'
  },
  groq: {
    label: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  mistral: {
    label: 'Mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions'
  },
  together: {
    label: 'Together AI',
    endpoint: 'https://api.together.xyz/v1/chat/completions'
  },
  anthropic: {
    label: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  google: {
    label: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta'
  },
  volcengine: {
    label: 'Volcano Engine',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
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
    settings: {
      title: 'Settings',
      tabs: {
        model: 'Model Configuration',
        appearance: 'Appearance',
        language: 'Language',
        profile: 'User Profile',
        about: 'About'
      },
      appearance: {
        title: 'Theme',
        description: 'Choose your preferred color theme',
        light: 'Light',
        dark: 'Dark'
      },
      language: {
        title: 'Language',
        description: 'Choose your preferred language'
      },
      profile: {
        title: 'User Profile',
        description: 'Manage your user profile and preferences',
        comingSoon: 'User profile features coming soon'
      },
      about: {
        title: 'About',
        appName: 'Application Name',
        version: 'Version',
        description: 'Description',
        descriptionText: 'A multi-model AI chat application supporting various AI providers',
        repository: 'Repository'
      }
    },
    confirms: {
      deleteMessage: 'Are you sure you want to delete this message?',
      deleteConversation: 'Are you sure you want to delete the conversation "{title}"?',
      clearAllConversations: 'Are you sure you want to clear all conversations?',
      confirmButton: 'Confirm',
      cancelButton: 'Cancel'
    },
    dataMigration: {
      migrating: 'Migrating data...',
      migrationFailed: 'Data migration failed. Please refresh the page and try again.',
      migrationError: 'Data migration error. Please refresh the page and try again.'
    },
    config: {
      modelInputHint: 'Enter model ID directly or click recommended items below.',
      deleteModel: 'Delete this model',
      viewComparison: 'View comparison',
      unlimitedHint: 'Leave empty for unlimited',
      unlimited: 'Unlimited',
      setUnlimited: 'Set to unlimited (use model maximum)',
      currentUnlimited: 'Current: Unlimited (using model maximum output tokens)',
      alreadyUnlimited: 'Already set to unlimited, will use model maximum output tokens'
    },
    systemPrompt: {
      description: 'System prompt defines the role and behavior of the model',
      mode: 'Application Mode',
      modeNone: 'Not Used',
      modeGlobal: 'Global',
      modeSpecific: 'Specific Models',
      globalPrompt: 'Global Prompt (applies to all models)',
      globalPromptPlaceholder: 'Enter system prompt...',
      clear: 'Clear',
      globalPromptSet: 'Global prompt is currently set',
      addModelPrompt: 'Add Model Prompt',
      addModelFirst: 'Please add models above before configuring model-specific prompts.',
      selectModels: 'Select models to apply (multiple selection allowed)',
      collapseAll: 'Collapse All',
      expandAll: 'Expand All',
      selectAll: 'Select/Deselect All',
      configuredModels: 'Configured Models',
      delete: 'Delete',
      globalPromptHelp: 'Global prompt applies to all model conversations, defining the role and behavior.',
      specificPromptHelp: 'Specific model prompts apply only to selected models, allowing different roles for different models.'
    },
    tokenInfo: {
      title: 'Token Settings Guide',
      gotIt: 'Got it'
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
    export: {
      title: 'Export Conversation',
      downloadFiles: 'Download Files',
      copyToClipboard: 'Copy to Clipboard',
      copying: 'Copying...',
      formats: {
        markdown: 'Markdown (.md)',
        text: 'Plain Text (.txt)',
        json: 'JSON (.json)',
        markdownFormat: 'Markdown Format',
        textFormat: 'Plain Text Format'
      }
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
    settings: {
      title: '设置',
      tabs: {
        model: '模型配置',
        appearance: '外观',
        language: '语言',
        profile: '用户资料',
        about: '关于'
      },
      appearance: {
        title: '主题',
        description: '选择您偏好的颜色主题',
        light: '浅色',
        dark: '深色'
      },
      language: {
        title: '语言',
        description: '选择您偏好的语言'
      },
      profile: {
        title: '用户资料',
        description: '管理您的用户资料和偏好设置',
        comingSoon: '用户资料功能即将推出'
      },
      about: {
        title: '关于',
        appName: '应用名称',
        version: '版本',
        description: '描述',
        descriptionText: '支持多种AI服务商的多模型AI聊天应用',
        repository: '代码仓库'
      }
    },
    confirms: {
      deleteMessage: '确定要删除这条消息吗？',
      deleteConversation: '确定要删除对话「{title}」吗？',
      clearAllConversations: '确定要清除所有对话吗？',
      confirmButton: '确定',
      cancelButton: '取消'
    },
    dataMigration: {
      migrating: '正在迁移数据...',
      migrationFailed: '数据迁移失败，请刷新页面重试。',
      migrationError: '数据迁移出错，请刷新页面重试。'
    },
    config: {
      modelInputHint: '直接输入模型 ID，或点击下方推荐项快速填入。',
      deleteModel: '删除此模型',
      viewComparison: '查看优劣势说明',
      unlimitedHint: '留空表示无限制',
      unlimited: '无限制',
      setUnlimited: '设置为无限制（使用模型最大值）',
      currentUnlimited: '当前：无限制（使用模型支持的最大输出Token数）',
      alreadyUnlimited: '已设置为无限制，将使用模型支持的最大输出Token数'
    },
    systemPrompt: {
      description: '系统提示词用于定义模型的角色和行为',
      mode: '应用模式',
      modeNone: '不使用',
      modeGlobal: '全局',
      modeSpecific: '指定模型',
      globalPrompt: '全局提示词（应用于所有模型）',
      globalPromptPlaceholder: '输入系统提示词...',
      clear: '清除',
      globalPromptSet: '当前已设置全局提示词',
      addModelPrompt: '添加模型提示词',
      addModelFirst: '请先在上方添加模型，然后才能配置指定模型的提示词。',
      selectModels: '选择要应用的模型（可多选）',
      collapseAll: '全部折叠',
      expandAll: '全部展开',
      selectAll: '全选/取消全选',
      configuredModels: '已配置的模型',
      delete: '删除',
      globalPromptHelp: '全局提示词将应用于所有模型的对话中，用于定义模型的角色和行为。',
      specificPromptHelp: '指定模型提示词只应用于选定的模型，可以为不同模型设置不同的角色。'
    },
    tokenInfo: {
      title: 'Token数设置说明',
      gotIt: '我知道了'
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
    export: {
      title: '导出对话',
      downloadFiles: '下载文件',
      copyToClipboard: '复制到剪贴板',
      copying: '复制中...',
      formats: {
        markdown: 'Markdown (.md)',
        text: '纯文本 (.txt)',
        json: 'JSON (.json)',
        markdownFormat: 'Markdown 格式',
        textFormat: '纯文本格式'
      }
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
  const customs = customModels[provider] ?? []
  return customs[0] ?? ''
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

