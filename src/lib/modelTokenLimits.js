/**
 * 模型最大Token数配置
 * 根据各服务商官方文档整理
 */

export const MODEL_MAX_TOKENS = {
  // OpenAI Models
  'gpt-4o-mini': {
    maxOutputTokens: 16384,
    contextWindow: 128000,
    description: 'GPT-4o mini 模型'
  },
  'gpt-4o': {
    maxOutputTokens: 16384,
    contextWindow: 128000,
    description: 'GPT-4o 模型'
  },
  'gpt-4': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'GPT-4 模型'
  },
  'gpt-3.5-turbo': {
    maxOutputTokens: 4096,
    contextWindow: 16385,
    description: 'GPT-3.5 Turbo 模型'
  },
  'o1': {
    maxOutputTokens: 32768,
    contextWindow: 200000,
    description: 'O1 推理模型'
  },
  'o1-mini': {
    maxOutputTokens: 65536,
    contextWindow: 128000,
    description: 'O1 Mini 推理模型'
  },
  'o3-mini': {
    maxOutputTokens: 65536,
    contextWindow: 128000,
    description: 'O3 Mini 推理模型'
  },

  // DeepSeek Models
  'deepseek-chat': {
    maxOutputTokens: 8192,
    contextWindow: 64000,
    description: 'DeepSeek Chat 模型'
  },
  'deepseek-coder': {
    maxOutputTokens: 8192,
    contextWindow: 64000,
    description: 'DeepSeek Coder 模型'
  },
  'deepseek-reasoner': {
    maxOutputTokens: 64000,
    contextWindow: 64000,
    description: 'DeepSeek Reasoner 推理模型'
  },

  // Moonshot Models
  'moonshot-v1-8k': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Moonshot v1 8K 模型'
  },
  'moonshot-v1-32k': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: 'Moonshot v1 32K 模型'
  },
  'moonshot-v1-128k': {
    maxOutputTokens: 128000,
    contextWindow: 128000,
    description: 'Moonshot v1 128K 模型'
  },
  'kimi-k2-0711-preview': {
    maxOutputTokens: 256000,
    contextWindow: 256000,
    description: 'Kimi K2 预览版模型'
  },

  // Groq Models
  'mixtral-8x7b-32768': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: 'Mixtral 8x7B 模型'
  },
  'llama3-70b-8192': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Llama 3 70B 模型'
  },
  'llama-3.1-70b-versatile': {
    maxOutputTokens: 8192,
    contextWindow: 131072,
    description: 'Llama 3.1 70B Versatile 模型'
  },
  'llama-3.3-70b-versatile': {
    maxOutputTokens: 8192,
    contextWindow: 131072,
    description: 'Llama 3.3 70B Versatile 模型'
  },

  // Mistral Models
  'mistral-large-latest': {
    maxOutputTokens: 128000,
    contextWindow: 128000,
    description: 'Mistral Large 最新版'
  },
  'mistral-medium-latest': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: 'Mistral Medium 最新版'
  },
  'mistral-small-latest': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: 'Mistral Small 最新版'
  },

  // Together AI Models
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': {
    maxOutputTokens: 8192,
    contextWindow: 131072,
    description: 'Meta Llama 3.1 70B Instruct Turbo'
  },
  'meta-llama/Meta-Llama-3-8B-Instruct': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Meta Llama 3 8B Instruct'
  },

  // Anthropic Models
  'claude-3-opus-20240229': {
    maxOutputTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Opus 模型'
  },
  'claude-3-sonnet-20240229': {
    maxOutputTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Sonnet 模型'
  },
  'claude-3-haiku-20240307': {
    maxOutputTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Haiku 模型'
  },
  'claude-3.5-sonnet': {
    maxOutputTokens: 8192,
    contextWindow: 200000,
    description: 'Claude 3.5 Sonnet 模型'
  },

  // Google Gemini Models
  'gemini-pro': {
    maxOutputTokens: 8192,
    contextWindow: 1048576,
    description: 'Gemini Pro 模型'
  },
  'gemini-ultra': {
    maxOutputTokens: 8192,
    contextWindow: 1048576,
    description: 'Gemini Ultra 模型'
  },
  'gemini-1.5-pro': {
    maxOutputTokens: 8192,
    contextWindow: 2097152,
    description: 'Gemini 1.5 Pro 模型'
  },
  'gemini-2.0-flash': {
    maxOutputTokens: 65536,
    contextWindow: 1048576,
    description: 'Gemini 2.0 Flash 模型'
  },
  'gemini-2.5-pro': {
    maxOutputTokens: 65536,
    contextWindow: 1048576,
    description: 'Gemini 2.5 Pro 模型'
  },

  // Volcano Engine (豆包) Models
  'doubao-pro-32k': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: '豆包 Pro 32K 模型'
  },
  'doubao-pro-128k': {
    maxOutputTokens: 128000,
    contextWindow: 128000,
    description: '豆包 Pro 128K 模型'
  },
  'doubao-lite-32k': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: '豆包 Lite 32K 模型'
  }
}

/**
 * 获取模型的最大输出Token数
 * @param {string} modelName - 模型名称
 * @returns {number} 最大输出Token数，如果未找到则返回默认值4096
 */
export function getModelMaxTokens(modelName) {
  const config = MODEL_MAX_TOKENS[modelName]
  return config?.maxOutputTokens ?? 4096
}

/**
 * 获取模型的上下文窗口大小
 * @param {string} modelName - 模型名称
 * @returns {number} 上下文窗口大小
 */
export function getModelContextWindow(modelName) {
  const config = MODEL_MAX_TOKENS[modelName]
  return config?.contextWindow ?? 4096
}

/**
 * 获取模型的描述信息
 * @param {string} modelName - 模型名称
 * @returns {string} 模型描述
 */
export function getModelDescription(modelName) {
  const config = MODEL_MAX_TOKENS[modelName]
  return config?.description ?? modelName
}

/**
 * 检查模型是否支持指定的Token数
 * @param {string} modelName - 模型名称
 * @param {number} tokens - Token数
 * @returns {boolean} 是否支持
 */
export function isTokenCountSupported(modelName, tokens) {
  const maxTokens = getModelMaxTokens(modelName)
  return tokens <= maxTokens
}

/**
 * 获取所有支持的模型列表
 * @returns {string[]} 模型名称列表
 */
export function getSupportedModels() {
  return Object.keys(MODEL_MAX_TOKENS)
}

/**
 * 最大Token数的优劣势说明
 */
export const MAX_TOKENS_PROS_CONS = {
  zh: {
    maxTokens: {
      title: '设置最大Token数',
      pros: {
        title: '优势',
        items: [
          '生成更长、更完整的回答',
          '适合需要详细解释或长篇内容的场景',
          '减少因Token限制导致的内容截断',
          '提供更全面的信息和分析'
        ]
      },
      cons: {
        title: '劣势',
        items: [
          '消耗更多API配额和费用',
          '响应时间可能更长',
          '可能产生冗余或不必要的内容',
          '在某些情况下可能影响响应速度'
        ]
      }
    },
    defaultTokens: {
      title: '使用默认Token数',
      pros: {
        title: '优势',
        items: [
          '节省API配额和费用',
          '响应速度更快',
          '内容更加精炼和聚焦',
          '适合快速问答和简短回复'
        ]
      },
      cons: {
        title: '劣势',
        items: [
          '可能无法生成完整的长篇内容',
          '复杂问题的回答可能被截断',
          '需要多轮对话才能获取完整信息',
          '不适合需要详细分析的场景'
        ]
      }
    },
    recommendation: {
      title: '建议',
      content: '根据您的使用场景选择合适的Token数：\n\n• 简短问答、日常对话：使用默认值（1024-2048）\n• 代码生成、技术文档：使用中等值（4096-8192）\n• 长篇文章、详细分析：使用最大值\n• 成本敏感场景：使用较小值并根据需要调整'
    }
  },
  en: {
    maxTokens: {
      title: 'Set Maximum Tokens',
      pros: {
        title: 'Advantages',
        items: [
          'Generate longer and more complete responses',
          'Suitable for scenarios requiring detailed explanations or long-form content',
          'Reduce content truncation due to token limits',
          'Provide more comprehensive information and analysis'
        ]
      },
      cons: {
        title: 'Disadvantages',
        items: [
          'Consume more API quota and costs',
          'Response time may be longer',
          'May produce redundant or unnecessary content',
          'May affect response speed in some cases'
        ]
      }
    },
    defaultTokens: {
      title: 'Use Default Tokens',
      pros: {
        title: 'Advantages',
        items: [
          'Save API quota and costs',
          'Faster response speed',
          'More concise and focused content',
          'Suitable for quick Q&A and short replies'
        ]
      },
      cons: {
        title: 'Disadvantages',
        items: [
          'May not generate complete long-form content',
          'Answers to complex questions may be truncated',
          'Multiple rounds of conversation needed for complete information',
          'Not suitable for scenarios requiring detailed analysis'
        ]
      }
    },
    recommendation: {
      title: 'Recommendation',
      content: 'Choose appropriate token count based on your use case:\n\n• Short Q&A, casual conversation: Use default (1024-2048)\n• Code generation, technical docs: Use medium (4096-8192)\n• Long articles, detailed analysis: Use maximum\n• Cost-sensitive scenarios: Use smaller values and adjust as needed'
    }
  }
}

