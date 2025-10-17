import { THINKING_MODE } from './constants.js'

/**
 * 根据模型ID和服务商自动检测深度思考模式
 * @param {string} modelId - 模型ID
 * @param {string} provider - 服务商（可选）
 * @returns {string} 深度思考模式
 */
export function detectThinkingMode(modelId, provider) {
  if (!modelId || typeof modelId !== 'string') {
    return THINKING_MODE.DISABLED
  }

  const lowerModelId = modelId.toLowerCase()
  const lowerProvider = provider ? provider.toLowerCase() : ''

  // 火山引擎特殊处理
  if (lowerProvider === 'volcengine' || lowerProvider === 'volcano') {
    // doubao-1.5-thinking 系列 - 可选模式（默认开启，但可关闭）
    if (lowerModelId.includes('doubao') && lowerModelId.includes('thinking')) {
      return THINKING_MODE.OPTIONAL
    }
    // doubao-seed-1.6-thinking - 可选模式
    if (lowerModelId.includes('doubao-seed-1.6-thinking')) {
      return THINKING_MODE.OPTIONAL
    }
    // doubao-seed-1.6 - 支持深度思考的综合模型
    if (lowerModelId.includes('doubao-seed-1.6')) {
      return THINKING_MODE.OPTIONAL
    }
    // doubao-seed-1.6-flash - 支持深度思考的快速版本
    if (lowerModelId.includes('doubao-seed-1.6-flash')) {
      return THINKING_MODE.OPTIONAL
    }
  }

  // 强制开启模式：包含特定关键词的模型
  const alwaysOnPatterns = [
    // OpenAI o系列
    { pattern: /^o1(-preview|-mini)?$/i, provider: 'openai' },
    { pattern: /^o3(-mini)?$/i, provider: 'openai' },
    { pattern: /^o4-mini$/i, provider: 'openai' },
    // DeepSeek R1系列
    { pattern: /-r1(-zero)?$/i, provider: 'deepseek' },
    { pattern: /^deepseek-r1/i, provider: 'deepseek' },
    { pattern: /reasoner/i, provider: 'deepseek' },
    // Mistral Magistral系列
    { pattern: /magistral/i, provider: 'mistral' },
    // Moonshot Kimi系列
    { pattern: /kimi-k1\.5/i, provider: 'moonshot' },
    { pattern: /kimi-vl-thinking/i, provider: 'moonshot' },
    { pattern: /kimi-researcher/i, provider: 'moonshot' },
    // Groq特定模型
    { pattern: /qwq-32b/i, provider: 'groq' },
    { pattern: /deepseek.*-r1/i, provider: 'groq' },
    // Together AI
    { pattern: /deepseek-r1/i, provider: 'together' },
    { pattern: /moe.*thinking/i, provider: 'together' }
  ]

  for (const { pattern } of alwaysOnPatterns) {
    if (pattern.test(lowerModelId)) {
      return THINKING_MODE.ALWAYS_ON
    }
  }

  // 可选模式：特定模型
  const optionalPatterns = [
    // Claude Extended Thinking
    { pattern: /claude-[34]/, provider: 'anthropic' },
    { pattern: /claude.*sonnet.*4\.5/, provider: 'anthropic' },
    // Google Gemini Deep Think
    { pattern: /gemini-2\.[05]-(pro|flash)/, provider: 'google' },
    { pattern: /gemini.*thinking/i, provider: 'google' },
    // Groq Qwen双模式
    { pattern: /qwen-?3-32b/i, provider: 'groq' }
  ]

  for (const { pattern } of optionalPatterns) {
    if (pattern.test(lowerModelId)) {
      return THINKING_MODE.OPTIONAL
    }
  }

  // 自适应模式：特定模型
  const adaptivePatterns = [
    { pattern: /terminus/i, provider: 'deepseek' },
    { pattern: /gemini-2\.[05]-(pro|flash)/i, provider: 'google' }
  ]

  for (const { pattern } of adaptivePatterns) {
    if (pattern.test(lowerModelId)) {
      return THINKING_MODE.ADAPTIVE
    }
  }

  // 通用thinking关键词检测（作为后备）
  if (lowerModelId.includes('thinking') || lowerModelId.includes('reasoning')) {
    return THINKING_MODE.OPTIONAL
  }

  // 默认为不支持
  return THINKING_MODE.DISABLED
}

/**
 * 获取深度思考模式的描述文本
 * @param {string} mode - 深度思考模式
 * @param {string} language - 语言（'en' 或 'zh'）
 * @returns {object} 包含标题和描述的对象
 */
export function getThinkingModeDescription(mode, language = 'zh') {
  const descriptions = {
    zh: {
      [THINKING_MODE.DISABLED]: {
        label: '不支持',
        tooltip: '当前模型不支持深度思考功能'
      },
      [THINKING_MODE.OPTIONAL]: {
        label: '可选',
        tooltip: '点击切换深度思考模式\n\n开启后，模型会展示详细的推理过程'
      },
      [THINKING_MODE.ALWAYS_ON]: {
        label: '开启 🔒',
        tooltip: '当前模型在训练时内置了深度思考能力，无法关闭\n\n所有回复都会包含思考过程'
      },
      [THINKING_MODE.ADAPTIVE]: {
        label: '自动 🤖',
        tooltip: '当前模型会根据问题的复杂度自动判断是否使用深度思考\n\n简单问题：快速回复\n复杂问题：深度思考'
      }
    },
    en: {
      [THINKING_MODE.DISABLED]: {
        label: 'Not Supported',
        tooltip: 'This model does not support deep thinking'
      },
      [THINKING_MODE.OPTIONAL]: {
        label: 'Optional',
        tooltip: 'Click to toggle deep thinking mode\n\nWhen enabled, the model will show detailed reasoning process'
      },
      [THINKING_MODE.ALWAYS_ON]: {
        label: 'Always On 🔒',
        tooltip: 'This model has built-in deep thinking capability and cannot be disabled\n\nAll responses will include thinking process'
      },
      [THINKING_MODE.ADAPTIVE]: {
        label: 'Adaptive 🤖',
        tooltip: 'This model automatically decides whether to use deep thinking based on question complexity\n\nSimple questions: Quick response\nComplex questions: Deep thinking'
      }
    }
  }

  return descriptions[language]?.[mode] || descriptions.zh[THINKING_MODE.DISABLED]
}

/**
 * 判断深度思考按钮是否应该禁用
 * @param {string} mode - 深度思考模式
 * @returns {boolean} 是否禁用
 */
export function isThinkingButtonDisabled(mode) {
  return mode === THINKING_MODE.DISABLED || 
         mode === THINKING_MODE.ALWAYS_ON || 
         mode === THINKING_MODE.ADAPTIVE
}

/**
 * 判断是否应该在API请求中启用深度思考
 * @param {string} mode - 深度思考模式
 * @param {boolean} userEnabled - 用户是否开启了深度思考
 * @param {string} provider - 服务商（可选，用于特殊处理）
 * @returns {boolean} 是否启用深度思考
 */
export function shouldEnableThinking(mode, userEnabled, provider) {
  // 火山引擎特殊处理：支持通过thinking参数控制
  if (provider === 'volcengine' || provider === 'volcano') {
    switch (mode) {
      case THINKING_MODE.DISABLED:
        return false
      case THINKING_MODE.ALWAYS_ON:
        return true
      case THINKING_MODE.OPTIONAL:
        return userEnabled // 火山引擎的thinking模型支持开关
      case THINKING_MODE.ADAPTIVE:
        return true
      default:
        return false
    }
  }

  // 其他服务商的通用逻辑
  switch (mode) {
    case THINKING_MODE.DISABLED:
      return false
    case THINKING_MODE.ALWAYS_ON:
      return true
    case THINKING_MODE.ADAPTIVE:
      return true  // 对于自适应模式，我们不发送thinking参数，让模型自己决定
    case THINKING_MODE.OPTIONAL:
      return userEnabled
    default:
      return false
  }
}

/**
 * 判断是否应该发送thinking参数到API
 * @param {string} mode - 深度思考模式
 * @returns {boolean} 是否发送参数
 */
export function shouldSendThinkingParam(mode) {
  // 自适应模式不发送参数，让模型自己决定
  return mode !== THINKING_MODE.ADAPTIVE
}

