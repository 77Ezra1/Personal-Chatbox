/**
 * 模型兼容性配置
 * 定义各个模型对 Function Calling / Tool Use 的支持情况
 *
 * 数据来源: 基于2025年10月最新搜索结果
 * 更新日期: 2025年1月24日
 * 覆盖服务商: 项目中的9个服务商
 */

/**
 * 模型 Function Calling 支持级别
 */
export const FUNCTION_CALLING_SUPPORT = {
  FULL: 'full',           // 完全支持，稳定可靠
  PARTIAL: 'partial',     // 部分支持，可能不稳定
  EXPERIMENTAL: 'experimental', // 实验性支持，不推荐生产使用
  NONE: 'none'           // 不支持
};

/**
 * 模型兼容性数据库
 *
 * 基于项目实际支持的9个服务商:
 * 1. OpenAI
 * 2. DeepSeek
 * 3. Moonshot
 * 4. Groq
 * 5. Mistral
 * 6. Together AI
 * 7. Anthropic
 * 8. Google Gemini
 * 9. Volcengine (字节跳动)
 */
export const MODEL_COMPATIBILITY = {
  // ============================================
  // OpenAI
  // ============================================
  openai: {
    // GPT-5 系列 (2025年8-10月发布)
    'gpt-5': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'GPT-5 最新旗舰模型（2025年8月发布），Function Calling 支持最完善，推理能力极强'
    },
    'gpt-5-pro': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: true,
      streaming: true,
      contextWindow: 400000,
      notes: 'GPT-5 Pro API（2025年10月发布），400K超长上下文，专业版深度推理优化'
    },
    'gpt-5-mini': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'GPT-5 Mini 轻量版本，性价比极高，Function Calling 稳定可靠'
    },

    // GPT-4o 系列
    'gpt-4o': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'GPT-4o 旗舰模型，Function Calling 支持完善'
    },
    'gpt-4o-audio-preview': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'GPT-4o 音频预览版（2025年1月发布），支持音频处理和Function Calling'
    },
    'gpt-4o-mini': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'GPT-4o Mini 性价比极高，Function Calling 稳定可靠'
    },

    // GPT-4 系列
    'gpt-4-turbo': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'GPT-4 Turbo，Function Calling 支持优秀'
    },
    'gpt-4': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 8192,
      notes: 'GPT-4 经典模型，Function Calling 支持完善'
    },

    // GPT-3.5 系列
    'gpt-3.5-turbo': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 16385,
      notes: 'GPT-3.5 Turbo，Function Calling 支持良好'
    },

    // o系列推理模型 (不支持Function Calling)
    'o1': {
      functionCalling: FUNCTION_CALLING_SUPPORT.NONE,
      reasoning: true,
      multimodal: false,
      streaming: false,
      contextWindow: 200000,
      notes: '⚠️ 推理模型，不支持 Function Calling'
    },
    'o1-mini': {
      functionCalling: FUNCTION_CALLING_SUPPORT.NONE,
      reasoning: true,
      multimodal: false,
      streaming: false,
      contextWindow: 128000,
      notes: '⚠️ 推理模型，不支持 Function Calling'
    },
    'o1-preview': {
      functionCalling: FUNCTION_CALLING_SUPPORT.NONE,
      reasoning: true,
      multimodal: false,
      streaming: false,
      contextWindow: 128000,
      notes: '⚠️ 推理模型，不支持 Function Calling'
    }
  },

  // ============================================
  // Anthropic Claude
  // ============================================
  anthropic: {
    // Claude 3.7 系列 (2025年7-9月发布)
    'claude-3-7-sonnet': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3.7 Sonnet（2025年7-9月发布），Tool Use 功能质量最高，增强对话理解能力'
    },

    // Claude 3.5 系列
    'claude-3-5-sonnet-20241022': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3.5 Sonnet 最新版本，Tool Use 功能质量极高'
    },
    'claude-3-5-sonnet-20240620': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3.5 Sonnet 2024年6月版本，Tool Use 支持优秀'
    },
    'claude-3-5-haiku-20241022': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3.5 Haiku，快速且便宜，Tool Use 支持完善'
    },

    // Claude 3 系列
    'claude-3-opus-20240229': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3 Opus，Tool Use 支持完善，适合复杂任务'
    },
    'claude-3-sonnet-20240229': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3 Sonnet，Tool Use 支持优秀'
    },
    'claude-3-haiku-20240307': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 200000,
      notes: 'Claude 3 Haiku，快速且便宜，Tool Use 支持良好'
    }
  },

  // ============================================
  // Google Gemini
  // ============================================
  google: {
    // Gemini 2.0 系列 (2025年8-10月发布)
    'gemini-2.0': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 2000000,
      notes: 'Gemini 2.0 最新版本（2025年8-10月发布），Function Calling 增强，提升多模态处理能力'
    },
    'gemini-2.0-flash': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 1000000,
      notes: 'Gemini 2.0 Flash，原生工具使用，100万上下文'
    },
    'gemini-2.0-flash-exp': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 1000000,
      notes: 'Gemini 2.0 Flash 实验版本'
    },

    // Gemini 1.5 系列
    'gemini-1.5-pro': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 2000000,
      notes: 'Gemini 1.5 Pro，200万上下文，Function Calling 支持强大'
    },
    'gemini-1.5-pro-latest': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 2000000,
      notes: 'Gemini 1.5 Pro 最新版本'
    },
    'gemini-1.5-flash': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 1000000,
      notes: 'Gemini 1.5 Flash，价格便宜，Function Calling 支持良好'
    },
    'gemini-1.5-flash-8b': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 1000000,
      notes: 'Gemini 1.5 Flash 8B 轻量版本'
    },

    // Gemini Pro
    'gemini-pro': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32760,
      notes: 'Gemini Pro，Function Calling 支持完善'
    }
  },

  // ============================================
  // DeepSeek
  // ============================================
  deepseek: {
    // DeepSeek V3 系列 (2025年8-9月发布)
    'deepseek-v3.2': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: true,
      streaming: true,
      contextWindow: 131072,
      notes: 'DeepSeek V3.2（2025年9月30日发布），最新版本，685B参数，增强Function Calling和推理能力'
    },
    'deepseek-v3.1': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'DeepSeek V3.1（2025年8月发布），685B参数，混合推理架构，Agent能力增强'
    },
    'deepseek-v3': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 64000,
      notes: 'DeepSeek V3，671B参数，Function Calling 支持完善'
    },
    'deepseek-v2.5': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 64000,
      notes: 'DeepSeek V2.5，数学、代码、写作能力提升，支持联网搜索'
    },

    // DeepSeek Chat
    'deepseek-chat': {
      functionCalling: FUNCTION_CALLING_SUPPORT.PARTIAL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 64000,
      notes: '⚠️ 理论支持但不稳定，经常选择伪造答案而不是调用工具，不推荐用于工具调用场景'
    },

    // DeepSeek R1 系列 (推理模型，不支持Function Calling)
    'deepseek-r1': {
      functionCalling: FUNCTION_CALLING_SUPPORT.NONE,
      reasoning: true,
      multimodal: false,
      streaming: true,
      contextWindow: 64000,
      notes: '⚠️ R1 推理模型，性能媲美OpenAI o1，不支持 Function Calling'
    },
    'deepseek-reasoner': {
      functionCalling: FUNCTION_CALLING_SUPPORT.NONE,
      reasoning: true,
      multimodal: false,
      streaming: true,
      contextWindow: 64000,
      notes: '⚠️ 推理模型，不支持 Function Calling'
    }
  },

  // ============================================
  // Mistral
  // ============================================
  mistral: {
    // Mistral Large 系列 (2025年6-10月发布)
    'mistral-large-24.11': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'Mistral Large 24.11（2025年10月发布），最新版本，增强多模态处理能力和Function Calling'
    },
    'mistral-large-latest': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 128000,
      notes: 'Mistral Large 最新版本，123B参数，Function Calling 支持完善'
    },

    // Mistral Medium/Small
    'mistral-medium-latest': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: 'Mistral Medium，Function Calling 支持良好'
    },
    'mistral-small-latest': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: 'Mistral Small，Function Calling 支持完善'
    },
    'mistral-7b': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: 'Mistral 7B（2025年6-7月发布），高效推理性能，Function Calling 支持良好'
    },

    // Pixtral (多模态)
    'pixtral-large-latest': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 128000,
      notes: 'Mistral 多模态模型，支持 Function Calling'
    }
  },

  // ============================================
  // Groq
  // ============================================
  groq: {
    // Groq 2025 系列
    'groq-llm-2025': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Groq-LLM 2025（2025年10月发布），最新版本，优化推理速度和准确性'
    },
    'groq-3': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Groq 3（2025年7月发布），优化推理速度和能效，Function Calling 支持完善'
    },

    // Llama 系列 (通过Groq运行)
    'llama-3.3-70b-versatile': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.3 70B，Function Calling 支持完善，速度极快'
    },
    'llama-3.1-70b-versatile': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.1 70B，Function Calling 支持良好，速度极快'
    },
    'llama-3.1-8b-instant': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.1 8B，Function Calling 支持良好，速度极快'
    },
    'llama-3.2-90b-vision-preview': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.2 90B 多模态版本，支持 Function Calling'
    },

    // Mixtral 系列
    'mixtral-8x7b-32768': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32768,
      notes: 'Mixtral 8x7B，Function Calling 支持良好'
    }
  },

  // ============================================
  // Together AI
  // ============================================
  together: {
    // Qwen 系列 (2025年6-9月发布)
    'qwen-3-vl': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: true,
      streaming: true,
      contextWindow: 32768,
      notes: 'Qwen 3 VL（2025年9月28日发布），多模态处理能力，Function Calling 支持完善'
    },
    'qwen-2.5-72b': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32768,
      notes: 'Qwen 2.5 72B（2025年6-8月发布），中文能力强，Function Calling 支持良好'
    },
    'qwen-2.5-7b': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32768,
      notes: 'Qwen 2.5 7B，中文能力优秀，Function Calling 支持良好'
    },

    // Llama 系列
    'meta-llama/llama-3.3-70b-instruct-turbo': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.3 70B，Function Calling 支持完善'
    },
    'meta-llama/llama-3.1-70b-instruct-turbo': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.1 70B，Function Calling 支持良好'
    },
    'meta-llama/llama-3.1-8b-instruct-turbo': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 131072,
      notes: 'Llama 3.1 8B，Function Calling 支持良好'
    }
  },

  // ============================================
  // Moonshot (月之暗面 Kimi)
  // ============================================
  moonshot: {
    // Kimi K2 系列 (2025年9-10月发布)
    'kimi-k2': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: true,
      streaming: true,
      contextWindow: 256000,
      notes: 'Kimi K2 最新版本（2025年10月发布），万亿级参数，激活320亿，256K超长上下文，智能体能力极强'
    },
    'kimi-k2-0905': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: false,
      streaming: true,
      contextWindow: 256000,
      notes: 'Kimi K2 0905版本（2025年9月5日发布），增强编码能力和智能体性能，Function Calling 支持完善'
    },

    // Moonshot V1 系列
    'moonshot-v1-128k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 128000,
      notes: 'Moonshot V1 128K 版本，Function Calling 支持完善，超长上下文'
    },
    'moonshot-v1-32k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: 'Moonshot V1 32K 版本，Function Calling 支持完善，中文优秀'
    },
    'moonshot-v1-8k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 8000,
      notes: 'Moonshot V1 8K 版本，Function Calling 支持良好，中文能力优秀'
    }
  },

  // ============================================
  // Volcengine (火山引擎/字节跳动)
  // ============================================
  volcengine: {
    // Hunyuan 系列 (腾讯混元，2025年7月发布)
    'hunyuan-a13b-instruct': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: true,
      multimodal: false,
      streaming: true,
      contextWindow: 32768,
      notes: '腾讯混元 A13B（2025年7月发布），130亿激活参数的MoE模型，总参数800亿，支持思维链推理，中文处理能力强'
    },

    // 豆包大模型系列
    'doubao-pro-32k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: '豆包 Pro 32K，Function Calling 支持良好，中文能力强'
    },
    'doubao-pro-4k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 4000,
      notes: '豆包 Pro 4K 版本，Function Calling 支持良好'
    },
    'doubao-lite-32k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: '豆包 Lite 32K，Function Calling 支持良好，价格便宜'
    },
    'doubao-lite-4k': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 4000,
      notes: '豆包 Lite 4K 版本，价格便宜'
    },

    // ChatGLM 系列
    'chatglm3-6b': {
      functionCalling: FUNCTION_CALLING_SUPPORT.FULL,
      reasoning: false,
      multimodal: false,
      streaming: true,
      contextWindow: 32000,
      notes: 'ChatGLM3 6B（2025年发布），智谱AI和清华大学，Function Calling 支持良好，中文优秀'
    }
  }
};

/**
 * 获取模型的兼容性信息
 * @param {string} provider - 服务商ID
 * @param {string} model - 模型名称
 * @returns {Object|null} 兼容性信息，如果未找到返回null
 */
export function getModelCompatibility(provider, model) {
  if (!provider || !model) return null;

  const providerModels = MODEL_COMPATIBILITY[provider];
  if (!providerModels) return null;

  return providerModels[model] || null;
}

/**
 * 检查模型是否支持 Function Calling
 * @param {string} provider - 服务商ID
 * @param {string} model - 模型名称
 * @returns {boolean} 是否支持（包括完全支持和部分支持）
 */
export function supportsFunctionCalling(provider, model) {
  const compat = getModelCompatibility(provider, model);
  if (!compat) return true; // 未知模型默认假设支持，避免误拦截

  return compat.functionCalling !== FUNCTION_CALLING_SUPPORT.NONE;
}

/**
 * 检查模型是否完全支持 Function Calling（推荐使用）
 * @param {string} provider - 服务商ID
 * @param {string} model - 模型名称
 * @returns {boolean} 是否完全支持
 */
export function hasFullFunctionCallingSupport(provider, model) {
  const compat = getModelCompatibility(provider, model);
  if (!compat) return false;

  return compat.functionCalling === FUNCTION_CALLING_SUPPORT.FULL;
}

/**
 * 获取 Function Calling 支持级别的描述文本
 * @param {string} level - 支持级别
 * @returns {string} 描述文本
 */
export function getFunctionCallingSupportLabel(level) {
  switch (level) {
    case FUNCTION_CALLING_SUPPORT.FULL:
      return '✅ 完全支持';
    case FUNCTION_CALLING_SUPPORT.PARTIAL:
      return '⚠️ 部分支持（不稳定）';
    case FUNCTION_CALLING_SUPPORT.EXPERIMENTAL:
      return '🧪 实验性支持';
    case FUNCTION_CALLING_SUPPORT.NONE:
      return '❌ 不支持';
    default:
      return '❓ 未知';
  }
}

/**
 * 获取推荐的支持 Function Calling 的模型列表
 * @returns {Array} 推荐模型列表
 */
export function getRecommendedModelsForFunctionCalling() {
  const recommended = [];

  for (const [provider, models] of Object.entries(MODEL_COMPATIBILITY)) {
    for (const [modelName, config] of Object.entries(models)) {
      if (config.functionCalling === FUNCTION_CALLING_SUPPORT.FULL) {
        recommended.push({
          provider,
          model: modelName,
          name: `${provider}/${modelName}`,
          ...config
        });
      }
    }
  }

  return recommended;
}
