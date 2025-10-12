/**
 * 测试大模型在有Brave Search和DuckDuckGo时会选择哪个
 */

const { OpenAI } = require('openai');

// 初始化OpenAI客户端（DeepSeek API）
const openai = new OpenAI({
  apiKey: 'sk-03db8009812649359e2f83cc738861aa',
  baseURL: 'https://api.deepseek.com'
});

// 模拟两个搜索工具
const tools = [
  {
    type: 'function',
    function: {
      name: 'brave_search_brave_web_search',
      description: '[实时网页搜索-Brave] Performs a web search using Brave Search API。适用于：最新新闻、实时信息、产品评测、技术文档等需要搜索引擎的内容。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          count: {
            type: 'number',
            description: 'Number of results (max 20, default 10)'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: '[实时网页搜索-DuckDuckGo] 使用DuckDuckGo进行网络搜索。适用于：通用网页搜索、查找资料、获取最新信息等。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询词'
          },
          max_results: {
            type: 'number',
            description: '最大结果数量,默认10'
          }
        },
        required: ['query']
      }
    }
  }
];

async function testSearchSelection(userQuery) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`测试查询: "${userQuery}"`);
  console.log('='.repeat(70));
  
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，可以使用搜索工具来获取信息。'
        },
        {
          role: 'user',
          content: userQuery
        }
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });
    
    if (response.choices[0].finish_reason === 'tool_calls') {
      const toolCall = response.choices[0].message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
      console.log(`\n✅ 大模型选择: ${toolName}`);
      console.log(`   参数: ${JSON.stringify(toolArgs, null, 2)}`);
      
      if (toolName.includes('brave_search')) {
        console.log(`   → 选择了 Brave Search`);
        return 'brave';
      } else if (toolName === 'search_web') {
        console.log(`   → 选择了 DuckDuckGo`);
        return 'duckduckgo';
      }
    } else {
      console.log(`\n⚠️  大模型没有调用工具`);
      console.log(`   finish_reason: ${response.choices[0].finish_reason}`);
      return 'none';
    }
    
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    return 'error';
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          测试大模型搜索工具选择倾向                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  const testQueries = [
    '搜索Node.js最新版本',
    '查找React教程',
    '以太坊最新新闻',
    'Python入门指南',
    '搜索人工智能发展趋势'
  ];
  
  const results = {
    brave: 0,
    duckduckgo: 0,
    none: 0,
    error: 0
  };
  
  for (const query of testQueries) {
    const result = await testSearchSelection(query);
    results[result]++;
    
    // 等待1秒，避免API限流
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                         测试结果统计                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`  总测试数: ${testQueries.length}`);
  console.log(`  Brave Search: ${results.brave} 次 (${(results.brave/testQueries.length*100).toFixed(1)}%)`);
  console.log(`  DuckDuckGo: ${results.duckduckgo} 次 (${(results.duckduckgo/testQueries.length*100).toFixed(1)}%)`);
  console.log(`  未调用工具: ${results.none} 次`);
  console.log(`  错误: ${results.error} 次\n`);
  
  if (results.brave > results.duckduckgo) {
    console.log('📊 结论: 大模型更倾向于使用 Brave Search\n');
  } else if (results.duckduckgo > results.brave) {
    console.log('📊 结论: 大模型更倾向于使用 DuckDuckGo\n');
  } else {
    console.log('📊 结论: 大模型对两个工具没有明显偏好，随机选择\n');
  }
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});

