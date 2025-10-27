// Storage Keys
export const CUSTOM_MODELS_KEY = 'custom-models.v1'
export const MODEL_CONFIG_KEY = 'model-config.v1'
export const LANGUAGE_KEY = 'app-language.v1'
export const THEME_KEY = 'theme-preference.v1'
export const DEEP_THINKING_KEY = 'deep-thinking-mode.v1'
export const SYSTEM_PROMPT_KEY = 'system-prompt.v1'

// Deep Thinking Modes
export const THINKING_MODE = {
  DISABLED: 'disabled',      // 不支持深度思考
  OPTIONAL: 'optional',      // 可选（支持开启/关闭）
  ALWAYS_ON: 'always-on',    // 强制开启（不可关闭）
  ADAPTIVE: 'adaptive'       // 自适应（模型自动判断）
}

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
  supportsDeepThinking: false,
  thinkingMode: THINKING_MODE.DISABLED  // 默认不支持
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
      supportsDeepThinking: 'Supports Deep Thinking',
      thinkingMode: 'Deep Thinking Mode',
      user: 'You',
      assistant: 'Assistant'
    },
    placeholders: {
      messageInput: 'Type a message...',
      customModel: 'Enter custom model'
    },
    hints: {
      supportsDeepThinking: 'Enable if model supports deep thinking mode (e.g. o1, o3-mini)',
      thinkingMode: 'Select how the model handles deep thinking mode'
    },
    thinkingMode: {
      disabled: 'Not Supported',
      optional: 'Optional (Can Toggle)',
      alwaysOn: 'Always On (Cannot Disable)',
      adaptive: 'Adaptive (Auto Decide)'
    },
    sections: {
      reasoning: 'Reasoning',
      thinkingProcess: 'Thinking Process',
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
        lightDesc: 'Bright and clean interface',
        dark: 'Dark',
        darkDesc: 'Easy on the eyes',
        auto: 'Auto',
        autoDesc: 'Follow system preference'
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
    agents: {
      title: 'AI Agents',
      subtitle: 'Manage and execute your intelligent agents',
      createAgent: 'Create Agent',
      searchPlaceholder: 'Search agents...',
      noAgents: 'No agents found',
      noAgentsDescription: 'Create your first AI agent to automate tasks and workflows',
      filters: {
        allStatus: 'All Status',
        active: 'Active',
        inactive: 'Inactive',
        busy: 'Busy',
        error: 'Error',
        capabilities: 'Capabilities',
        statusLabel: 'Status'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        idle: 'Idle',
        busy: 'Busy',
        running: 'Running',
        error: 'Error'
      },
      card: {
        untitledAgent: 'Untitled Agent',
        noDescription: 'No description available',
        openMenu: 'Open menu',
        status: 'Status',
        capabilities: 'Capabilities',
        more: 'more',
        totalRuns: 'Total Runs',
        successRate: 'Success Rate',
        avgDuration: 'Avg duration',
        lastRun: 'Last run'
      },
      toasts: {
        loadFailed: 'Failed to load agents',
        createSuccess: 'Agent created successfully',
        updateSuccess: 'Agent updated successfully',
        saveFailed: 'Failed to save agent',
        deleteSuccess: 'Agent deleted successfully',
        deleteFailed: 'Failed to delete agent',
        executeSuccess: 'Task execution started',
        executeFailed: 'Failed to execute task',
        stopInfo: 'Task execution stopped',
        stopFailed: 'Failed to stop task'
      },
      actions: {
        execute: 'Execute',
        edit: 'Edit',
        delete: 'Delete',
        viewDetails: 'View Details',
        viewHistory: 'View History'
      },
      selector: {
        loading: 'Loading...',
        select: 'Select Agent',
        availableAgents: 'Available Agents',
        noneAvailable: 'No agents available',
        clearSelection: 'Do not use Agent',
        refresh: 'Refresh list',
        loadFailed: 'Failed to load agents',
        statusUnknown: 'unknown'
      },
      editor: {
        fields: {
          mcpToggle: 'MCP Services'
        },
        mcp: {
          loading: 'Loading MCP tools...',
          noToolsTitle: 'No available MCP tools',
          noToolsHint: 'Please enable MCP Services in settings first',
          categories: {
            search: 'Search & Retrieval',
            file: 'File Operations',
            data: 'Data Processing',
            api: 'API & Network',
            automation: 'Automation',
            analysis: 'Analysis',
            other: 'Other'
          }
        }
      },
      batch: {
        missingSelection: 'Please select at least one agent and task',
        success: 'Batch executed successfully! {count} tasks submitted',
        failure: 'Batch execution failed! {count} tasks failed',
        partial: 'Partially completed: {success} succeeded, {failed} failed',
        error: 'Batch execution failed'
      },
      history: {
        detailsPlaceholder: 'Detailed view for "{name}" is coming soon.',
        exportSuccess: 'Execution history exported',
        exportFailed: 'Failed to export history',
        queue: {
          cancelSuccess: 'Queued task cancelled',
          cancelFailed: 'Failed to cancel task',
          priorityInvalid: 'Priority must be a number',
          prioritySuccess: 'Priority updated',
          priorityFailed: 'Failed to update priority'
        }
      }
    },
    mcp: {
      common: {
        operationFailed: 'Operation failed, please try again',
        addSuccess: 'MCP service added successfully!',
        loading: 'Loading service list...',
        loadFailedTitle: 'Load failed',
        toggleLabel: 'MCP Services',
        noToolsTitle: 'No available MCP tools',
        noToolsHint: 'Please enable MCP Services in settings first',
        badgeCustom: 'Custom',
        badgeNeedsConfig: 'Requires configuration',
        badgeConfigured: 'Configured',
        badgeFree: 'Free',
        badgeFreeNoConfig: 'No configuration required',
        badgeTools: '{count} tools'
      },
      servicesPanel: {
        intro: 'By enabling MCP services, your AI assistant can access real-time information including web search, weather queries, web scraping, and more.',
        stats: 'Enabled {enabled} / {total}',
        addButton: 'Add Service',
        filterAll: 'All ({count})',
        filterSystem: 'System ({count})',
        filterCustom: 'Custom ({count})',
        searchPlaceholder: 'Search services...',
        gridView: 'Card view',
        listView: 'List view',
        emptyTitle: 'No matching services',
        emptyHint: 'Try adjusting filters or search keywords'
      },
      addDialog: {
        title: 'Add MCP Service',
        subtitle: 'Choose from templates or configure your own service',
        tabTemplates: 'From Template',
        tabCustom: 'Custom Configuration',
        categoryAll: 'All',
        searchPlaceholder: 'Search services...',
        envConfigTitle: 'Environment Variables',
        setupInstructions: 'Setup Instructions',
        viewDocs: 'View documentation',
        cancel: 'Cancel',
        confirmAdd: 'Confirm Add',
        loadingAdd: 'Adding...',
        templateSuccess: 'MCP service added successfully!',
        customSuccess: 'Custom MCP service created successfully!',
        noTemplates: 'No matching service templates',
        templateButton: 'Add',
        popularity: {
          high: 'Popular',
          medium: 'Recommended',
          low: 'Less used'
        },
        officialBadge: 'Official',
        requiredMark: '*',
        envPlaceholder: 'Enter {key}',
        configTitle: 'Configure {name}',
        configSubtitle: 'Fill in the required configuration to enable this service',
        customSectionTitle: 'Basic Information',
        customPlaceholders: {
          id: 'e.g. my-custom-service',
          name: 'e.g. My Custom Service',
          description: 'Describe what this service does...',
          icon: '🔧',
          command: 'e.g. npx, node, python',
          args: 'e.g. ["-y", "my-service"]',
          envVars: 'e.g. {"API_KEY": "value"}',
          features: 'e.g. ["Read files", "List directory"]'
        },
        customHints: {
          id: 'Must be unique, only letters, numbers, underscores, and hyphens',
          command: 'Command used to start the service',
          args: 'Must be a valid JSON array. Leave empty if no additional arguments are required.',
          envVars: 'Must be a valid JSON object. Leave empty if no environment variables are required.',
          features: 'Must be a valid JSON array.'
        },
        commandSectionTitle: 'Command Configuration',
        customLabels: {
          id: 'Service ID',
          name: 'Service Name',
          description: 'Service Description',
          category: 'Category',
          icon: 'Icon',
          command: 'Command',
          args: 'Arguments (JSON array)',
          envVars: 'Environment variables (JSON object)',
          features: 'Feature descriptions (JSON array)'
        },
        customEnvTitle: 'Environment Variables (JSON object)',
        customFeaturesTitle: 'Feature List (optional)',
        customReset: 'Reset',
        customCreate: 'Create Service',
        customCreating: 'Creating...',
        error: 'Failed to add service',
        templateConfirm: 'Confirm',
        templateCancel: 'Cancel',
        errors: {
          required: 'Please fill in all required fields',
          argsMustArray: 'Arguments must be an array',
          argsInvalid: 'Invalid arguments JSON: {message}',
          envMustObject: 'Environment variables must be an object',
          envInvalid: 'Invalid environment variables JSON: {message}',
          featuresMustArray: 'Features must be an array',
          featuresInvalid: 'Invalid features JSON: {message}'
        }
      },
      configPanel: {
        intro: 'By enabling MCP services, your AI assistant can access real-time information including web search, weather data, web scraping, and more. All services are free to start.',
        toolsLabel: 'Tools',
        toggleLabel: 'MCP Services',
        loading: 'Loading MCP tools...',
        emptyTitle: 'No available MCP tools',
        emptyHint: 'Please enable MCP Services in settings first',
        copySuccess: 'Copied',
        saveSuccess: 'Saved successfully!',
        toggleButton: {
          expand: 'Configure API Key',
          collapse: 'Hide configuration'
        },
        actions: {
          save: 'Save',
          saving: 'Saving...',
          getKey: 'Get API Key'
        },
        tooltip: {
          show: 'Show',
          hide: 'Hide',
          copy: 'Copy'
        }
      },
      pathDialog: {
        sqliteLabel: 'Database file path',
        sqlitePlaceholder: '/path/to/database.db',
        sqliteHint: 'Enter the full path to the SQLite database file',
        filesystemLabel: 'Allowed directories',
        filesystemPlaceholder: '/path/to/directory',
        filesystemHint: 'Add directories that the filesystem service can access',
        addDirectory: 'Add',
        removeDirectory: 'Remove',
        cancel: 'Cancel',
        save: 'Save configuration',
        saving: 'Saving...',
        success: 'Configuration saved successfully! The service will take effect on the next restart.',
        loadError: 'Failed to load configuration'
      }
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
    config: {
      modelInputHint: 'Enter model ID directly or click recommended items below.',
      deleteModel: 'Delete this model',
      viewComparison: 'View comparison',
      unlimitedHint: 'Leave empty for unlimited',
      alreadyUnlimited: 'Already set to unlimited, will use model maximum output tokens',
      setUnlimited: 'Set to unlimited (use model maximum)',
      unlimited: 'Unlimited',
      currentUnlimited: 'Current: Unlimited (using model maximum output tokens)'
    },
    tokenInfo: {
      title: 'Token Settings Guide',
      gotIt: 'Got it'
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
    },
    agents: {
      title: 'AI Agents',
      subtitle: 'Manage and execute your intelligent agents',
      createAgent: 'Create Agent',
      noAgents: 'No agents found',
      noAgentsDescription: 'Create your first AI agent to automate tasks and workflows',
      searchPlaceholder: 'Search agents...',
      filters: {
        allStatus: 'All Status',
        active: 'Active',
        inactive: 'Inactive',
        busy: 'Busy',
        error: 'Error',
        capabilities: 'Capabilities',
        sortBy: 'Sort by',
        name: 'Name',
        lastRun: 'Last Run',
        successRate: 'Success Rate',
        totalRuns: 'Total Runs',
        filterBy: 'Filter by',
        noCapabilitiesFound: 'No capabilities found'
      },
      viewMode: {
        grid: 'Grid View',
        list: 'List View'
      },
      actions: {
        execute: 'Execute',
        edit: 'Edit',
        delete: 'Delete',
        viewDetails: 'View Details',
        viewHistory: 'View History',
        executeTask: 'Execute Task'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        idle: 'Idle',
        busy: 'Busy',
        running: 'Running',
        error: 'Error'
      },
      card: {
        status: 'Status',
        capabilities: 'Capabilities',
        more: 'more',
        totalRuns: 'Total Runs',
        successRate: 'Success Rate',
        lastRun: 'Last run',
        avgDuration: 'Avg duration',
        untitledAgent: 'Untitled Agent',
        noDescription: 'No description available',
        openMenu: 'Open menu'
      },
      dashboard: {
        totalExecutions: 'Total Executions',
        successRate: 'Success Rate',
        avgDuration: 'Avg Duration',
        recentTrend: 'Recent 7-day trend',
        completedVsTotal: 'Completed vs total'
      },
      editor: {
        createTitle: 'Create New Agent',
        editTitle: 'Edit Agent',
        subtitle: "Configure your AI agent's capabilities and behavior",
        tabs: {
          basic: 'Basic Info',
          capabilities: 'Capabilities',
          advanced: 'Advanced'
        },
        fields: {
          name: 'Name',
          nameRequired: 'Name is required',
          namePlaceholder: 'My AI Agent',
          description: 'Description',
          descriptionPlaceholder: 'Describe what your agent does...',
          descriptionHint: "A clear description helps you remember the agent's purpose",
          agentType: 'Agent Type',
          agentTypePlaceholder: 'Select agent type',
          selectedCapabilities: 'Selected Capabilities',
          noCapabilitiesSelected: 'No capabilities selected',
          availableCapabilities: 'Available Capabilities',
          customCapability: 'Custom Capability',
          customCapabilityPlaceholder: 'Enter custom capability...',
          tools: 'Tools',
          model: 'Model',
          temperature: 'Temperature',
          temperatureHint: 'Controls randomness. Lower is more focused, higher is more creative',
          maxTokens: 'Max Tokens',
          maxTokensHint: 'Maximum number of tokens to generate',
          systemPrompt: 'System Prompt',
          systemPromptPlaceholder: 'You are a helpful AI assistant...',
          systemPromptHint: "Custom instructions for the agent's behavior",
          autoRetry: 'Auto Retry',
          autoRetryHint: 'Automatically retry failed tasks',
          maxRetries: 'Max Retries'
        },
        types: {
          conversational: 'Conversational',
          taskBased: 'Task-Based',
          analytical: 'Analytical',
          creative: 'Creative'
        },
        capabilities: {
          textGeneration: 'Text Generation',
          codeAnalysis: 'Code Analysis',
          dataProcessing: 'Data Processing',
          webSearch: 'Web Search',
          fileOperations: 'File Operations',
          apiIntegration: 'API Integration',
          taskAutomation: 'Task Automation',
          knowledgeRetrieval: 'Knowledge Retrieval',
          imageAnalysis: 'Image Analysis',
          documentParsing: 'Document Parsing'
        },
        tools: {
          webSearch: 'web search',
          fileReader: 'file reader',
          codeExecutor: 'code executor',
          apiCaller: 'api caller',
          dataAnalyzer: 'data analyzer',
          imageProcessor: 'image processor'
        },
        buttons: {
          cancel: 'Cancel',
          create: 'Create Agent',
          save: 'Save Changes',
          saving: 'Saving...',
          addCapability: 'Add'
        },
        validation: {
          nameRequired: 'Name is required',
          capabilitiesRequired: 'At least one capability required'
        }
      },
      deleteConfirm: {
        title: 'Delete Agent',
        description: 'Are you sure you want to delete "{name}"? This action cannot be undone.'
      },
      executor: {
        title: 'Execute Task - {name}',
        description: 'Run tasks using your AI agent\'s capabilities',
        taskLabel: 'Task Description',
        taskPlaceholder: 'Describe the task you want the agent to perform...',
        progress: 'Progress',
        subtaskFallback: 'Subtask',
        buttons: {
          execute: 'Execute Task',
          stop: 'Stop Execution',
          retry: 'Retry Task',
          clear: 'Clear',
          retryNow: 'Retry Now',
          hideRaw: 'Hide Raw JSON',
          showRaw: 'View Raw JSON'
        },
        status: {
          idle: 'Idle',
          running: 'Running',
          completed: 'Completed',
          failed: 'Failed',
          stopped: 'Stopped',
          taskId: 'Task: {id}',
          executionId: 'Exec: {id}',
          durationSeconds: '{seconds}s'
        },
        result: {
          successTitle: 'Task Completed Successfully',
          tokens: 'Tokens: {usage}',
          failureTitle: 'Task Failed'
        },
        tabs: {
          subtasks: 'Subtasks ({count})',
          logs: 'Logs ({count})'
        },
        empty: {
          subtasks: 'No subtasks yet',
          logs: 'No logs yet'
        },
        logs: {
          connected: 'Connected to realtime task stream',
          disconnected: 'Realtime channel disconnected, switching to polling',
          currentStep: 'Current step: {step}',
          fetchSubtasksFailed: 'Failed to fetch subtasks: {message}',
          completed: 'Task execution completed',
          failed: 'Task execution failed',
          cancelled: 'Task execution cancelled',
          pollingFailed: 'Progress polling failed: {message}',
          start: 'Starting task execution for agent: {name}',
          retry: 'Retrying task execution for agent: {name}',
          taskLine: 'Task: {task}',
          sending: 'Sending task to agent...',
          queued: 'Execution queued (task {id})',
          executionStatus: 'Execution status: {status}',
          error: 'Error: {message}',
          stop: 'Task execution stopped by user',
          stopFailed: 'Failed to stop task: {message}',
          unknownError: 'Unknown error'
        },
        errors: {
          incompleteResponse: 'Task execution response is incomplete',
          executionFailed: 'Task execution failed'
        }
      },
      toasts: {
        createSuccess: 'Agent created successfully',
        updateSuccess: 'Agent updated successfully',
        deleteSuccess: 'Agent deleted successfully',
        executeSuccess: 'Task execution started',
        loadFailed: 'Failed to load agents',
        saveFailed: 'Failed to save agent',
        deleteFailed: 'Failed to delete agent',
        executeFailed: 'Failed to execute task'
      },
      activeFilters: 'Active filters:',
      agents: 'agents'
    },
    workflows: {
      title: 'Workflows',
      subtitle: 'Automate your tasks with intelligent workflows',
      createWorkflow: 'Create Workflow',
      noWorkflows: 'No workflows found',
      noWorkflowsDescription: 'Create your first workflow to automate repetitive tasks',
      searchPlaceholder: 'Search workflows...',
      import: 'Import',
      exportAll: 'Export All',
      showing: 'Showing {count} of {total} workflows',
      activeFilters: 'Active filters:',
      statusLabel: 'Status',
      filters: {
        allStatus: 'All Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        draft: 'Draft',
        active: 'Active',
        running: 'Running',
        paused: 'Paused',
        error: 'Error'
      },
      actions: {
        run: 'Run',
        edit: 'Edit',
        delete: 'Delete',
        enable: 'Enable',
        disable: 'Disable'
      },
      status: {
        enabled: 'Enabled',
        disabled: 'Disabled',
        draft: 'Draft',
        active: 'Active',
        running: 'Running',
        paused: 'Paused',
        error: 'Error'
      },
      sort: {
        name: 'Name',
        lastRun: 'Last Run',
        successRate: 'Success Rate',
        totalRuns: 'Total Runs'
      },
      toasts: {
        loadFailed: 'Failed to load workflows',
        editorComingSoon: 'Workflow editor coming soon! 🎨\n\nPhase 2.2 will include:\n- Visual workflow editor\n- Drag-and-drop nodes\n- Real-time execution',
        executing: 'Executing workflow...',
        executionStarted: 'Workflow execution started',
        executeFailed: 'Failed to execute workflow',
        editWorkflow: 'Edit workflow: {name}\n\nWorkflow editor coming in Phase 2.2! 🚧',
        deleteSuccess: 'Workflow deleted successfully',
        deleteFailed: 'Failed to delete workflow',
        duplicating: 'Duplicating workflow...',
        duplicateSuccess: 'Workflow duplicated successfully',
        duplicateFailed: 'Failed to duplicate workflow',
        workflowDetails: 'Workflow: {name}\n\nNodes: {nodes}\nStatus: {status}\n\nDetails view coming soon! 📊',
        importComingSoon: 'Import workflow feature coming soon! 📥\n\nSupported formats:\n- JSON\n- YAML',
        noWorkflowsToExport: 'No workflows to export',
        exportComingSoon: 'Export feature coming soon! 📤\n\nExport formats:\n- JSON\n- YAML\n- PNG (diagram)'
      },
      dialog: {
        deleteTitle: 'Delete Workflow',
        deleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
        cancel: 'Cancel',
        delete: 'Delete'
      },
      phaseInfo: {
        title: 'Workflow System - Phase 2 (40% Complete)',
        ready: '✅ Basic workflow management is ready',
        coming: '🚧 Visual workflow editor coming in Phase 2.2'
      }
    },
    knowledge: {
      title: 'Knowledge Base',
      subtitle: 'Manage your knowledge documents and files',
      addDocument: 'Add Document',
      noDocuments: 'No documents found',
      searchPlaceholder: 'Search knowledge base...',
      knowledgeBase: 'Knowledge Base',
      createKnowledgeBase: 'Create Knowledge Base',
      newKnowledgeBase: 'Create Knowledge Base',
      name: 'Knowledge Base Name',
      namePlaceholder: 'Enter knowledge base name',
      description: 'Description',
      descriptionPlaceholder: 'Enter knowledge base description (optional)',
      cancel: 'Cancel',
      create: 'Create',
      nameRequired: 'Knowledge base name is required',
      loadFailed: 'Failed to load knowledge base',
      createFailed: 'Failed to create knowledge base',
      deleteConfirm: 'Are you sure you want to delete this knowledge base? This will delete all related documents and data.',
      deleteFailed: 'Failed to delete knowledge base',
      loading: 'Loading...',
      noMatchingKB: 'No matching knowledge bases found',
      noKB: 'No knowledge bases yet',
      embeddingModel: 'Embedding Model',
      chunkSize: 'Chunk Size',
      retrievalCount: 'Retrieval Count',
      documents: '{count} documents',
      filters: {
        allTypes: 'All Types',
        document: 'Document',
        file: 'File',
        link: 'Link'
      }
    },
    personas: {
      title: 'Personas',
      subtitle: 'Customize AI personalities and behaviors',
      createPersona: 'Create Persona',
      noPersonas: 'No personas found',
      selectPersona: 'Select Persona',
      defaultPersona: 'Default',
      aiPersonas: 'AI Personas',
      createNewPersona: 'Create New Persona',
      searchPlaceholder: 'Search personas...',
      loadFailed: 'Failed to load personas',
      loading: 'Loading...',
      noMatchingPersonas: 'No matching personas found',
      noPersonasYet: 'No personas yet',
      createFirstPersona: 'Create First Persona',
      totalPersonas: 'Total {count} personas',
      averageRating: 'Average Rating: {rating}',
      totalUsage: 'Total Usage: {count}'
    },
    sidebar: {
      chat: 'Chat',
      explore: 'Explore',
      agents: 'AI Agents',
      workflows: 'Workflows',
      notes: 'Notes',
      documents: 'Documents',
      passwordVault: 'Password Vault',
      knowledge: 'Knowledge',
      analytics: 'Analytics',
      settings: 'Settings'
    },
    common: {
      loading: 'Loading...',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      showing: 'Showing {count} of {total}',
      noResults: 'No results found',
      tryAdjustingFilters: 'Try adjusting your filters or search query'
    },
    chat: {
      welcomeTitle: 'Hello, I am Personal Chatbox',
      welcomeMessage: 'Hope to have a pleasant chat with you...',
      programmingMode: 'Programming Mode',
      enableProgrammingMode: 'Enable Programming Mode',
      disableProgrammingMode: 'Disable Programming Mode'
    },
    commandPalette: {
      title: 'Command Palette',
      searchPlaceholder: 'Enter command name or / to search...',
      noCommandsFound: 'No matching commands found',
      tryOtherKeywords: 'Try other keywords',
      navigation: 'Navigate',
      select: 'Select',
      close: 'Close',
      commandsCount: '{count} commands',
      helpTitle: 'Quick Command Help',
      helpIntro: 'Use quick commands to execute common operations and improve efficiency.',
      helpTrigger: 'Type / at the beginning of the input to trigger commands',
      helpShortcut: 'Open command palette',
      aliases: 'Aliases',
      parameters: 'Parameters',
      shortcut: 'Shortcut',
      required: 'Required'
    },
    fileUpload: {
      dragHere: 'Drag files here or click to select',
      dropFiles: 'Drop files to upload',
      supportedFormats: 'Supports PDF, Word, Excel, CSV, PowerPoint, plain text files',
      maxSize: 'Max {size}, up to {count} files',
      uploading: 'Uploading...',
      uploadedFiles: 'Uploaded Files ({count})',
      maxFilesError: 'Maximum {count} files allowed',
      maxSizeError: 'File size cannot exceed {size}',
      uploadFailed: 'File upload failed',
      deleteFailed: 'Failed to delete file'
    },
    sidebar: {
      logout: 'Logout',
      logoutConfirm: 'Are you sure you want to logout?',
      conversations: 'Conversations',
      recentConversations: 'Recent Conversations',
      searchHistory: 'Search History...',
      clearHistory: 'Clear History',
      clearHistoryConfirm: 'Are you sure you want to clear all conversation history?',
      expandSidebar: 'Expand Sidebar',
      collapseSidebar: 'Collapse Sidebar',
      noConversations: 'No conversations yet',
      noSearchResults: 'No matching conversations found',
      clearFilters: 'Clear Filters',
      analytics: 'Analytics'
    },
    advancedFilter: {
      title: 'Advanced Filter',
      description: 'Use advanced filters to precisely search conversations',
      dateRange: 'Date Range',
      from: 'From',
      to: 'To',
      selectDate: 'Select date',
      model: 'Model',
      allModels: 'All Models',
      tags: 'Tags',
      sortBy: 'Sort By',
      sortOptions: 'Sort Options',
      sortDirection: 'Sort Direction',
      byDate: 'By Date',
      byRelevance: 'By Relevance',
      byMessages: 'By Messages',
      ascending: 'Ascending',
      descending: 'Descending',
      lastModified: 'Last Modified',
      created: 'Created',
      messageCount: 'Message Count',
      reset: 'Reset',
      apply: 'Apply Filter',
      today: 'Today',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      clearDate: 'Clear Date',
      activeFilters: 'Active Filters',
      dateRangeSet: 'Date range filter set',
      startDateSet: 'Start date filter set',
      endDateSet: 'End date filter set'
    },
    notes: {
      title: 'Notes',
      newNote: 'New Note',
      empty: 'No notes yet',
      emptyHint: 'Create your first note to get started',
      selectNote: 'Select a note to view',
      selectNoteHint: 'Or create a new note to get started',
      titlePlaceholder: 'Note Title...',
      contentPlaceholder: 'Start writing...',
      addTag: 'Add tag...',
      search: 'Search notes...',
      allCategories: 'All Categories',
      allTags: 'All Tags',
      favoritesOnly: 'Favorites Only',
      showArchived: 'Show Archived',
      sortUpdated: 'Last Updated',
      sortCreated: 'Created',
      sortTitle: 'Title',
      category: 'Category',
      updated: 'Updated',
      defaultCategory: 'Default',
      total: 'Total',
      favorites: 'Favorites',
      categories: 'Categories',
      export: 'Export',
      import: 'Import',
      shortcuts: 'Shortcuts',
      loadError: 'Failed to load notes',
      saveError: 'Failed to save note',
      deleteError: 'Failed to delete note',
      deleteConfirm: 'Are you sure you want to delete this note?',
      createSuccess: 'Note created',
      updateSuccess: 'Note updated',
      deleteSuccess: 'Note deleted',
      exportSuccess: 'Notes exported',
      exportError: 'Failed to export notes',
      importSuccess: 'Imported {count} notes',
      importError: 'Failed to import notes',
      favoriteError: 'Failed to update favorite'
    },
    analytics: {
      title: 'Analytics Dashboard',
      subtitle: 'Track your AI conversations and usage',
      overview: 'Overview',
      totalConversations: 'Total Conversations',
      totalMessages: 'Total Messages',
      totalTokens: 'Total Tokens',
      estimatedCost: 'Estimated Cost',
      avgMessagesPerConv: 'Avg Messages/Conversation',
      mostUsedModel: 'Most Used Model',
      conversationTrend: 'Conversation Trend',
      modelUsage: 'Model Usage Distribution',
      messageActivity: 'Message Activity',
      noData: 'No data available',
      loading: 'Loading analytics...',
      export: 'Export',
      period: {
        last24h: 'Last 24 Hours',
        last7d: 'Last 7 Days',
        last30d: 'Last 30 Days',
        last90d: 'Last 90 Days'
      },
      unavailable: 'Analytics Unavailable',
      unavailableMessage: 'The analytics feature has been temporarily disabled.',
      unavailableDetail: 'Backend route: /api/analytics is currently commented out.',
      featureStatus: 'Analytics Feature Status',
      featureStatusMessage: 'The detailed analytics feature is currently disabled on the backend. To re-enable, uncomment the analytics route in server/index.cjs and install the recharts package for visualizations.',
      chartsPlaceholder: 'Charts will appear here once analytics is enabled'
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
      thinkingMode: '深度思考模式',
      user: '你',
      assistant: '助手'
    },
    placeholders: {
      messageInput: '请输入消息...',
      customModel: '添加自定义模型'
    },
    hints: {
      supportsDeepThinking: '如果模型支持深度思考模式请启用此选项（例如 o1、o3-mini）',
      thinkingMode: '选择模型如何处理深度思考模式'
    },
    thinkingMode: {
      disabled: '不支持',
      optional: '可选（可切换）',
      alwaysOn: '强制开启（无法关闭）',
      adaptive: '自适应（自动判断）'
    },
    sections: {
      reasoning: '思考过程',
      thinkingProcess: '思考过程',
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
        lightDesc: '明亮简洁的界面',
        dark: '深色',
        darkDesc: '保护眼睛',
        auto: '自动',
        autoDesc: '跟随系统设置'
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
    agents: {
      title: 'AI Agents',
      subtitle: '管理和执行你的 AI Agent',
      createAgent: '新建 Agent',
      searchPlaceholder: '搜索 Agent...',
      noAgents: '暂无 Agent',
      noAgentsDescription: '创建你的第一个 AI Agent，用于自动化任务和工作流',
      filters: {
        allStatus: '全部状态',
        active: '运行中',
        inactive: '未启用',
        busy: '忙碌',
        error: '错误',
        capabilities: '能力筛选',
        statusLabel: '状态'
      },
      status: {
        active: '运行中',
        inactive: '未启用',
        idle: '空闲',
        busy: '忙碌',
        running: '执行中',
        error: '错误'
      },
      card: {
        untitledAgent: '未命名 Agent',
        noDescription: '暂无描述',
        openMenu: '打开菜单',
        status: '状态',
        capabilities: '能力',
        more: '更多',
        totalRuns: '总执行次数',
        successRate: '成功率',
        avgDuration: '平均时长',
        lastRun: '最近执行'
      },
      toasts: {
        loadFailed: '加载 Agent 列表失败',
        createSuccess: 'Agent 创建成功',
        updateSuccess: 'Agent 更新成功',
        saveFailed: 'Agent 保存失败',
        deleteSuccess: 'Agent 删除成功',
        deleteFailed: '删除 Agent 失败',
        executeSuccess: '任务已提交执行',
        executeFailed: '任务执行失败',
        stopInfo: '任务执行已停止',
        stopFailed: '停止任务失败'
      },
      actions: {
        execute: '执行',
        edit: '编辑',
        delete: '删除',
        viewDetails: '查看详情',
        viewHistory: '执行历史'
      },
      selector: {
        loading: '加载中...',
        select: '选择 Agent',
        availableAgents: '可用的 Agents',
        noneAvailable: '暂无可用的 Agent',
        clearSelection: '不使用 Agent',
        refresh: '刷新列表',
        loadFailed: '加载 Agent 列表失败',
        statusUnknown: '未知'
      },
      editor: {
        fields: {
          mcpToggle: 'MCP 服务'
        },
        mcp: {
          loading: '加载 MCP 工具中...',
          noToolsTitle: '暂无可用的 MCP 工具',
          noToolsHint: '请先在设置中启用 MCP Services',
          categories: {
            search: '搜索与检索',
            file: '文件操作',
            data: '数据处理',
            api: 'API 与网络',
            automation: '自动化',
            analysis: '分析',
            other: '其他'
          }
        }
      },
      batch: {
        missingSelection: '请选择至少一个 Agent 和任务',
        success: '批量执行成功！已提交 {count} 个任务',
        failure: '批量执行失败！{count} 个任务提交失败',
        partial: '部分成功：{success} 个成功，{failed} 个失败',
        error: '批量执行失败'
      },
      history: {
        detailsPlaceholder: 'Agent「{name}」的详细视图即将上线',
        exportSuccess: '执行历史导出成功',
        exportFailed: '执行历史导出失败',
        queue: {
          cancelSuccess: '已取消排队任务',
          cancelFailed: '取消任务失败',
          priorityInvalid: '优先级必须是数字',
          prioritySuccess: '优先级已更新',
          priorityFailed: '更新优先级失败'
        }
      }
    },
    mcp: {
      common: {
        operationFailed: '操作失败，请重试',
        addSuccess: 'MCP 服务添加成功！',
        loading: '加载服务列表中...',
        loadFailedTitle: '加载失败',
        toggleLabel: 'MCP 服务',
        noToolsTitle: '暂无可用的 MCP 工具',
        noToolsHint: '请先在设置中启用 MCP Services',
        badgeCustom: '自定义',
        badgeNeedsConfig: '需要配置',
        badgeConfigured: '已配置',
        badgeFree: '免费',
        badgeFreeNoConfig: '无需配置',
        badgeTools: '{count} 个工具'
      },
      servicesPanel: {
        intro: '通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。',
        stats: '已启用 {enabled} / {total}',
        addButton: '添加服务',
        filterAll: '全部 ({count})',
        filterSystem: '系统内置 ({count})',
        filterCustom: '用户自定义 ({count})',
        searchPlaceholder: '搜索服务...',
        gridView: '卡片视图',
        listView: '列表视图',
        emptyTitle: '没有找到匹配的服务',
        emptyHint: '尝试调整筛选条件或搜索关键词'
      },
      addDialog: {
        title: '添加 MCP 服务',
        subtitle: '从模板库选择服务或手动配置自定义服务',
        tabTemplates: '从模板添加',
        tabCustom: '手动配置',
        categoryAll: '全部',
        searchPlaceholder: '搜索服务...',
        envConfigTitle: '环境变量配置',
        setupInstructions: '设置说明',
        viewDocs: '查看官方文档',
        cancel: '取消',
        confirmAdd: '确认添加',
        loadingAdd: '添加中...',
        templateSuccess: 'MCP 服务添加成功！',
        customSuccess: '自定义 MCP 服务创建成功！',
        noTemplates: '没有找到匹配的服务模板',
        templateButton: '添加',
        popularity: {
          high: '热门',
          medium: '推荐',
          low: '冷门'
        },
        officialBadge: '官方',
        requiredMark: '*',
        envPlaceholder: '请输入 {key}',
        configTitle: '配置 {name}',
        configSubtitle: '填写必要的配置信息以启用此服务',
        customSectionTitle: '基本信息',
        customPlaceholders: {
          id: '例如: my-custom-service',
          name: '例如: 我的自定义服务',
          description: '描述这个服务的功能和用途...',
          icon: '🔧',
          command: '例如: npx, node, python',
          args: '例如: ["-y", "my-service"]',
          envVars: '例如: {"API_KEY": "value"}',
          features: '例如: ["文件读写", "目录管理"]'
        },
        customHints: {
          id: '唯一标识，只能包含字母、数字、下划线和连字符',
          command: '用于启动服务的命令',
          args: '必须是有效的 JSON 数组格式，留空表示无参数',
          envVars: '必须是有效的 JSON 对象格式，留空表示无环境变量',
          features: '必须是有效的 JSON 数组格式'
        },
        commandSectionTitle: '命令配置',
        customLabels: {
          id: '服务 ID',
          name: '服务名称',
          description: '服务描述',
          category: '分类',
          icon: '图标',
          command: '命令',
          args: '执行参数（JSON 数组）',
          envVars: '环境变量（JSON 对象）',
          features: '功能描述（JSON 数组）'
        },
        customEnvTitle: '环境变量（JSON 对象）',
        customFeaturesTitle: '功能列表（可选）',
        customReset: '重置',
        customCreate: '创建服务',
        customCreating: '创建中...',
        error: '创建失败',
        templateConfirm: '确认',
        templateCancel: '取消',
        errors: {
          required: '请填写所有必填字段',
          argsMustArray: '参数必须是数组格式',
          argsInvalid: '参数格式错误：{message}',
          envMustObject: '环境变量必须是对象格式',
          envInvalid: '环境变量格式错误：{message}',
          featuresMustArray: '功能列表必须是数组格式',
          featuresInvalid: '功能列表格式错误：{message}'
        }
      },
      configPanel: {
        intro: '通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。所有服务均可免费启用。',
        toolsLabel: '工具',
        toggleLabel: 'MCP 服务',
        loading: '加载 MCP 工具中...',
        emptyTitle: '暂无可用的 MCP 工具',
        emptyHint: '请先在设置中启用 MCP Services',
        copySuccess: '已复制',
        saveSuccess: '保存成功！',
        toggleButton: {
          expand: '配置 API Key',
          collapse: '收起配置'
        },
        actions: {
          save: '保存',
          saving: '保存中...',
          getKey: '获取 API Key'
        },
        tooltip: {
          show: '显示',
          hide: '隐藏',
          copy: '复制'
        }
      },
      pathDialog: {
        sqliteLabel: '数据库文件路径',
        sqlitePlaceholder: '/path/to/database.db',
        sqliteHint: '请输入 SQLite 数据库文件的完整路径',
        filesystemLabel: '允许访问的目录',
        filesystemPlaceholder: '/path/to/directory',
        filesystemHint: '添加文件系统服务可以访问的目录',
        addDirectory: '添加',
        removeDirectory: '移除',
        cancel: '取消',
        save: '保存配置',
        saving: '保存中...',
        success: '配置保存成功！服务将在下次重启时生效。',
        loadError: '加载配置失败'
      }
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
    config: {
      modelInputHint: '直接输入模型 ID，或点击下方推荐项快速填入。',
      deleteModel: '删除此模型',
      viewComparison: '查看优劣势说明',
      unlimitedHint: '留空表示无限制',
      alreadyUnlimited: '已设置为无限制，将使用模型支持的最大输出Token数',
      setUnlimited: '设置为无限制（使用模型最大值）',
      unlimited: '无限制',
      currentUnlimited: '当前：无限制（使用模型支持的最大输出Token数）'
    },
    tokenInfo: {
      title: 'Token数设置说明',
      gotIt: '我知道了'
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
    },
    agents: {
      title: 'AI 助手',
      subtitle: '管理和执行您的智能代理',
      createAgent: '创建代理',
      noAgents: '未找到代理',
      noAgentsDescription: '创建您的第一个 AI 代理来自动化任务和工作流',
      searchPlaceholder: '搜索代理...',
      filters: {
        allStatus: '所有状态',
        active: '活跃',
        inactive: '未激活',
        busy: '忙碌',
        error: '错误',
        capabilities: '能力',
        sortBy: '排序方式',
        name: '名称',
        lastRun: '最后运行',
        successRate: '成功率',
        totalRuns: '总运行次数',
        filterBy: '筛选条件',
        noCapabilitiesFound: '未找到能力'
      },
      viewMode: {
        grid: '网格视图',
        list: '列表视图'
      },
      actions: {
        execute: '执行',
        edit: '编辑',
        delete: '删除',
        viewDetails: '查看详情',
        viewHistory: '查看历史',
        executeTask: '执行任务'
      },
      status: {
        active: '活跃',
        inactive: '未激活',
        idle: '空闲',
        busy: '忙碌',
        running: '运行中',
        error: '错误'
      },
      card: {
        status: '状态',
        capabilities: '能力',
        more: '更多',
        totalRuns: '总运行次数',
        successRate: '成功率',
        lastRun: '最后运行',
        avgDuration: '平均时长',
        untitledAgent: '未命名代理',
        noDescription: '暂无描述',
        openMenu: '打开菜单'
      },
      dashboard: {
        totalExecutions: '总执行次数',
        successRate: '成功率',
        avgDuration: '平均时长',
        recentTrend: '最近 7 日趋势',
        completedVsTotal: '完成 / 总次数'
      },
      editor: {
        createTitle: '创建新代理',
        editTitle: '编辑代理',
        subtitle: '配置您的 AI 代理的能力和行为',
        tabs: {
          basic: '基本信息',
          capabilities: '能力',
          advanced: '高级'
        },
        fields: {
          name: '名称',
          nameRequired: '名称为必填项',
          namePlaceholder: '我的 AI 代理',
          description: '描述',
          descriptionPlaceholder: '描述您的代理的功能...',
          descriptionHint: '清晰的描述有助于您记住代理的用途',
          agentType: '代理类型',
          agentTypePlaceholder: '选择代理类型',
          selectedCapabilities: '已选择的能力',
          noCapabilitiesSelected: '未选择任何能力',
          availableCapabilities: '可用能力',
          customCapability: '自定义能力',
          customCapabilityPlaceholder: '输入自定义能力...',
          tools: '工具',
          model: '模型',
          temperature: '温度',
          temperatureHint: '控制随机性。较低值更专注，较高值更有创造性',
          maxTokens: '最大 Token 数',
          maxTokensHint: '要生成的最大 Token 数',
          systemPrompt: '系统提示词',
          systemPromptPlaceholder: '你是一个有帮助的 AI 助手...',
          systemPromptHint: '代理行为的自定义指令',
          autoRetry: '自动重试',
          autoRetryHint: '自动重试失败的任务',
          maxRetries: '最大重试次数'
        },
        types: {
          conversational: '对话型',
          taskBased: '任务型',
          analytical: '分析型',
          creative: '创作型'
        },
        capabilities: {
          textGeneration: '文本生成',
          codeAnalysis: '代码分析',
          dataProcessing: '数据处理',
          webSearch: '网络搜索',
          fileOperations: '文件操作',
          apiIntegration: 'API 集成',
          taskAutomation: '任务自动化',
          knowledgeRetrieval: '知识检索',
          imageAnalysis: '图像分析',
          documentParsing: '文档解析'
        },
        tools: {
          webSearch: '网络搜索',
          fileReader: '文件读取器',
          codeExecutor: '代码执行器',
          apiCaller: 'API 调用器',
          dataAnalyzer: '数据分析器',
          imageProcessor: '图像处理器'
        },
        buttons: {
          cancel: '取消',
          create: '创建代理',
          save: '保存更改',
          saving: '保存中...',
          addCapability: '添加'
        },
        validation: {
          nameRequired: '名称为必填项',
          capabilitiesRequired: '至少需要一个能力'
        }
      },
      deleteConfirm: {
        title: '删除代理',
        description: '确定要删除"{name}"吗？此操作无法撤销。'
      },
      executor: {
        title: '执行任务 - {name}',
        description: '借助智能代理运行任务',
        taskLabel: '任务描述',
        taskPlaceholder: '描述您希望代理执行的任务...',
        progress: '执行进度',
        subtaskFallback: '子任务',
        buttons: {
          execute: '执行任务',
          stop: '停止执行',
          retry: '重新执行',
          clear: '清空',
          retryNow: '立即重试',
          hideRaw: '隐藏原始 JSON',
          showRaw: '查看原始 JSON'
        },
        status: {
          idle: '待机',
          running: '执行中',
          completed: '已完成',
          failed: '已失败',
          stopped: '已停止',
          taskId: '任务: {id}',
          executionId: '执行: {id}',
          durationSeconds: '{seconds}秒'
        },
        result: {
          successTitle: '任务执行成功',
          tokens: 'Tokens：{usage}',
          failureTitle: '任务执行失败'
        },
        tabs: {
          subtasks: '子任务 ({count})',
          logs: '日志 ({count})'
        },
        empty: {
          subtasks: '暂无子任务',
          logs: '暂无日志'
        },
        logs: {
          connected: '已连接实时任务通道',
          disconnected: '实时通道断开，切换为轮询',
          currentStep: '当前步骤: {step}',
          fetchSubtasksFailed: '获取子任务失败: {message}',
          completed: '任务执行完成',
          failed: '任务执行失败',
          cancelled: '任务执行已取消',
          pollingFailed: '轮询进度失败: {message}',
          start: '开始执行代理任务: {name}',
          retry: '重新执行代理任务: {name}',
          taskLine: '任务: {task}',
          sending: '正在发送任务到代理...',
          queued: '任务已排队 (ID {id})',
          executionStatus: '执行状态: {status}',
          error: '错误: {message}',
          stop: '任务执行已由用户停止',
          stopFailed: '停止任务失败: {message}',
          unknownError: '未知错误'
        },
        errors: {
          incompleteResponse: '任务执行返回数据不完整',
          executionFailed: '任务执行失败'
        }
      },
      toasts: {
        createSuccess: '代理创建成功',
        updateSuccess: '代理更新成功',
        deleteSuccess: '代理删除成功',
        executeSuccess: '任务执行已开始',
        loadFailed: '加载代理失败',
        saveFailed: '保存代理失败',
        deleteFailed: '删除代理失败',
        executeFailed: '执行任务失败'
      },
      activeFilters: '活动筛选条件：',
      agents: '个代理'
    },
    workflows: {
      title: '工作流',
      subtitle: '使用智能工作流自动化您的任务',
      createWorkflow: '创建工作流',
      noWorkflows: '未找到工作流',
      noWorkflowsDescription: '创建您的第一个工作流来自动化重复任务',
      searchPlaceholder: '搜索工作流...',
      import: '导入',
      exportAll: '导出全部',
      showing: '显示 {count} / {total} 个工作流',
      activeFilters: '活动筛选条件：',
      statusLabel: '状态',
      filters: {
        allStatus: '所有状态',
        enabled: '已启用',
        disabled: '已禁用',
        draft: '草稿',
        active: '活跃',
        running: '运行中',
        paused: '已暂停',
        error: '错误'
      },
      actions: {
        run: '运行',
        edit: '编辑',
        delete: '删除',
        enable: '启用',
        disable: '禁用'
      },
      status: {
        enabled: '已启用',
        disabled: '已禁用',
        draft: '草稿',
        active: '活跃',
        running: '运行中',
        paused: '已暂停',
        error: '错误'
      },
      sort: {
        name: '名称',
        lastRun: '最后运行',
        successRate: '成功率',
        totalRuns: '总运行次数'
      },
      toasts: {
        loadFailed: '加载工作流失败',
        editorComingSoon: '工作流编辑器即将推出！🎨\n\nPhase 2.2 将包括：\n- 可视化工作流编辑器\n- 拖拽式节点编辑\n- 实时执行',
        executing: '正在执行工作流...',
        executionStarted: '工作流执行已开始',
        executeFailed: '执行工作流失败',
        editWorkflow: '编辑工作流：{name}\n\n工作流编辑器将在 Phase 2.2 推出！🚧',
        deleteSuccess: '工作流删除成功',
        deleteFailed: '删除工作流失败',
        duplicating: '正在复制工作流...',
        duplicateSuccess: '工作流复制成功',
        duplicateFailed: '复制工作流失败',
        workflowDetails: '工作流：{name}\n\n节点数：{nodes}\n状态：{status}\n\n详情视图即将推出！📊',
        importComingSoon: '导入工作流功能即将推出！📥\n\n支持的格式：\n- JSON\n- YAML',
        noWorkflowsToExport: '没有可导出的工作流',
        exportComingSoon: '导出功能即将推出！📤\n\n导出格式：\n- JSON\n- YAML\n- PNG（流程图）'
      },
      dialog: {
        deleteTitle: '删除工作流',
        deleteMessage: '确定要删除"{name}"吗？此操作无法撤销。',
        cancel: '取消',
        delete: '删除'
      },
      phaseInfo: {
        title: '工作流系统 - Phase 2（完成40%）',
        ready: '✅ 基础工作流管理已就绪',
        coming: '🚧 可视化工作流编辑器将在 Phase 2.2 推出'
      }
    },
    knowledge: {
      title: '知识库',
      subtitle: '管理您的知识文档和文件',
      addDocument: '添加文档',
      noDocuments: '未找到文档',
      searchPlaceholder: '搜索知识库...',
      knowledgeBase: '知识库',
      createKnowledgeBase: '创建知识库',
      newKnowledgeBase: '创建知识库',
      name: '知识库名称',
      namePlaceholder: '输入知识库名称',
      description: '描述',
      descriptionPlaceholder: '输入知识库描述（可选）',
      cancel: '取消',
      create: '创建',
      nameRequired: '知识库名称不能为空',
      loadFailed: '加载知识库失败',
      createFailed: '创建知识库失败',
      deleteConfirm: '确定要删除这个知识库吗？这将删除所有相关文档和数据。',
      deleteFailed: '删除知识库失败',
      loading: '加载中...',
      noMatchingKB: '没有找到匹配的知识库',
      noKB: '暂无知识库',
      embeddingModel: '嵌入模型',
      chunkSize: '块大小',
      retrievalCount: '检索数量',
      documents: '{count} 个文档',
      filters: {
        allTypes: '所有类型',
        document: '文档',
        file: '文件',
        link: '链接'
      }
    },
    personas: {
      title: '人格',
      subtitle: '自定义 AI 个性和行为',
      createPersona: '创建人格',
      noPersonas: '未找到人格',
      selectPersona: '选择人格',
      defaultPersona: '默认',
      aiPersonas: 'AI 角色',
      createNewPersona: '创建新角色',
      searchPlaceholder: '搜索角色...',
      loadFailed: '加载角色失败',
      loading: '加载中...',
      noMatchingPersonas: '没有找到匹配的角色',
      noPersonasYet: '暂无角色',
      createFirstPersona: '创建第一个角色',
      totalPersonas: '共 {count} 个角色',
      averageRating: '平均评分：{rating}',
      totalUsage: '总使用：{count}'
    },
    sidebar: {
      chat: '对话',
      explore: '探索',
      agents: 'AI 助手',
      workflows: '工作流',
      notes: '笔记',
      documents: '文档',
      passwordVault: '密码保险箱',
      knowledge: '知识库',
      analytics: '数据分析',
      settings: '设置'
    },
    common: {
      loading: '加载中...',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      showing: '显示 {count} / {total}',
      noResults: '未找到结果',
      tryAdjustingFilters: '尝试调整您的筛选条件或搜索关键词'
    },
    chat: {
      welcomeTitle: '你好，我是Personal Chatbox',
      welcomeMessage: '希望与你聊的开心...',
      programmingMode: '编程模式',
      enableProgrammingMode: '开启编程模式',
      disableProgrammingMode: '关闭编程模式'
    },
    commandPalette: {
      title: '指令面板',
      searchPlaceholder: '输入指令名称或 / 搜索...',
      noCommandsFound: '未找到匹配的指令',
      tryOtherKeywords: '尝试其他关键词',
      navigation: '导航',
      select: '选择',
      close: '关闭',
      commandsCount: '{count} 个指令',
      helpTitle: '快捷指令帮助',
      helpIntro: '使用快捷指令可以快速执行常用操作，提升使用效率。',
      helpTrigger: '在输入框开头输入 / 触发指令',
      helpShortcut: '打开指令面板',
      aliases: '别名',
      parameters: '参数',
      shortcut: '快捷键',
      required: '必需'
    },
    fileUpload: {
      dragHere: '拖拽文件到这里或点击选择',
      dropFiles: '松开鼠标上传文件',
      supportedFormats: '支持 PDF、Word、Excel、CSV、PowerPoint、纯文本文件',
      maxSize: '最大 {size}，最多 {count} 个文件',
      uploading: '上传中...',
      uploadedFiles: '已上传文件 ({count})',
      maxFilesError: '最多只能上传 {count} 个文件',
      maxSizeError: '文件大小不能超过 {size}',
      uploadFailed: '文件上传失败',
      deleteFailed: '删除文件失败'
    },
    sidebar: {
      logout: '退出登录',
      logoutConfirm: '确定要退出登录吗？',
      conversations: '对话',
      recentConversations: '最近对话',
      searchHistory: '搜索历史...',
      clearHistory: '清除历史',
      clearHistoryConfirm: '确定要清除所有对话历史吗？',
      expandSidebar: '展开侧边栏',
      collapseSidebar: '收起侧边栏',
      noConversations: '暂无对话',
      noSearchResults: '没有找到匹配的对话',
      clearFilters: '清除筛选',
      analytics: '数据分析'
    },
    advancedFilter: {
      title: '高级筛选',
      description: '使用高级过滤器精确搜索对话',
      dateRange: '日期范围',
      from: '开始日期',
      to: '结束日期',
      selectDate: '选择日期',
      model: '模型',
      allModels: '所有模型',
      tags: '标签',
      sortBy: '排序方式',
      sortOptions: '排序选项',
      sortDirection: '排序方向',
      byDate: '按时间',
      byRelevance: '按相关度',
      byMessages: '按消息数',
      ascending: '升序',
      descending: '降序',
      lastModified: '最后修改',
      created: '创建时间',
      messageCount: '消息数量',
      reset: '重置',
      apply: '应用过滤',
      today: '今天',
      last7Days: '最近7天',
      last30Days: '最近30天',
      clearDate: '清除日期',
      activeFilters: '活动过滤器',
      dateRangeSet: '已设置日期范围过滤',
      startDateSet: '已设置开始日期过滤',
      endDateSet: '已设置结束日期过滤'
    },
    notes: {
      title: '笔记',
      newNote: '新建笔记',
      empty: '暂无笔记',
      emptyHint: '创建您的第一篇笔记开始使用',
      selectNote: '选择笔记查看',
      selectNoteHint: '或创建新笔记开始使用',
      titlePlaceholder: '笔记标题...',
      contentPlaceholder: '开始写作...',
      addTag: '添加标签...',
      search: '搜索笔记...',
      allCategories: '所有分类',
      allTags: '所有标签',
      favoritesOnly: '仅显示收藏',
      showArchived: '显示已归档',
      sortUpdated: '最后更新',
      sortCreated: '创建时间',
      sortTitle: '标题',
      category: '分类',
      updated: '更新时间',
      defaultCategory: '默认',
      total: '总计',
      favorites: '收藏',
      categories: '分类',
      export: '导出',
      import: '导入',
      shortcuts: '快捷键',
      loadError: '加载笔记失败',
      saveError: '保存笔记失败',
      deleteError: '删除笔记失败',
      deleteConfirm: '确定要删除这篇笔记吗？',
      createSuccess: '笔记已创建',
      updateSuccess: '笔记已更新',
      deleteSuccess: '笔记已删除',
      exportSuccess: '笔记已导出',
      exportError: '导出笔记失败',
      importSuccess: '已导入 {count} 篇笔记',
      importError: '导入笔记失败',
      favoriteError: '更新收藏失败'
    },
    analytics: {
      title: '数据分析仪表板',
      subtitle: '追踪您的AI对话和使用情况',
      overview: '概览',
      totalConversations: '总对话数',
      totalMessages: '总消息数',
      totalTokens: '总Token数',
      estimatedCost: '预估成本',
      avgMessagesPerConv: '平均消息数/对话',
      mostUsedModel: '最常用模型',
      conversationTrend: '对话趋势',
      modelUsage: '模型使用分布',
      messageActivity: '消息活动',
      noData: '暂无数据',
      loading: '加载数据分析中...',
      export: '导出',
      period: {
        last24h: '最近24小时',
        last7d: '最近7天',
        last30d: '最近30天',
        last90d: '最近90天'
      },
      unavailable: '数据分析不可用',
      unavailableMessage: '数据分析功能已暂时禁用。',
      unavailableDetail: '后端路由：/api/analytics 当前已被注释。',
      featureStatus: '数据分析功能状态',
      featureStatusMessage: '详细的数据分析功能当前在后端已禁用。要重新启用，请在 server/index.cjs 中取消注释分析路由，并安装 recharts 包以支持可视化。',
      chartsPlaceholder: '启用分析功能后，图表将显示在此处'
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
