/**
 * Chat API 路由
 * 处理与 AI 模型的对话,集成 MCP 工具调用
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger.cjs');

// OpenAI 客户端(用于 DeepSeek API)
let openai;
try {
  const { OpenAI } = require('openai');
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    logger.warn('DEEPSEEK_API_KEY not configured in environment variables. DeepSeek API will not work until configured.');
  }

  openai = new OpenAI({
    apiKey: apiKey || 'placeholder-key',  // 使用占位符,防止初始化失败
    baseURL: 'https://api.deepseek.com'
  });
} catch (error) {
  logger.error('OpenAI 客户端初始化失败:', error);
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

/**
 * POST /api/chat
 * 处理对话请求
 */
router.post('/', async (req, res) => {
  try {
    const { messages, model = 'deepseek-chat', stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: '无效的请求: messages 必须是数组'
      });
    }

    logger.info(`收到对话请求: model=${model}, messages=${messages.length}条`);

    // 获取所有可用的工具（包括MCP工具和原有服务工具）
    let allTools = [];
    
    // 1. 获取MCP工具
    const mcpTools = mcpManager ? mcpManager.getAllTools() : [];
    allTools.push(...mcpTools);
    logger.info(`MCP工具数量: ${mcpTools.length}`);
    
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

    // 准备 API 请求参数
    const apiParams = {
      model,
      messages: [...messages]
    };

    // 如果有工具,添加到请求中
    if (allTools.length > 0) {
      apiParams.tools = allTools.map(tool => {
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

    // 调用 DeepSeek API
    logger.info(`调用 DeepSeek API，参数: ${JSON.stringify({
      model: apiParams.model,
      messages_count: apiParams.messages.length,
      tools_count: apiParams.tools ? apiParams.tools.length : 0,
      tool_choice: apiParams.tool_choice
    })}`);
    
    let response = await openai.chat.completions.create(apiParams);
    
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
      const toolResults = [];
      for (const toolCall of toolCalls) {
        try {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          logger.info(`调用工具: ${toolName}`);
          logger.info(`参数: ${JSON.stringify(toolArgs, null, 2)}`);

          let result;
          
          // 判断是MCP工具还是原有服务工具
          if (toolName.includes('_') && mcpManager) {
            // 尝试作为MCP工具调用（格式：serviceId_toolName）
            try {
              const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);
              result = await mcpManager.callTool(serviceId, actualToolName, toolArgs);
            } catch (mcpError) {
              // 如果MCP调用失败，尝试作为原有服务工具
              logger.warn(`MCP工具调用失败，尝试原有服务: ${toolName}`);
              result = await callLegacyServiceTool(toolName, toolArgs);
            }
          } else {
            // 直接作为原有服务工具调用
            result = await callLegacyServiceTool(toolName, toolArgs);
          }

          // 构造工具结果消息
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2)
          });

          logger.info(`工具 ${toolName} 执行成功`);

        } catch (error) {
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

      // 再次调用 API,让模型处理工具结果
      response = await openai.chat.completions.create(apiParams);
    }

    // 检查是否达到最大迭代次数
    if (iterationCount >= maxIterations) {
      logger.warn(`达到最大工具调用迭代次数: ${maxIterations}`);
    }

    // 返回最终响应
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
    if (!mcpManager) {
      return res.json({ tools: [] });
    }

    const tools = mcpManager.getAllTools();
    res.json({
      count: tools.length,
      tools: tools.map(tool => ({
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

module.exports = { router, initializeRouter };

