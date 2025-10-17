/**
 * AI Provider 统一客户端
 * 支持多种AI服务商，包括火山引擎、DeepSeek、OpenAI等
 */

const { OpenAI } = require('openai');
const logger = require('./logger.cjs');

/**
 * Provider配置
 */
const PROVIDER_CONFIGS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    supportsThinking: true
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    supportsThinking: true,
    thinkingField: 'reasoning_content' // DeepSeek使用reasoning_content字段
  },
  volcengine: {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1.5-thinking-pro',
    supportsThinking: true,
    thinkingField: 'thinking', // 火山引擎使用thinking字段
    thinkingParam: 'thinking' // 火山引擎通过thinking参数控制
  },
  moonshot: {
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    supportsThinking: false
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'mixtral-8x7b-32768',
    supportsThinking: true
  },
  mistral: {
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    supportsThinking: false
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    supportsThinking: true
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    supportsThinking: true,
    thinkingField: 'thinking',
    thinkingParam: 'thinking' // Claude使用thinking参数
  },
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash-exp',
    supportsThinking: true,
    thinkingParam: 'thinkingConfig'
  }
};

/**
 * 创建AI Provider客户端
 * @param {string} provider - 服务商名称
 * @param {string} apiKey - API密钥
 * @param {Object} options - 其他选项
 */
function createAIClient(provider, apiKey, options = {}) {
  const config = PROVIDER_CONFIGS[provider];

  if (!config) {
    throw new Error(`不支持的provider: ${provider}`);
  }

  if (!apiKey) {
    throw new Error(`${provider} API密钥未配置`);
  }

  const baseURL = options.endpoint || config.baseURL;

  logger.info(`创建 ${provider} 客户端，endpoint: ${baseURL}`);

  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    defaultHeaders: options.headers || {}
  });
}

/**
 * 构建API请求参数
 * @param {string} provider - 服务商名称
 * @param {Object} params - 请求参数
 */
function buildAPIParams(provider, params) {
  const config = PROVIDER_CONFIGS[provider];
  const {
    model,
    messages,
    tools,
    stream = false,
    temperature,
    maxTokens,
    thinkingEnabled = false,
    thinkingBudget
  } = params;

  const apiParams = {
    model: model || config.defaultModel,
    messages: messages,
    stream: stream
  };

  // 添加可选参数
  if (temperature !== undefined) {
    apiParams.temperature = temperature;
  }

  if (maxTokens !== undefined) {
    apiParams.max_tokens = maxTokens;
  }

  // 添加工具
  if (tools && tools.length > 0) {
    apiParams.tools = tools;
    apiParams.tool_choice = 'auto';
  }

  // 处理深度思考参数
  if (config.supportsThinking && thinkingEnabled) {
    // 火山引擎特殊处理
    if (provider === 'volcengine') {
      apiParams.thinking = {
        type: 'enabled'
      };
      logger.info('火山引擎：启用深度思考模式');
    }
    // Anthropic Claude特殊处理
    else if (provider === 'anthropic') {
      apiParams.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget || 10000
      };
      logger.info(`Anthropic：启用Extended Thinking，预算：${thinkingBudget || 10000} tokens`);
    }
    // Google Gemini特殊处理
    else if (provider === 'google') {
      apiParams.thinkingConfig = {
        thinkingBudget: thinkingBudget || 1024,
        includeThoughts: true
      };
      logger.info('Google Gemini：启用Deep Think模式');
    }
    // DeepSeek和其他OpenAI兼容的服务商
    else {
      // 对于DeepSeek等，深度思考是内置的，不需要特殊参数
      // 但可以通过模型选择来控制（如deepseek-reasoner vs deepseek-chat）
      logger.info(`${provider}：模型 ${apiParams.model} 支持深度思考`);
    }
  }

  return apiParams;
}

/**
 * 处理流式响应
 * @param {AsyncIterable} stream - 流式响应
 * @param {Object} res - Express响应对象
 * @param {string} provider - 服务商名称
 */
async function handleStreamResponse(stream, res, provider) {
  const config = PROVIDER_CONFIGS[provider];
  const thinkingField = config.thinkingField || 'reasoning_content';

  try {
    let chunkCount = 0;
    let fullContent = '';
    let fullThinking = '';

    for await (const chunk of stream) {
      chunkCount++;
      const delta = chunk.choices[0]?.delta;

      // 处理思考内容
      if (delta?.[thinkingField]) {
        fullThinking += delta[thinkingField];
        const payload = JSON.stringify({
          type: 'reasoning',
          content: delta[thinkingField],
          fullReasoning: fullThinking
        });
        res.write(`data: ${payload}\n\n`);

        if (chunkCount <= 3) {
          logger.info(`[${provider}] 发送thinking chunk #${chunkCount}`);
        }
      }

      // 处理回答内容
      if (delta?.content) {
        fullContent += delta.content;
        const payload = JSON.stringify({
          type: 'content',
          content: delta.content,
          fullContent: fullContent
        });
        res.write(`data: ${payload}\n\n`);

        if (chunkCount <= 3) {
          logger.info(`[${provider}] 发送content chunk #${chunkCount}`);
        }
      }

      // 检查是否完成
      if (chunk.choices[0]?.finish_reason) {
        logger.info(`[${provider}] 流式传输完成: ${chunk.choices[0].finish_reason}, 总chunks: ${chunkCount}`);
        logger.info(`总内容长度: ${fullContent.length}, 思考长度: ${fullThinking.length}`);

        res.write(`data: ${JSON.stringify({
          type: 'done',
          finish_reason: chunk.choices[0].finish_reason,
          fullContent: fullContent,
          fullReasoning: fullThinking
        })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
    logger.info(`[${provider}] 流式传输结束，共发送 ${chunkCount} 个chunks`);

  } catch (error) {
    logger.error(`[${provider}] 流式传输错误:`, error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
}

/**
 * 处理非流式响应
 * @param {Object} response - API响应
 * @param {string} provider - 服务商名称
 */
function handleNormalResponse(response, provider) {
  const config = PROVIDER_CONFIGS[provider];
  const thinkingField = config.thinkingField || 'reasoning_content';

  const message = response.choices[0]?.message;

  // 提取思考内容和回答内容
  const result = {
    content: message?.content || '',
    reasoning: message?.[thinkingField] || '',
    tool_calls: message?.tool_calls || [],
    finish_reason: response.choices[0]?.finish_reason
  };

  if (result.reasoning) {
    logger.info(`[${provider}] 包含思考内容，长度: ${result.reasoning.length}`);
  }

  return result;
}

/**
 * 获取Provider配置
 */
function getProviderConfig(provider) {
  return PROVIDER_CONFIGS[provider];
}

/**
 * 检查Provider是否支持深度思考
 */
function supportsThinking(provider) {
  const config = PROVIDER_CONFIGS[provider];
  return config?.supportsThinking || false;
}

module.exports = {
  createAIClient,
  buildAPIParams,
  handleStreamResponse,
  handleNormalResponse,
  getProviderConfig,
  supportsThinking,
  PROVIDER_CONFIGS
};
