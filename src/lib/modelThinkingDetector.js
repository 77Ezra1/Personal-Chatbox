import { THINKING_MODE } from './constants.js'

/**
 * 根据模型ID自动检测深度思考模式
 * @param {string} modelId - 模型ID
 * @returns {string} 深度思考模式
 */
export function detectThinkingMode(modelId) {
  if (!modelId || typeof modelId !== 'string') {
    return THINKING_MODE.DISABLED
  }

  const lowerModelId = modelId.toLowerCase()

  // 强制开启模式：包含特定关键词的模型
  const alwaysOnPatterns = [
    '-r1',           // DeepSeek R1 系列
    'reasoner',      // DeepSeek Reasoner
    'thinking'       // 包含 thinking 的模型（如 doubao-thinking）
  ]

  for (const pattern of alwaysOnPatterns) {
    if (lowerModelId.includes(pattern)) {
      return THINKING_MODE.ALWAYS_ON
    }
  }

  // 自适应模式：特定模型
  const adaptivePatterns = [
    'terminus'       // DeepSeek Terminus 系列
  ]

  for (const pattern of adaptivePatterns) {
    if (lowerModelId.includes(pattern)) {
      return THINKING_MODE.ADAPTIVE
    }
  }

  // 默认为可选模式（保守策略）
  return THINKING_MODE.OPTIONAL
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
 * @returns {boolean} 是否启用深度思考
 */
export function shouldEnableThinking(mode, userEnabled) {
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

