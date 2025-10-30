/**
 * Chat API 路由
 * 处理与 AI 模型的对话,集成 MCP 工具调用
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { db } = require('../db/init.cjs');

// OpenAI SDK
const { OpenAI } = require('openai');

// 🔥 新增：工具调用优化器
const { toolCallOptimizer } = require('../services/tool-call-optimizer.cjs');

// 🔥 新增：动态Prompt生成器
const { generateDynamicSystemPrompt } = require('../utils/dynamic-prompt-generator.cjs');

/**
 * 从数据库获取用户的 API key
 * @param {number} userId - 用户ID
 * @param {string} provider - 服务提供商 (如 'deepseek', 'openai')
 * @returns {Promise<string|null>} API key 或 null
 */
async function getUserApiKey(userId, provider) {
  try {
    const config = await db.prepare(
      'SELECT api_keys FROM user_configs WHERE user_id = ?'
    ).get(userId);

    if (!config || !config.api_keys) {
      return null;
    }

    const apiKeys = JSON.parse(config.api_keys);
    return apiKeys[provider] || null;
  } catch (error) {
    logger.error(`[User ${userId}] 获取 API key 失败:`, error);
    return null;
  }
}

/**
 * 创建 OpenAI 客户端实例
 * 从数据库读取用户配置的 API key（不使用环境变量）
 * @param {number} userId - 用户ID
 * @returns {Promise<OpenAI>} OpenAI 客户端实例
 */
async function createOpenAIClient(userId) {
  try {
    // 从数据库读取用户配置的 API key
    const apiKey = await getUserApiKey(userId, 'deepseek');

    if (!apiKey) {
      logger.warn(`[User ${userId}] DeepSeek API key 未配置`);
      throw new Error('DeepSeek API key 未配置，请在设置中配置 API 密钥');
    }

    logger.info(`[User ${userId}] 使用数据库中的用户配置 API key`);

    return new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });
  } catch (error) {
    logger.error(`[User ${userId}] 创建 OpenAI 客户端失败:`, error);
    throw error;
  }
}

// MCP Manager 实例(由 initializeRouter 设置)
let mcpManager = null;
// 所有服务实例(由 initializeRouter 设置)
let allServices = {};

/**
 * 调用原有服务的工具
 * @param {string} toolName - 工具名称
 * @param {Object} parameters - 工具参数
 * @returns {Promise<Object>} 工具执行结果
 */
async function callLegacyServiceTool(toolName, parameters) {
  // 遍历所有服务，查找拥有该工具的服务
  for (const [serviceId, service] of Object.entries(allServices)) {
    if (serviceId === 'mcpManager') continue;

    if (service && service.enabled && typeof service.getTools === 'function') {
      const tools = service.getTools();
      const hasTool = tools.some(tool => tool.function.name === toolName);

      if (hasTool && typeof service.execute === 'function') {
        logger.info(`使用服务 ${serviceId} 执行工具 ${toolName}`);
        return await service.execute(toolName, parameters);
      }
    }
  }

  throw new Error(`未找到工具: ${toolName}`);
}

/**
 * 初始化路由
 * @param {Object} services - 服务实例
 */
function initializeRouter(services) {
  mcpManager = services.mcpManager;
  allServices = services;
  logger.info('Chat 路由已初始化');
}

// ========= 实时时间依赖工具辅助逻辑 =========
const TIME_TOOL_NAMES = new Set([
  'get_current_time',
  'time_get_current_time'
]);

const REALTIME_SERVICE_IDS = new Set([
  'weather',
  'coincap',
  'dexscreener',
  'brave_search',
  'search',
  'news',
  'calendar'
]);

const REALTIME_NAME_PATTERNS = [
  /weather/i,
  /forecast/i,
  /temperature/i,
  /humidity/i,
  /wind/i,
  /price/i,
  /market/i,
  /stock/i,
  /news/i,
  /schedule/i,
  /event/i
];

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Shanghai';

function resolveToolInfo(toolName) {
  let actualToolName = toolName;
  let serviceId = null;
  let isMcp = false;

  if (toolName.includes('_') && mcpManager && typeof mcpManager.parseToolName === 'function') {
    try {
      const parsed = mcpManager.parseToolName(toolName);
      if (parsed?.toolName) {
        actualToolName = parsed.toolName;
        serviceId = parsed.serviceId || null;
        isMcp = true;
      }
    } catch (error) {
      logger.warn(`解析工具名称失败: ${toolName}`, error.message);
    }
  }

  return {
    fullName: toolName,
    actualName: actualToolName,
    serviceId,
    isMcp
  };
}

function isCurrentTimeTool(toolInfo) {
  const name = (toolInfo.actualName || '').toLowerCase();
  return TIME_TOOL_NAMES.has(name);
}

function requiresTimeContext(toolInfo) {
  if (!toolInfo) return false;

  if (isCurrentTimeTool(toolInfo)) {
    return false;
  }

  if (toolInfo.serviceId && REALTIME_SERVICE_IDS.has(toolInfo.serviceId)) {
    logger.info(`[TimeContext] 工具 ${toolInfo.fullName} 需要时间上下文（服务ID匹配）: ${toolInfo.serviceId}`);
    return true;
  }

  const name = (toolInfo.actualName || '').toLowerCase();
  const matches = REALTIME_NAME_PATTERNS.some(pattern => pattern.test(name));
  if (matches) {
    logger.info(`[TimeContext] 工具 ${toolInfo.fullName} 需要时间上下文（名称模式匹配）: ${name}`);
  }
  return matches;
}

function safeParseJson(text, fallback = {}) {
  if (!text || typeof text !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
}

function determinePreferredTimezone(toolCall, fallback = DEFAULT_TIMEZONE) {
  if (!toolCall || !toolCall.function) {
    return fallback;
  }

  const args = safeParseJson(toolCall.function.arguments);
  const tz = args.timezone || args.timeZone || args.tz;

  if (typeof tz === 'string' && tz.trim()) {
    return tz.trim();
  }

  return fallback;
}

function ensureTimeToolOrder(toolCalls, { timezone = DEFAULT_TIMEZONE, skip = false } = {}) {
  logger.info(`[TimeContext] ensureTimeToolOrder 被调用: skip=${skip}, toolCalls数量=${toolCalls?.length || 0}`);

  if (skip || !Array.isArray(toolCalls) || toolCalls.length === 0) {
    logger.info(`[TimeContext] 跳过时间注入: skip=${skip}, isArray=${Array.isArray(toolCalls)}, length=${toolCalls?.length || 0}`);
    return { injected: false, timezone };
  }

  let hasTimeCall = false;
  let firstRealtimeIndex = -1;
  let chosenTimezone = timezone;

  toolCalls.forEach((call, index) => {
    const toolName = call?.function?.name || '';
    const info = resolveToolInfo(toolName);
    logger.info(`[TimeContext] 检查工具 [${index}]: ${toolName}, actualName=${info.actualName}, serviceId=${info.serviceId}`);

    if (!hasTimeCall && isCurrentTimeTool(info)) {
      hasTimeCall = true;
      logger.info(`[TimeContext] 发现时间工具，无需注入`);
    }

    if (firstRealtimeIndex === -1 && requiresTimeContext(info)) {
      firstRealtimeIndex = index;
      chosenTimezone = determinePreferredTimezone(call, chosenTimezone);
      logger.info(`[TimeContext] 发现需要时间上下文的工具，索引=${index}, 时区=${chosenTimezone}`);
    }
  });

  if (hasTimeCall || firstRealtimeIndex === -1) {
    logger.info(`[TimeContext] 不注入时间工具: hasTimeCall=${hasTimeCall}, firstRealtimeIndex=${firstRealtimeIndex}`);
    return { injected: false, timezone: chosenTimezone };
  }

  const injectedCall = {
    id: `${toolCalls[firstRealtimeIndex]?.id || 'auto'}__time_context`,
    type: 'function',
    function: {
      name: 'get_current_time',
      arguments: JSON.stringify({ timezone: chosenTimezone })
    }
  };

  toolCalls.splice(firstRealtimeIndex, 0, injectedCall);
  logger.info(`[TimeContext] ✅ 成功注入 get_current_time 工具，位置=${firstRealtimeIndex}, 时区=${chosenTimezone}`);
  return { injected: true, timezone: chosenTimezone };
}

/**
 * POST /api/chat
 * 处理对话请求
 * 需要认证：从数据库读取用户的 API key
 */
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    let { messages, model = 'deepseek-chat', stream = false } = req.body;

    console.log('🔥🔥🔥 [Backend /api/chat] ===== 收到请求 =====');
    console.log('🔥🔥🔥 [Backend /api/chat] stream 参数:', stream, typeof stream);
    console.log('🔥🔥🔥 [Backend /api/chat] model:', model);
    console.log('🔥🔥🔥 [Backend /api/chat] messages数量:', messages?.length);

    let hasFetchedRealtimeTime = false;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: '无效的请求: messages 必须是数组'
      });
    }

    logger.info(`[User ${userId}] 收到对话请求: model=${model}, stream=${stream}, messages=${messages.length}条`);

    // ✅ 按需加载：首次对话时自动加载用户的MCP服务
    if (mcpManager && !mcpManager.userServicesLoaded.has(userId)) {
      logger.info(`[Chat] 用户 ${userId} 的MCP服务未加载，开始自动加载...`);
      try {
        await mcpManager.loadUserServices(userId);
        logger.info(`[Chat] 用户 ${userId} 的MCP服务自动加载完成`);
      } catch (error) {
        logger.warn(`[Chat] 加载用户 ${userId} 的MCP服务失败:`, error.message);
        // 不阻断对话流程，继续使用已加载的服务
      }
    }

    // 获取所有可用的工具（包括MCP工具和原有服务工具）
    let allTools = [];

    // 1. 获取MCP工具（传递userId以获取该用户的工具）
    const mcpTools = mcpManager ? mcpManager.getAllTools(userId) : [];
    allTools.push(...mcpTools);
    logger.info(`[User ${userId}] MCP工具数量: ${mcpTools.length}`);

    // 2. 获取原有服务的工具（weather, time, search, dexscreener, fetch, playwright等）
    for (const [serviceId, service] of Object.entries(allServices)) {
      // 跳过mcpManager（已经处理过了）
      if (serviceId === 'mcpManager') continue;

      // 检查服务是否启用并且有getTools方法
      if (service && service.enabled && typeof service.getTools === 'function') {
        try {
          const serviceTools = service.getTools();
          if (Array.isArray(serviceTools) && serviceTools.length > 0) {
            allTools.push(...serviceTools);
            logger.info(`${serviceId} 工具数量: ${serviceTools.length}`);
          }
        } catch (error) {
          logger.warn(`获取 ${serviceId} 工具失败:`, error.message);
        }
      }
    }

    logger.info(`总工具数量: ${allTools.length}`);

    // 🔥 使用优化器增强工具描述（添加成功示例和统计信息）
    const enhancedTools = toolCallOptimizer.enhanceToolDescriptions(allTools);

    // 🔥 生成动态System Prompt（基于可用工具）
    const dynamicSystemPrompt = generateDynamicSystemPrompt(enhancedTools, {
      scenario: 'general' // 可以根据用户设置或对话内容动态调整
    });

    // 准备 API 请求参数
    const apiParams = {
      model,
      messages: [...messages]
    };

    // 🔥 将动态System Prompt注入到消息开头
    if (dynamicSystemPrompt && enhancedTools.length > 0) {
      // 检查是否已有system消息
      const hasSystemMessage = apiParams.messages.some(msg => msg.role === 'system');

      if (!hasSystemMessage) {
        // 在消息开头添加system prompt
        apiParams.messages.unshift({
          role: 'system',
          content: dynamicSystemPrompt
        });
        logger.info(`[Chat] 注入动态System Prompt（${enhancedTools.length}个工具）`);
      } else {
        logger.warn('[Chat] 消息中已存在system prompt，跳过注入（用户可能设置了自定义prompt）');
      }
    }

    // 如果有工具,添加到请求中
    if (enhancedTools.length > 0) {
      apiParams.tools = enhancedTools.map(tool => {
        // 增强工具描述，帮助大模型更好地理解和选择工具
        let enhancedDescription = tool.function.description || '';

        // 根据工具名称添加使用场景说明
        // MCP服务工具
        if (tool.function.name.includes('wikipedia')) {
          enhancedDescription = `[百科知识查询] ${enhancedDescription}。适用于：查询历史事件、人物传记、科学概念、地理信息等百科知识。`;
        } else if (tool.function.name.includes('brave_search')) {
          enhancedDescription = `[网页搜索-Brave-首选] 使用Brave搜索引擎进行高质量网络搜索。适用于：通用网页搜索、最新新闻、实时信息、产品评测、技术文档、学术资料、教程指南等所有需要搜索的场景。优势：速度快、结果准确、稳定可靠、不易被限流，支持最多20条结果。这是推荐的首选搜索工具。`;
        } else if (tool.function.name.includes('github')) {
          enhancedDescription = `[GitHub仓库操作] ${enhancedDescription}。适用于：查询代码仓库、创建Issue、管理PR等GitHub相关操作。`;
        } else if (tool.function.name.includes('filesystem')) {
          enhancedDescription = `[文件系统操作] ${enhancedDescription}。适用于：读写本地文件、搜索文件、管理目录等文件操作。`;
        } else if (tool.function.name.includes('git')) {
          enhancedDescription = `[Git版本控制] ${enhancedDescription}。适用于：查看提交历史、分支管理、代码差异等Git操作。`;
        } else if (tool.function.name.includes('sqlite')) {
          enhancedDescription = `[数据库查询] ${enhancedDescription}。适用于：执行SQL查询、数据存储、数据分析等数据库操作。`;
        } else if (tool.function.name.includes('memory')) {
          enhancedDescription = `[记忆存储] ${enhancedDescription}。适用于：保存对话上下文、存储用户偏好、记录重要信息等。`;
        } else if (tool.function.name.includes('sequential_thinking')) {
          enhancedDescription = `[结构化思考] ${enhancedDescription}。适用于：复杂问题分解、逻辑推理、决策分析等需要深度思考的场景。`;
        }
        // 原有服务工具
        else if (tool.function.name.includes('search_token') || tool.function.name.includes('get_token_price') || tool.function.name.includes('get_trending_tokens')) {
          enhancedDescription = `[加密货币实时数据] ${enhancedDescription}。适用于：查询加密货币价格、市场数据、热门代币、交易对信息等。使用Dexscreener API。`;
        } else if (tool.function.name.includes('weather')) {
          enhancedDescription = `[天气查询] ${enhancedDescription}。适用于：查询当前天气、天气预报、温度、降水等气象信息。`;
        } else if (tool.function.name.includes('time') || tool.function.name.includes('convert_time')) {
          enhancedDescription = `[时间查询] ${enhancedDescription}。适用于：查询当前时间、时区转换、世界时钟等时间相关操作。`;
        } else if (tool.function.name === 'search_web') {
          enhancedDescription = `[网页搜索-DuckDuckGo-备用] 使用DuckDuckGo进行网络搜索。适用于：通用网页搜索、查找资料等。注意：此工具容易被限流导致搜索失败，建议优先使用Brave Search。仅在Brave Search不可用时使用此备用工具。`;
        } else if (tool.function.name.includes('fetch_url')) {
          enhancedDescription = `[网页内容抓取] ${enhancedDescription}。适用于：获取网页完整内容、提取文章正文、转换为Markdown格式等。`;
        } else if (tool.function.name.includes('navigate') || tool.function.name.includes('click') || tool.function.name.includes('page')) {
          enhancedDescription = `[浏览器自动化] ${enhancedDescription}。适用于：模拟浏览器操作、网页交互、自动化测试等需要真实浏览器环境的场景。`;
        }

        return {
          type: tool.type,
          function: {
            ...tool.function,
            description: enhancedDescription
          }
        };
      });
      apiParams.tool_choice = 'auto';

      // 记录增强后的工具描述
      logger.info(`工具列表: ${apiParams.tools.map(t => t.function.name).join(', ')}`);
    }

    // 创建 OpenAI 客户端（从数据库读取用户配置的 API key）
    const openai = await createOpenAIClient(userId);

    // 调用 DeepSeek API（第一次调用不使用流式，因为可能有工具调用）
    logger.info(`调用 DeepSeek API，参数: ${JSON.stringify({
      model: apiParams.model,
      messages_count: apiParams.messages.length,
      tools_count: apiParams.tools ? apiParams.tools.length : 0,
      tool_choice: apiParams.tool_choice,
      stream: false  // 第一次调用总是非流式
    })}`);

    // 如果是流式请求，设置响应头并处理流式响应（无工具调用的场景）
    if (stream) {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 启用流式请求
      apiParams.stream = true;
    }

    let response = await openai.chat.completions.create(apiParams);

    // ============ 流式响应处理 ============
    if (stream && response[Symbol.asyncIterator]) {
      logger.info('开始流式传输');

      try {
        let chunkCount = 0;
        let fullContent = '';
        let fullReasoning = '';
        let toolCalls = [];
        let currentFinishReason = null;

        // 第一阶段：收集流式响应数据
        for await (const chunk of response) {
          chunkCount++;
          const delta = chunk.choices[0]?.delta;

          // 收集工具调用信息
          if (delta?.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              const index = toolCallDelta.index;
              if (!toolCalls[index]) {
                toolCalls[index] = {
                  id: toolCallDelta.id || '',
                  type: 'function',
                  function: { name: '', arguments: '' }
                };
              }
              if (toolCallDelta.id) toolCalls[index].id = toolCallDelta.id;
              if (toolCallDelta.function?.name) toolCalls[index].function.name += toolCallDelta.function.name;
              if (toolCallDelta.function?.arguments) toolCalls[index].function.arguments += toolCallDelta.function.arguments;
            }
          }

          // 处理思考内容（reasoning_content）
          if (delta?.reasoning_content) {
            fullReasoning += delta.reasoning_content;
            res.write(`data: ${JSON.stringify({
              type: 'reasoning',
              content: delta.reasoning_content,
              fullReasoning: fullReasoning
            })}\n\n`);
            if (chunkCount <= 3) {
              logger.info(`发送reasoning chunk #${chunkCount}: ${delta.reasoning_content.substring(0, 20)}...`);
            }
          }

          // 处理回答内容（content）
          if (delta?.content) {
            fullContent += delta.content;
            const sseData = JSON.stringify({
              type: 'content',
              content: delta.content,
              fullContent: fullContent
            });
            console.log(`🔥🔥🔥 [Backend] 发送SSE chunk #${chunkCount}:`, delta.content.substring(0, 30));
            res.write(`data: ${sseData}\n\n`);
            if (chunkCount <= 3) {
              logger.info(`发送content chunk #${chunkCount}: ${delta.content.substring(0, 20)}...`);
            }
          }

          // 检查是否完成
          if (chunk.choices[0]?.finish_reason) {
            currentFinishReason = chunk.choices[0].finish_reason;
            logger.info(`流式传输完成: ${currentFinishReason}, 总chunks: ${chunkCount}`);
            logger.info(`总内容长度: ${fullContent.length}, 思考长度: ${fullReasoning.length}`);
            if (chunk.usage) {
              logger.info(`Token usage: prompt=${chunk.usage.prompt_tokens}, completion=${chunk.usage.completion_tokens}, total=${chunk.usage.total_tokens}`);
            }
          }
        }

        // 第二阶段：如果有工具调用，循环处理直到完成
        let iterationCount = 0;
        const maxIterations = 10; // 最多10轮工具调用

        while (currentFinishReason === 'tool_calls' && toolCalls.length > 0 && iterationCount < maxIterations) {
          iterationCount++;
          logger.info(`工具调用迭代 ${iterationCount}/${maxIterations}，共 ${toolCalls.length} 个工具`);

          const streamInjection = ensureTimeToolOrder(toolCalls, {
            timezone: DEFAULT_TIMEZONE,
            skip: hasFetchedRealtimeTime
          });
          if (streamInjection.injected) {
            logger.info(`[Chat] 自动注入 get_current_time 工具 (stream): timezone=${streamInjection.timezone}`);
          }

          // 发送工具调用通知
          res.write(`data: ${JSON.stringify({
            type: 'tool_calls',
            tool_calls: toolCalls
          })}\n\n`);

          // 添加助手消息（包含工具调用）
          apiParams.messages.push({
            role: 'assistant',
            content: fullContent || null,
            tool_calls: toolCalls
          });

          // 执行所有工具调用
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            const toolInfo = resolveToolInfo(toolName);
            const startTime = Date.now(); // 🔥 记录开始时间

            try {
              logger.info(`调用工具: ${toolName}, 参数: ${JSON.stringify(toolArgs)}`);

              // 发送工具执行开始通知
              res.write(`data: ${JSON.stringify({
                type: 'tool_start',
                tool_call_id: toolCall.id,
                tool_name: toolName,
                arguments: toolArgs
              })}\n\n`);

              let toolResult = null;

              // 智能判断工具类型：优先尝试MCP工具，失败则尝试原有服务工具
              try {
                // 1. 先尝试作为MCP工具调用（格式：serviceId_toolName）
                if (toolName.includes('_')) {
                  const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);
                  logger.info(`尝试MCP工具: ${serviceId}.${actualToolName} (User: ${userId})`);
                  toolResult = await mcpManager.callTool(serviceId, actualToolName, toolArgs, userId);
                  logger.info(`✅ MCP工具调用成功: ${toolName}`);
                } else {
                  // 2. 作为原有服务工具调用
                  logger.info(`尝试原有服务工具: ${toolName}`);
                  toolResult = await callLegacyServiceTool(toolName, toolArgs);
                  logger.info(`✅ 原有服务工具调用成功: ${toolName}`);
                }
              } catch (firstError) {
                // 3. 如果第一次失败，尝试另一种方式
                logger.warn(`第一次工具调用失败，尝试备用方式: ${toolName}`, firstError.message);
                if (toolName.includes('_')) {
                  // MCP调用失败，尝试作为原有服务工具
                  toolResult = await callLegacyServiceTool(toolName, toolArgs);
                  logger.info(`✅ 使用原有服务工具调用成功: ${toolName}`);
                } else {
                  // 原有服务调用失败，抛出错误
                  throw firstError;
                }
              }

              if (isCurrentTimeTool(toolInfo)) {
                hasFetchedRealtimeTime = true;
              }

              // 🔥 记录成功的工具调用
              const executionTime = Date.now() - startTime;
              toolCallOptimizer.record({
                toolName,
                parameters: toolArgs,
                success: true,
                response: toolResult,
                userQuery: apiParams.messages[apiParams.messages.length - 1]?.content,
                executionTime,
                userId
              });

              // 添加工具结果
              apiParams.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
              });

              // 发送工具执行结果通知
              res.write(`data: ${JSON.stringify({
                type: 'tool_result',
                tool_call_id: toolCall.id,
                tool_name: toolName,
                success: true,
                result: toolResult,
                execution_time: executionTime
              })}\n\n`);

              logger.info(`✅ 工具 ${toolName} 执行成功，结果长度: ${JSON.stringify(toolResult).length}，耗时: ${executionTime}ms`);
            } catch (toolError) {
              // 🔥 记录失败的工具调用
              const executionTime = Date.now() - startTime;
              toolCallOptimizer.record({
                toolName,
                parameters: toolArgs,
                success: false,
                error: toolError,
                userQuery: apiParams.messages[apiParams.messages.length - 1]?.content,
                executionTime,
                userId
              });

              logger.error(`❌ 工具调用失败: ${toolCall.function.name}`, toolError);

              // 发送工具执行失败通知
              res.write(`data: ${JSON.stringify({
                type: 'tool_result',
                tool_call_id: toolCall.id,
                tool_name: toolName,
                success: false,
                error: toolError.message || '工具调用失败',
                execution_time: executionTime
              })}\n\n`);

              apiParams.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  error: true,
                  message: toolError.message || '工具调用失败',
                  tool: toolCall.function.name
                })
              });
            }
          }

          // 重新调用 API 获取回复（仍然使用流式）
          logger.info('工具调用完成，重新请求回复');
          const nextResponse = await openai.chat.completions.create(apiParams);

          // 重置变量准备处理下一轮响应
          chunkCount = 0;
          fullContent = '';
          toolCalls = [];
          currentFinishReason = null;

          // 处理流式响应
          for await (const chunk of nextResponse) {
            chunkCount++;
            const delta = chunk.choices[0]?.delta;

            // 处理思考内容
            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              res.write(`data: ${JSON.stringify({
                type: 'reasoning',
                content: delta.reasoning_content,
                fullReasoning: fullReasoning
              })}\n\n`);
            }

            // 处理常规内容
            if (delta?.content) {
              fullContent += delta.content;
              res.write(`data: ${JSON.stringify({
                type: 'content',
                content: delta.content,
                fullContent: fullContent
              })}\n\n`);
            }

            // 收集工具调用
            if (delta?.tool_calls) {
              for (const tc of delta?.tool_calls) {
                if (!toolCalls[tc.index]) {
                  toolCalls[tc.index] = {
                    id: tc.id || '',
                    type: tc.type || 'function',
                    function: { name: '', arguments: '' }
                  };
                }
                if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }

            // 检查结束原因
            if (chunk.choices[0]?.finish_reason) {
              currentFinishReason = chunk.choices[0].finish_reason;
              logger.info(`流式传输完成: ${currentFinishReason}, 总chunks: ${chunkCount}`);
              if (chunk.usage) {
                logger.info(`Token usage: prompt=${chunk.usage.prompt_tokens}, completion=${chunk.usage.completion_tokens}, total=${chunk.usage.total_tokens}`);
              }
            }
          }

          // 如果没有更多工具调用，退出循环
          if (currentFinishReason !== 'tool_calls' || toolCalls.length === 0) {
            logger.info(`迭代完成: ${currentFinishReason}`);
            break;
          }
        }

        // 发送最终完成信号
        res.write(`data: ${JSON.stringify({
          type: 'done',
          finish_reason: currentFinishReason || 'stop',
          fullContent: fullContent,
          fullReasoning: fullReasoning
        })}\n\n`);

        res.write('data: [DONE]\n\n');
        res.end();
        logger.info(`流式传输结束`);
        return;

      } catch (streamError) {
        logger.error('流式传输错误:', streamError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: streamError.message
        })}\n\n`);
        res.end();
        return;
      }
    }

    // ============ 非流式响应处理 ============
    logger.info(`DeepSeek 响应: finish_reason=${response.choices[0].finish_reason}`);
    logger.info(`DeepSeek 消息: ${JSON.stringify(response.choices[0].message).substring(0, 200)}...`);

    let iterationCount = 0;
    const maxIterations = 10; // 最多10轮工具调用

    // 处理工具调用循环
    while (
      response.choices[0].finish_reason === 'tool_calls' &&
      iterationCount < maxIterations
    ) {
      iterationCount++;
      logger.info(`工具调用迭代 ${iterationCount}`);

      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls;

      logger.info(`需要调用 ${toolCalls.length} 个工具`);

      // 添加助手消息到历史
      apiParams.messages.push(assistantMessage);

      // 执行所有工具调用
      const nonStreamInjection = ensureTimeToolOrder(toolCalls, {
        timezone: DEFAULT_TIMEZONE,
        skip: hasFetchedRealtimeTime
      });
      if (nonStreamInjection.injected) {
        logger.info(`[Chat] 自动注入 get_current_time 工具 (non-stream): timezone=${nonStreamInjection.timezone}`);
      }

      const toolResults = [];
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolInfo = resolveToolInfo(toolName);
        const startTime = Date.now(); // 🔥 记录开始时间

        try {
          logger.info(`调用工具: ${toolName}`);
          logger.info(`参数: ${JSON.stringify(toolArgs, null, 2)}`);

          let result;

          // 判断是MCP工具还是原有服务工具
          if (toolName.includes('_') && mcpManager) {
            // 尝试作为MCP工具调用（格式：serviceId_toolName）
            try {
              const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);
              result = await mcpManager.callTool(serviceId, actualToolName, toolArgs, userId);
            } catch (mcpError) {
              // 如果MCP调用失败，尝试作为原有服务工具
              logger.warn(`MCP工具调用失败，尝试原有服务: ${toolName}`);
              result = await callLegacyServiceTool(toolName, toolArgs);
            }
          } else {
            // 直接作为原有服务工具调用
            result = await callLegacyServiceTool(toolName, toolArgs);
          }

          if (isCurrentTimeTool(toolInfo)) {
            hasFetchedRealtimeTime = true;
          }

          // 🔥 记录成功的工具调用
          const executionTime = Date.now() - startTime;
          toolCallOptimizer.record({
            toolName,
            parameters: toolArgs,
            success: true,
            response: result,
            userQuery: messages[messages.length - 1]?.content,
            executionTime,
            userId
          });

          // 构造工具结果消息
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2)
          });

          logger.info(`工具 ${toolName} 执行成功，耗时: ${executionTime}ms`);

        } catch (error) {
          // 🔥 记录失败的工具调用
          const executionTime = Date.now() - startTime;
          toolCallOptimizer.record({
            toolName,
            parameters: toolArgs,
            success: false,
            error: error,
            userQuery: messages[messages.length - 1]?.content,
            executionTime,
            userId
          });

          logger.error(`工具调用失败: ${toolCall.function.name}`, error);

          // 返回错误信息
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: true,
              message: error.message || '工具调用失败'
            })
          });
        }
      }

      // 添加工具结果到消息历史
      apiParams.messages.push(...toolResults);

      // 再次调用 API,让模型处理工具结果（使用流式输出）
      if (stream) {
        apiParams.stream = true;
      }

      response = await openai.chat.completions.create(apiParams);

      // 如果启用了流式输出，处理流式响应
      if (stream && response[Symbol.asyncIterator]) {
        logger.info('工具调用完成，开始流式输出最终回复');

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let chunkCount = 0;
        let fullContent = '';
        let fullReasoning = '';

        try {
          for await (const chunk of response) {
            chunkCount++;
            const delta = chunk.choices[0]?.delta;

            // 处理思考内容
            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              const payload = JSON.stringify({
                type: 'reasoning',
                content: delta.reasoning_content,
                fullReasoning: fullReasoning
              });
              res.write(`data: ${payload}\n\n`);

              if (chunkCount <= 3) {
                logger.info(`[工具后流式] Reasoning #${chunkCount}: ${delta.reasoning_content.substring(0, 20)}...`);
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
                logger.info(`[工具后流式] Content #${chunkCount}: ${delta.content.substring(0, 20)}...`);
              }
            }

            if (chunk.choices[0]?.finish_reason) {
              logger.info(`工具后流式传输完成: ${chunk.choices[0].finish_reason}, 总chunks: ${chunkCount}`);
              logger.info(`总内容长度: ${fullContent.length}, 思考长度: ${fullReasoning.length}`);

              // 包含 usage 信息
              if (chunk.usage) {
                logger.info(`[工具后] Token usage: prompt=${chunk.usage.prompt_tokens}, completion=${chunk.usage.completion_tokens}, total=${chunk.usage.total_tokens}`);
              }

              res.write(`data: ${JSON.stringify({
                type: 'done',
                finish_reason: chunk.choices[0].finish_reason,
                fullContent: fullContent,
                fullReasoning: fullReasoning,
                usage: chunk.usage || null  // 🔥 添加 usage 信息
              })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
          logger.info(`工具后流式传输结束，共发送 ${chunkCount} 个chunks`);
          return;

        } catch (streamError) {
          logger.error('工具后流式传输错误:', streamError);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: streamError.message
          })}\n\n`);
          res.end();
          return;
        }
      }
    }

    // 检查是否达到最大迭代次数
    if (iterationCount >= maxIterations) {
      logger.warn(`达到最大工具调用迭代次数: ${maxIterations}`);
    }

    // 如果没有工具调用或用户未请求流式输出，返回JSON响应
    res.json({
      id: response.id,
      model: response.model,
      created: response.created,
      choices: response.choices,
      usage: response.usage,
      // 返回完整的消息历史(包含工具调用)
      messages: apiParams.messages
    });

  } catch (error) {
    logger.error('对话处理失败:', error);
    res.status(500).json({
      error: '对话处理失败',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/tools
 * 获取所有可用的工具列表
 */
router.get('/tools', (req, res) => {
  try {
    let allTools = [];

    // 1. 获取MCP工具
    if (mcpManager) {
      const mcpTools = mcpManager.getAllTools();
      allTools.push(...mcpTools);
      logger.info(`获取到 ${mcpTools.length} 个MCP工具`);
    }

    // 2. 获取原有服务的工具
    for (const [serviceId, service] of Object.entries(allServices)) {
      if (serviceId === 'mcpManager') continue;

      if (service && service.enabled && typeof service.getTools === 'function') {
        try {
          const serviceTools = service.getTools();
          if (Array.isArray(serviceTools) && serviceTools.length > 0) {
            allTools.push(...serviceTools);
            logger.info(`获取到 ${serviceTools.length} 个${serviceId}工具`);
          }
        } catch (error) {
          logger.warn(`获取 ${serviceId} 工具失败:`, error.message);
        }
      }
    }

    res.json({
      count: allTools.length,
      tools: allTools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }))
    });

  } catch (error) {
    logger.error('获取工具列表失败:', error);
    res.status(500).json({
      error: '获取工具列表失败',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/optimization-report
 * 获取工具调用优化报告
 * 🔥 新增：查看AI工具调用的统计和改进建议
 */
router.get('/optimization-report', authMiddleware, (req, res) => {
  try {
    const report = toolCallOptimizer.getOptimizationReport();
    res.json(report);
  } catch (error) {
    logger.error('获取优化报告失败:', error);
    res.status(500).json({
      error: '获取优化报告失败',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/tool-stats
 * 获取工具调用详细统计
 * 🔥 新增：查看特定工具的使用情况
 */
router.get('/tool-stats', authMiddleware, (req, res) => {
  try {
    const { toolName } = req.query;

    if (toolName) {
      // 获取特定工具的统计
      const stats = toolCallOptimizer.getStats()[toolName];
      const patterns = toolCallOptimizer.getSuccessPatterns(toolName);

      res.json({
        toolName,
        stats: stats || { message: '暂无统计数据' },
        successPatterns: patterns
      });
    } else {
      // 获取所有工具的统计
      const stats = toolCallOptimizer.getStats();
      const mostUsed = toolCallOptimizer.getMostUsedTools(10);

      res.json({
        allStats: stats,
        mostUsedTools: mostUsed
      });
    }
  } catch (error) {
    logger.error('获取工具统计失败:', error);
    res.status(500).json({
      error: '获取工具统计失败',
      message: error.message
    });
  }
});

/**
 * POST /api/chat/clear-tool-history
 * 清空工具调用历史
 * 🔥 新增：重置优化器
 */
router.post('/clear-tool-history', authMiddleware, (req, res) => {
  try {
    toolCallOptimizer.clear();
    res.json({
      success: true,
      message: '工具调用历史已清空'
    });
  } catch (error) {
    logger.error('清空历史失败:', error);
    res.status(500).json({
      error: '清空历史失败',
      message: error.message
    });
  }
});

module.exports = { router, initializeRouter };

