/**
 * 测试Brave Search MCP服务
 */

const { OpenAI } = require('openai');
const MCPManager = require('./server/services/mcp-manager.cjs');
const configStorage = require('./server/services/config-storage.cjs');

// 初始化OpenAI客户端（DeepSeek API）
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-03db8009812649359e2f83cc738861aa',
  baseURL: 'https://api.deepseek.com'
});

async function testBraveSearch() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              Brave Search MCP 服务测试                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 1. 初始化配置存储
    console.log('1️⃣  初始化配置存储...');
    await configStorage.initialize();
    console.log('   ✅ 配置存储初始化成功\n');
    
    // 2. 创建MCP Manager
    console.log('2️⃣  创建 MCP Manager...');
    const mcpManager = new MCPManager();
    console.log('   ✅ MCP Manager 创建成功\n');
    
    // 3. 读取Brave Search配置
    console.log('3️⃣  读取 Brave Search API Key...');
    const braveConfig = await configStorage.getServiceConfig('braveSearch');
    
    if (!braveConfig || !braveConfig.apiKey) {
      console.error('   ❌ 未找到 Brave Search API Key');
      console.log('   提示: 请确保 data/config.json 中配置了 braveSearch.apiKey');
      return false;
    }
    
    console.log(`   ✅ API Key: ${braveConfig.apiKey.substring(0, 10)}...`);
    console.log('');
    
    // 4. 启动Brave Search MCP服务
    console.log('4️⃣  启动 Brave Search MCP 服务...');
    
    const serviceConfig = {
      id: 'brave_search',
      name: 'Brave Search',
      description: '使用Brave搜索引擎进行网络搜索',
      enabled: true,
      autoLoad: true,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: {
        BRAVE_API_KEY: braveConfig.apiKey
      }
    };
    
    await mcpManager.startService(serviceConfig);
    console.log('   ✅ Brave Search 服务启动成功\n');
    
    // 等待服务完全启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. 获取工具列表
    console.log('5️⃣  获取可用工具...');
    const tools = mcpManager.getAllTools();
    console.log(`   ✅ 总工具数: ${tools.length}\n`);
    
    // 查找Brave Search工具
    const braveTools = tools.filter(tool => 
      tool.function.name.includes('brave_search')
    );
    
    if (braveTools.length === 0) {
      console.error('   ❌ 未找到 Brave Search 工具');
      return false;
    }
    
    console.log('   Brave Search 工具列表:');
    braveTools.forEach(tool => {
      console.log(`   • ${tool.function.name}`);
      console.log(`     ${tool.function.description}`);
    });
    console.log('');
    
    // 6. 使用大模型测试工具调用
    console.log('6️⃣  测试大模型调用 Brave Search...\n');
    console.log('   用户问题: "搜索以太坊最新新闻"\n');
    
    const apiParams = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，可以使用Brave Search进行网络搜索。'
        },
        {
          role: 'user',
          content: '搜索以太坊最新新闻'
        }
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000
    };
    
    console.log('   正在调用 DeepSeek API...\n');
    let response = await openai.chat.completions.create(apiParams);
    
    // 检查是否调用了工具
    if (response.choices[0].finish_reason === 'tool_calls') {
      const toolCalls = response.choices[0].message.tool_calls;
      console.log(`   ✅ 大模型选择调用 ${toolCalls.length} 个工具:\n`);
      
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`   📞 工具: ${toolName}`);
        console.log(`      参数: ${JSON.stringify(toolArgs, null, 2)}`);
        
        // 调用MCP工具
        try {
          const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);
          console.log(`\n   正在执行工具...\n`);
          
          const result = await mcpManager.callTool(serviceId, actualToolName, toolArgs);
          
          console.log(`   ✅ 工具执行成功`);
          console.log(`      结果预览: ${JSON.stringify(result).substring(0, 300)}...\n`);
          
          // 添加工具结果到消息历史
          apiParams.messages.push(response.choices[0].message);
          apiParams.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2)
          });
          
          // 让大模型处理结果
          console.log('   正在生成最终回复...\n');
          response = await openai.chat.completions.create(apiParams);
          
          const finalMessage = response.choices[0].message.content;
          console.log('   ─────────────────────────────────────────────────────');
          console.log('   助手回复:\n');
          console.log('   ' + finalMessage.split('\n').join('\n   '));
          console.log('   ─────────────────────────────────────────────────────\n');
          
        } catch (error) {
          console.error(`   ❌ 工具执行失败: ${error.message}\n`);
          return false;
        }
      }
      
      console.log('✅ Brave Search 测试完全成功！\n');
      return true;
      
    } else {
      console.log('   ⚠️  大模型没有调用工具');
      console.log(`      finish_reason: ${response.choices[0].finish_reason}`);
      console.log(`      回复: ${response.choices[0].message.content}\n`);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    return false;
  } finally {
    // 清理：停止MCP服务
    console.log('\n7️⃣  清理资源...');
    process.exit(0);
  }
}

testBraveSearch();

