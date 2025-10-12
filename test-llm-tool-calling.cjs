/**
 * 测试大模型调用工具的完整流程
 * 模拟chat.cjs的逻辑，测试DeepSeek是否能正确调用工具
 */

const { OpenAI } = require('openai');
const config = require('./server/config.cjs');
const WeatherService = require('./server/services/weather.cjs');
const TimeService = require('./server/services/time.cjs');
const SearchService = require('./server/services/search.cjs');
const DexscreenerService = require('./server/services/dexscreener.cjs');
const FetchService = require('./server/services/fetch.cjs');

// 初始化OpenAI客户端（DeepSeek API）
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-03db8009812649359e2f83cc738861aa',
  baseURL: 'https://api.deepseek.com'
});

// 初始化服务
const services = {};
services.weather = new WeatherService(config.services.weather);
services.time = new TimeService(config.services.time);
services.search = new SearchService(config.services.search);
services.dexscreener = new DexscreenerService({
  id: 'dexscreener',
  name: 'Dexscreener加密货币',
  description: '获取实时加密货币价格和市场数据',
  enabled: true,
  autoLoad: true
});
services.fetch = new FetchService(config.services.fetch);

// 获取所有工具
function getAllTools() {
  let allTools = [];
  
  for (const [serviceId, service] of Object.entries(services)) {
    if (service && service.enabled && typeof service.getTools === 'function') {
      try {
        const serviceTools = service.getTools();
        if (Array.isArray(serviceTools) && serviceTools.length > 0) {
          allTools.push(...serviceTools);
        }
      } catch (error) {
        console.warn(`获取 ${serviceId} 工具失败:`, error.message);
      }
    }
  }
  
  return allTools;
}

// 增强工具描述
function enhanceToolDescriptions(tools) {
  return tools.map(tool => {
    let enhancedDescription = tool.function.description || '';
    
    if (tool.function.name.includes('search_token') || tool.function.name.includes('get_token_price') || tool.function.name.includes('get_trending_tokens')) {
      enhancedDescription = `[加密货币实时数据] ${enhancedDescription}。适用于：查询加密货币价格、市场数据、热门代币、交易对信息等。使用Dexscreener API。`;
    } else if (tool.function.name.includes('weather')) {
      enhancedDescription = `[天气查询] ${enhancedDescription}。适用于：查询当前天气、天气预报、温度、降水等气象信息。`;
    } else if (tool.function.name.includes('time') || tool.function.name.includes('convert_time')) {
      enhancedDescription = `[时间查询] ${enhancedDescription}。适用于：查询当前时间、时区转换、世界时钟等时间相关操作。`;
    } else if (tool.function.name === 'search_web') {
      enhancedDescription = `[实时网页搜索-DuckDuckGo] ${enhancedDescription}。适用于：通用网页搜索、查找资料、获取最新信息等。`;
    } else if (tool.function.name.includes('fetch_url')) {
      enhancedDescription = `[网页内容抓取] ${enhancedDescription}。适用于：获取网页完整内容、提取文章正文、转换为Markdown格式等。`;
    }
    
    return {
      type: tool.type,
      function: {
        ...tool.function,
        description: enhancedDescription
      }
    };
  });
}

// 调用工具
async function callTool(toolName, parameters) {
  for (const [serviceId, service] of Object.entries(services)) {
    if (service && service.enabled && typeof service.getTools === 'function') {
      const tools = service.getTools();
      const hasTool = tools.some(tool => tool.function.name === toolName);
      
      if (hasTool && typeof service.execute === 'function') {
        console.log(`  → 使用服务 ${serviceId} 执行工具 ${toolName}`);
        return await service.execute(toolName, parameters);
      }
    }
  }
  
  throw new Error(`未找到工具: ${toolName}`);
}

// 测试对话
async function testConversation(userMessage, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试: ${testName}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`用户: ${userMessage}\n`);
  
  try {
    // 获取并增强工具
    const allTools = getAllTools();
    const enhancedTools = enhanceToolDescriptions(allTools);
    
    console.log(`可用工具数: ${enhancedTools.length}\n`);
    
    // 构建API参数
    const apiParams = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，可以使用各种工具来帮助用户。请根据用户的问题选择最合适的工具。'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      tools: enhancedTools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // 调用DeepSeek API
    console.log('正在调用 DeepSeek API...\n');
    let response = await openai.chat.completions.create(apiParams);
    
    let iterationCount = 0;
    const maxIterations = 3;
    
    // 处理工具调用循环
    while (
      response.choices[0].finish_reason === 'tool_calls' &&
      iterationCount < maxIterations
    ) {
      iterationCount++;
      console.log(`\n--- 工具调用迭代 ${iterationCount} ---\n`);
      
      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls;
      
      console.log(`需要调用 ${toolCalls.length} 个工具:\n`);
      
      // 添加助手消息到历史
      apiParams.messages.push(assistantMessage);
      
      // 执行所有工具调用
      const toolResults = [];
      for (const toolCall of toolCalls) {
        try {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`📞 调用工具: ${toolName}`);
          console.log(`   参数: ${JSON.stringify(toolArgs, null, 2)}`);
          
          // 调用工具
          const result = await callTool(toolName, toolArgs);
          
          console.log(`✅ 工具执行成功`);
          console.log(`   结果预览: ${JSON.stringify(result).substring(0, 200)}...\n`);
          
          // 构造工具结果消息
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2)
          });
          
        } catch (error) {
          console.error(`❌ 工具调用失败: ${toolCall.function.name}`);
          console.error(`   错误: ${error.message}\n`);
          
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
      
      // 再次调用API，让模型处理工具结果
      console.log('正在处理工具结果...\n');
      response = await openai.chat.completions.create(apiParams);
    }
    
    // 输出最终回复
    const finalMessage = response.choices[0].message.content;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`助手回复:\n`);
    console.log(finalMessage);
    console.log(`${'─'.repeat(60)}\n`);
    
    console.log(`✅ 测试完成 (共 ${iterationCount} 次工具调用)`);
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    if (error.response) {
      console.error(`   响应状态: ${error.response.status}`);
      console.error(`   响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          大模型工具调用完整测试                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const testCases = [
    {
      name: '测试1: 加密货币查询（Dexscreener）',
      message: '以太坊现在的价格是多少？'
    },
    {
      name: '测试2: 网页搜索（DuckDuckGo）',
      message: '搜索Node.js最新版本'
    },
    {
      name: '测试3: 天气查询',
      message: '北京今天的天气怎么样？'
    }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    const success = await testConversation(testCase.message, testCase.name);
    if (success) successCount++;
    
    // 等待一下，避免API限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    测试总结                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  成功: ${successCount}/${testCases.length}`);
  console.log(`  失败: ${testCases.length - successCount}/${testCases.length}\n`);
  
  if (successCount === testCases.length) {
    console.log('✅ 所有测试通过！大模型可以正常调用所有工具。\n');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息。\n');
  }
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});

