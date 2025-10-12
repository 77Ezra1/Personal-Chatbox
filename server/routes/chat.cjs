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
  openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-03db8009812649359e2f83cc738861aa',
    baseURL: 'https://api.deepseek.com'
  });
} catch (error) {
  logger.error('OpenAI 客户端初始化失败:', error);
}

// MCP Manager 实例(由 initializeRouter 设置)
let mcpManager = null;

/**
 * 初始化路由
 * @param {Object} services - 服务实例
 */
function initializeRouter(services) {
  mcpManager = services.mcpManager;
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

    // 获取所有可用的 MCP 工具
    const mcpTools = mcpManager ? mcpManager.getAllTools() : [];
    logger.info(`可用工具数量: ${mcpTools.length}`);

    // 准备 API 请求参数
    const apiParams = {
      model,
      messages: [...messages]
    };

    // 如果有工具,添加到请求中
    if (mcpTools.length > 0) {
      apiParams.tools = mcpTools.map(tool => {
        // 增强工具描述，帮助大模型更好地理解和选择工具
        let enhancedDescription = tool.function.description || '';
        
        // 根据工具名称添加使用场景说明
        if (tool.function.name.includes('wikipedia')) {
          enhancedDescription = `[百科知识查询] ${enhancedDescription}。适用于：查询历史事件、人物传记、科学概念、地理信息等百科知识。`;
        } else if (tool.function.name.includes('brave_search') || tool.function.name.includes('search')) {
          enhancedDescription = `[实时网页搜索] ${enhancedDescription}。适用于：最新新闻、实时信息、产品评测、技术文档等需要搜索引擎的内容。`;
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

          // 解析工具名称,提取服务ID和工具名
          const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);

          // 调用 MCP 工具
          const result = await mcpManager.callTool(serviceId, actualToolName, toolArgs);

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

