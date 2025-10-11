/**
 * 完整的MCP服务集成测试
 * 使用DeepSeek API测试工具调用
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-03db8009812649359e2f83cc738861aa',
  baseURL: 'https://api.deepseek.com'
});

const MCP_API_BASE = 'http://localhost:3001/api/mcp';

/**
 * 获取所有可用工具
 */
async function getTools() {
  const response = await fetch(`${MCP_API_BASE}/tools`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('获取工具列表失败');
  }
  
  return data.tools;
}

/**
 * 调用MCP工具
 */
async function callTool(toolName, parameters) {
  const response = await fetch(`${MCP_API_BASE}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      toolName,
      parameters
    })
  });
  
  const data = await response.json();
  return data;
}

/**
 * 测试完整的对话流程
 */
async function testConversation() {
  console.log('='.repeat(80));
  console.log('开始集成测试: 使用DeepSeek API + MCP服务');
  console.log('='.repeat(80));
  console.log('');
  
  // 1. 获取工具列表
  console.log('📋 步骤1: 获取MCP工具列表...');
  const tools = await getTools();
  console.log(`✅ 获取到 ${tools.length} 个工具:`);
  tools.forEach(tool => {
    console.log(`   - ${tool.function.name}: ${tool.function.description}`);
  });
  console.log('');
  
  // 2. 发送用户消息
  const userMessage = '北京今天天气怎么样?';
  console.log(`💬 步骤2: 用户消息: "${userMessage}"`);
  console.log('');
  
  // 3. 调用DeepSeek API
  console.log('🤖 步骤3: 调用DeepSeek API...');
  const messages = [
    {
      role: 'user',
      content: userMessage
    }
  ];
  
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: messages,
    tools: tools,
    tool_choice: 'auto'
  });
  
  const assistantMessage = response.choices[0].message;
  console.log('✅ DeepSeek响应:');
  console.log(`   内容: ${assistantMessage.content || '(无文本内容)'}`);
  
  // 4. 处理工具调用
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log(`   工具调用: ${assistantMessage.tool_calls.length} 个`);
    console.log('');
    
    console.log('🔧 步骤4: 执行工具调用...');
    
    const toolResults = [];
    
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const parameters = JSON.parse(toolCall.function.arguments);
      
      console.log(`   调用工具: ${toolName}`);
      console.log(`   参数: ${JSON.stringify(parameters)}`);
      
      const result = await callTool(toolName, parameters);
      
      if (result.success) {
        console.log(`   ✅ 成功: ${result.content.substring(0, 100)}...`);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: result.content
        });
      } else {
        console.log(`   ❌ 失败: ${result.error} - ${result.details}`);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: `错误: ${result.error}`
        });
      }
    }
    console.log('');
    
    // 5. 发送工具结果给DeepSeek
    console.log('🤖 步骤5: 发送工具结果给DeepSeek...');
    messages.push(assistantMessage);
    messages.push(...toolResults);
    
    const finalResponse = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages
    });
    
    const finalMessage = finalResponse.choices[0].message.content;
    console.log('✅ DeepSeek最终回复:');
    console.log('');
    console.log(finalMessage);
    console.log('');
    
  } else {
    console.log('   无工具调用');
    console.log('');
    console.log('💬 DeepSeek直接回复:');
    console.log(assistantMessage.content);
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('✅ 集成测试完成!');
  console.log('='.repeat(80));
}

// 运行测试
testConversation().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});

