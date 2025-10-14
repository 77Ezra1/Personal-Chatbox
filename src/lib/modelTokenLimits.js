import { createLogger } from '../lib/logger'
const logger = createLogger('MODEL_MAX_TOKENS')

/**
 * 模型最大Token数配置
 * 
 * 重要说明：
 * 1. maxOutputTokens：最大输出Token数（max_tokens参数的最大值）
 * 2. contextWindow：上下文窗口大小（输入+输出的总Token数）
 * 3. 某些模型的最大输出是动态的，取决于输入长度
 * 
 * 数据来源：各服务商官方API文档
 * 最后更新：2025年10月10日
 */

export const MODEL_MAX_TOKENS = {
  // ============================================
  // OpenAI Models
  // 来源：https://platform.openai.com/docs/models
  // ============================================
  
  // GPT-5 系列
  'gpt-5': {
    maxOutputTokens: 128000,
    contextWindow: 400000,
    description: 'GPT-5 - 最强大的OpenAI模型'
  },
  
  // GPT-4o 系列
  'gpt-4o': {
    maxOutputTokens: 16384,          // 官方确认
    contextWindow: 128000,
    description: 'GPT-4o - 多模态旗舰模型'
  },
  'gpt-4o-mini': {
    maxOutputTokens: 16384,          // 官方确认
    contextWindow: 128000,
    description: 'GPT-4o mini - 快速且经济的小型模型'
  },
  'gpt-4o-2024-08-06': {
    maxOutputTokens: 16384,
    contextWindow: 128000,
    description: 'GPT-4o (2024-08-06)'
  },
  'gpt-4o-2024-11-20': {
    maxOutputTokens: 16384,
    contextWindow: 128000,
    description: 'GPT-4o (2024-11-20)'
  },
  'gpt-4o-mini-2024-07-18': {
    maxOutputTokens: 16384,
    contextWindow: 128000,
    description: 'GPT-4o mini (2024-07-18)'
  },
  
  // GPT-4.1 系列
  'gpt-4.1': {
    maxOutputTokens: 32768,
    contextWindow: 128000,
    description: 'GPT-4.1 - 最智能的非推理模型'
  },
  'gpt-4.1-mini': {
    maxOutputTokens: 32768,
    contextWindow: 128000,
    description: 'GPT-4.1 mini'
  },
  
  // GPT-4 系列
  'gpt-4': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'GPT-4 模型'
  },
  'gpt-4-turbo': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'GPT-4 Turbo'
  },
  
  // GPT-3.5 系列
  'gpt-3.5-turbo': {
    maxOutputTokens: 4096,
    contextWindow: 16385,
    description: 'GPT-3.5 Turbo 模型'
  },
  
  // O系列（推理模型）
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

  // ============================================
  // Anthropic Claude Models
  // 来源：https://docs.claude.com/en/docs/about-claude/models/overview
  // ============================================
  
  // Claude Sonnet 系列（最大输出64K）
  'claude-sonnet-4.5': {
    maxOutputTokens: 64000,          // 官方确认
    contextWindow: 200000,
    description: 'Claude Sonnet 4.5'
  },
  'claude-sonnet-4': {
    maxOutputTokens: 64000,          // 官方确认
    contextWindow: 200000,
    description: 'Claude Sonnet 4'
  },
  'claude-3.7-sonnet': {
    maxOutputTokens: 64000,          // 官方确认
    contextWindow: 200000,
    description: 'Claude 3.7 Sonnet'
  },
  'claude-3.5-sonnet': {
    maxOutputTokens: 64000,          // 官方确认（之前错误配置为8192）
    contextWindow: 200000,
    description: 'Claude 3.5 Sonnet'
  },
  'claude-3-sonnet': {
    maxOutputTokens: 64000,          // 官方确认（之前错误配置为4096）
    contextWindow: 200000,
    description: 'Claude 3 Sonnet'
  },
  'claude-3-5-sonnet-20240620': {
    maxOutputTokens: 64000,
    contextWindow: 200000,
    description: 'Claude 3.5 Sonnet (2024-06-20)'
  },
  'claude-3-5-sonnet-20241022': {
    maxOutputTokens: 64000,
    contextWindow: 200000,
    description: 'Claude 3.5 Sonnet (2024-10-22)'
  },
  'claude-3-sonnet-20240229': {
    maxOutputTokens: 64000,
    contextWindow: 200000,
    description: 'Claude 3 Sonnet (2024-02-29)'
  },
  
  // Claude Opus 系列（最大输出32K）
  'claude-opus-4.1': {
    maxOutputTokens: 32000,          // 官方确认
    contextWindow: 200000,
    description: 'Claude Opus 4.1'
  },
  'claude-opus-4': {
    maxOutputTokens: 32000,          // 官方确认
    contextWindow: 200000,
    description: 'Claude Opus 4'
  },
  'claude-3-opus': {
    maxOutputTokens: 32000,          // 官方确认（之前错误配置为4096）
    contextWindow: 200000,
    description: 'Claude 3 Opus'
  },
  'claude-3-opus-20240229': {
    maxOutputTokens: 32000,
    contextWindow: 200000,
    description: 'Claude 3 Opus (2024-02-29)'
  },
  
  // Claude Haiku 系列
  'claude-3.5-haiku': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 200000,
    description: 'Claude 3.5 Haiku'
  },
  'claude-3-haiku': {
    maxOutputTokens: 4096,           // 官方确认
    contextWindow: 200000,
    description: 'Claude 3 Haiku'
  },
  'claude-3-5-haiku-20241022': {
    maxOutputTokens: 8192,
    contextWindow: 200000,
    description: 'Claude 3.5 Haiku (2024-10-22)'
  },
  'claude-3-haiku-20240307': {
    maxOutputTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Haiku (2024-03-07)'
  },

  // ============================================
  // Google Gemini Models
  // 来源：https://ai.google.dev/gemini-api/docs/models
  // ============================================
  
  'gemini-2.5-pro': {
    maxOutputTokens: 65536,          // 官方确认
    contextWindow: 1048576,
    description: 'Gemini 2.5 Pro'
  },
  'gemini-2.0-flash': {
    maxOutputTokens: 8192,           // 官方确认（之前错误配置为65536）
    contextWindow: 1048576,
    description: 'Gemini 2.0 Flash'
  },
  'gemini-1.5-pro': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 2097152,
    description: 'Gemini 1.5 Pro'
  },
  'gemini-1.5-flash': {
    maxOutputTokens: 8192,
    contextWindow: 1048576,
    description: 'Gemini 1.5 Flash'
  },
  'gemini-pro': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 1048576,
    description: 'Gemini Pro'
  },
  'gemini-pro-vision': {
    maxOutputTokens: 8192,
    contextWindow: 1048576,
    description: 'Gemini Pro Vision'
  },
  'gemini-ultra': {
    maxOutputTokens: 8192,
    contextWindow: 1048576,
    description: 'Gemini Ultra'
  },

  // ============================================
  // Moonshot (Kimi) Models
  // 来源：https://platform.moonshot.cn/docs/guide/faq
  // 注意：最大输出是动态的，公式为：上下文窗口 - 输入Token数
  // ============================================
  
  'moonshot-v1-8k': {
    maxOutputTokens: 8192,           // 官方：8*1024 - prompt_tokens
    contextWindow: 8192,
    description: 'Moonshot v1 8K（最大输出动态）',
    isDynamic: true
  },
  'moonshot-v1-32k': {
    maxOutputTokens: 32768,          // 官方：32*1024 - prompt_tokens
    contextWindow: 32768,
    description: 'Moonshot v1 32K（最大输出动态）',
    isDynamic: true
  },
  'moonshot-v1-128k': {
    maxOutputTokens: 131072,         // 官方：128*1024 - prompt_tokens（之前错误配置为128000）
    contextWindow: 131072,
    description: 'Moonshot v1 128K（最大输出动态）',
    isDynamic: true
  },
  'moonshot-v1-auto': {
    maxOutputTokens: 131072,
    contextWindow: 131072,
    description: 'Moonshot v1 Auto（自动选择）',
    isDynamic: true
  },
  'kimi-k2-0711-preview': {
    maxOutputTokens: 262144,         // 256*1024（之前错误配置为256000）
    contextWindow: 262144,
    description: 'Kimi K2 (0711) Preview（最大输出动态）',
    isDynamic: true
  },
  'kimi-k2-0905-preview': {
    maxOutputTokens: 262144,         // 官方：256*1024 - prompt_tokens
    contextWindow: 262144,
    description: 'Kimi K2 (0905) Preview（最大输出动态）',
    isDynamic: true
  },
  'kimi-k2-turbo-preview': {
    maxOutputTokens: 262144,         // 官方：256*1024 - prompt_tokens
    contextWindow: 262144,
    description: 'Kimi K2 Turbo Preview（最大输出动态）',
    isDynamic: true
  },

  // ============================================
  // Volcano Engine (豆包) Models
  // 来源：用户反馈 + 搜索结果
  // 注意：所有豆包模型的输出都限制在约16K，与上下文窗口无关
  // ============================================
  
  'doubao-pro-32k': {
    maxOutputTokens: 16000,          // 用户反馈（之前错误配置为32768）
    contextWindow: 32768,
    description: '豆包 Pro 32K（输出限制约16K）'
  },
  'doubao-pro-128k': {
    maxOutputTokens: 16000,          // 用户反馈（之前错误配置为128000）
    contextWindow: 128000,
    description: '豆包 Pro 128K（输出限制约16K）'
  },
  'doubao-pro-256k': {
    maxOutputTokens: 16000,
    contextWindow: 256000,
    description: '豆包 Pro 256K（输出限制约16K）'
  },
  'doubao-lite-32k': {
    maxOutputTokens: 16000,          // 用户反馈（之前错误配置为32768）
    contextWindow: 32768,
    description: '豆包 Lite 32K（输出限制约16K）'
  },
  'doubao-lite-128k': {
    maxOutputTokens: 16000,
    contextWindow: 128000,
    description: '豆包 Lite 128K（输出限制约16K）'
  },

  // ============================================
  // DeepSeek Models
  // 来源：https://api-docs.deepseek.com
  // ============================================
  
  'deepseek-chat': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 64000,
    description: 'DeepSeek Chat'
  },
  'deepseek-coder': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 64000,
    description: 'DeepSeek Coder'
  },
  'deepseek-reasoner': {
    maxOutputTokens: 64000,          // 官方确认：包括思考过程
    contextWindow: 64000,
    description: 'DeepSeek Reasoner（包括思考过程）'
  },

  // ============================================
  // Groq Models
  // 来源：https://console.groq.com/docs/models
  // ============================================
  
  'llama-3.1-8b-instant': {
    maxOutputTokens: 131072,         // 官方确认
    contextWindow: 131072,
    description: 'Llama 3.1 8B Instant'
  },
  'llama-3.3-70b-versatile': {
    maxOutputTokens: 32768,          // 官方确认（之前错误配置为8192）
    contextWindow: 131072,
    description: 'Llama 3.3 70B Versatile'
  },
  'llama3-70b-8192': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Llama 3 70B（可能已弃用）'
  },
  'llama3-8b-8192': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Llama 3 8B（可能已弃用）'
  },
  'llama-3.1-70b-versatile': {
    maxOutputTokens: 8192,
    contextWindow: 131072,
    description: 'Llama 3.1 70B Versatile'
  },
  'mixtral-8x7b-32768': {
    maxOutputTokens: 32768,
    contextWindow: 32768,
    description: 'Mixtral 8x7B（可能已弃用）'
  },
  'gemma-7b-it': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Gemma 7B IT'
  },
  'gemma2-9b-it': {
    maxOutputTokens: 8192,
    contextWindow: 8192,
    description: 'Gemma2 9B IT'
  },
  'meta-llama/llama-guard-4-12b': {
    maxOutputTokens: 1024,           // 官方确认
    contextWindow: 131072,
    description: 'Llama Guard 4 12B'
  },
  'openai/gpt-oss-120b': {
    maxOutputTokens: 65536,          // 官方确认
    contextWindow: 131072,
    description: 'GPT-OSS 120B'
  },
  'openai/gpt-oss-20b': {
    maxOutputTokens: 65536,          // 官方确认
    contextWindow: 131072,
    description: 'GPT-OSS 20B'
  },
  'groq/compound': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 131072,
    description: 'Groq Compound'
  },
  'groq/compound-mini': {
    maxOutputTokens: 8192,           // 官方确认
    contextWindow: 131072,
    description: 'Groq Compound Mini'
  },

  // ============================================
  // Mistral Models
  // 来源：https://docs.mistral.ai/getting-started/models/models_overview/
  // 注意：根据prompthub.us，Mistral Large的最大输出是4096
  // 文档中的Max Tokens可能指上下文窗口，需要进一步确认
  // ============================================
  
  // Mistral Large 系列
  'mistral-large-latest': {
    maxOutputTokens: 4096,           // 根据prompthub.us（待官方确认）
    contextWindow: 128000,
    description: 'Mistral Large Latest'
  },
  'mistral-large-2411': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Large (2024-11)'
  },
  'mistral-large-2407': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Large (2024-07)'
  },
  
  // Mistral Medium 系列
  'mistral-medium-latest': {
    maxOutputTokens: 4096,
    contextWindow: 32768,
    description: 'Mistral Medium Latest'
  },
  'mistral-medium-2508': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Medium (2025-08)'
  },
  'mistral-medium-2505': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Medium (2025-05)'
  },
  
  // Mistral Small 系列
  'mistral-small-latest': {
    maxOutputTokens: 4096,
    contextWindow: 32768,
    description: 'Mistral Small Latest'
  },
  'mistral-small-2506': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Small (2025-06)'
  },
  'mistral-small-2503': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Mistral Small (2025-03)'
  },
  'mistral-small-2501': {
    maxOutputTokens: 4096,
    contextWindow: 32000,
    description: 'Mistral Small (2025-01)'
  },
  'mistral-small-2407': {
    maxOutputTokens: 4096,
    contextWindow: 32000,
    description: 'Mistral Small (2024-07)'
  },
  
  // Codestral 系列
  'codestral-latest': {
    maxOutputTokens: 4096,
    contextWindow: 256000,
    description: 'Codestral Latest'
  },
  'codestral-2508': {
    maxOutputTokens: 4096,
    contextWindow: 256000,
    description: 'Codestral (2025-08)'
  },
  'codestral-2501': {
    maxOutputTokens: 4096,
    contextWindow: 256000,
    description: 'Codestral (2025-01)'
  },
  
  // Ministral 系列
  'ministral-3b-latest': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Ministral 3B Latest'
  },
  'ministral-8b-latest': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Ministral 8B Latest'
  },
  'ministral-3b-2410': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Ministral 3B (2024-10)'
  },
  'ministral-8b-2410': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Ministral 8B (2024-10)'
  },
  
  // Pixtral 系列
  'pixtral-large-latest': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Pixtral Large Latest'
  },
  'pixtral-large-2411': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Pixtral Large (2024-11)'
  },
  'pixtral-12b-2409': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Pixtral 12B (2024-09)'
  },
  
  // 其他 Mistral 模型
  'open-mistral-nemo': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Open Mistral Nemo'
  },
  'open-mistral-7b': {
    maxOutputTokens: 4096,
    contextWindow: 32768,
    description: 'Open Mistral 7B'
  },
  'open-mixtral-8x7b': {
    maxOutputTokens: 4096,
    contextWindow: 32768,
    description: 'Open Mixtral 8x7B'
  },
  'open-mixtral-8x22b': {
    maxOutputTokens: 4096,
    contextWindow: 64000,
    description: 'Open Mixtral 8x22B'
  },

  // ============================================
  // Together AI Models
  // ============================================
  
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

  // ============================================
  // 其他模型
  // ============================================
  
  // Cohere
  'command-r-plus': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Command R Plus'
  },
  'command-r': {
    maxOutputTokens: 4096,
    contextWindow: 128000,
    description: 'Command R'
  },
  'command': {
    maxOutputTokens: 4096,
    contextWindow: 4096,
    description: 'Command'
  },
  'command-light': {
    maxOutputTokens: 4096,
    contextWindow: 4096,
    description: 'Command Light'
  },
  
  // Meta Llama（通过其他平台）
  'llama-2-70b-chat': {
    maxOutputTokens: 4096,
    contextWindow: 4096,
    description: 'Llama 2 70B Chat'
  },
  'llama-2-13b-chat': {
    maxOutputTokens: 4096,
    contextWindow: 4096,
    description: 'Llama 2 13B Chat'
  },
  'llama-2-7b-chat': {
    maxOutputTokens: 4096,
    contextWindow: 4096,
    description: 'Llama 2 7B Chat'
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
 * 检查模型的最大输出是否是动态的
 * @param {string} modelName - 模型名称
 * @returns {boolean} 是否动态
 */
export function isModelDynamic(modelName) {
  const config = MODEL_MAX_TOKENS[modelName]
  return config?.isDynamic ?? false
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
      title: '设置为"无限制"',
      pros: {
        title: '优势',
        items: [
          '使用模型支持的最大输出Token数',
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
      title: '设置为具体数值',
      pros: {
        title: '优势',
        items: [
          '精确控制输出长度',
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
      title: '使用建议',
      content: '根据您的使用场景选择合适的Token数：\n\n• 简短问答、日常对话：使用较小值（1024-2048）\n• 代码生成、技术文档：使用中等值（4096-8192）\n• 长篇文章、详细分析：使用"无限制"\n• 成本敏感场景：使用较小值并根据需要调整\n\n💡 提示：选择"无限制"时，系统不会传递max_tokens参数给API，让模型使用其支持的最大输出Token数。'
    }
  },
  en: {
    maxTokens: {
      title: 'Set to "Unlimited"',
      pros: {
        title: 'Advantages',
        items: [
          'Use model\'s maximum supported output tokens',
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
      title: 'Set to Specific Value',
      pros: {
        title: 'Advantages',
        items: [
          'Precise control over output length',
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
      title: 'Recommendations',
      content: 'Choose appropriate token count based on your use case:\n\n• Short Q&A, casual conversation: Use smaller values (1024-2048)\n• Code generation, technical docs: Use medium values (4096-8192)\n• Long articles, detailed analysis: Use "Unlimited"\n• Cost-sensitive scenarios: Use smaller values and adjust as needed\n\n💡 Tip: When "Unlimited" is selected, the system will not pass the max_tokens parameter to the API, allowing the model to use its maximum supported output tokens.'
    }
  }
}

