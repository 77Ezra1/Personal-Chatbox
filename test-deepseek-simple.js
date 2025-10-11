import OpenAI from 'openai';

console.log('🧪 开始测试 DeepSeek API 调用...');

async function testDeepSeekAPI() {
  try {
    // 创建OpenAI客户端，指向DeepSeek API
    const client = new OpenAI({
      apiKey: 'sk-8ebd495072cb4222a160', // 使用您配置的API密钥前缀
      baseURL: 'https://api.deepseek.com'
    });
    
    console.log('🤖 调用DeepSeek API...');
    
    // 模拟MCP工具
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '获取当前时间',
          parameters: {
            type: 'object',
            properties: {
              timezone: {
                type: 'string',
                description: '时区，默认为Asia/Shanghai'
              }
            }
          }
        }
      }
    ];
    
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: '现在几点了？' }
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 1024
    });
    
    console.log('✅ DeepSeek API调用成功！');
    console.log('响应:', response.choices[0].message);
    
    if (response.choices[0].message.tool_calls) {
      console.log('🔧 工具调用检测到:', response.choices[0].message.tool_calls.length, '个');
      response.choices[0].message.tool_calls.forEach(tc => {
        console.log('  - 工具:', tc.function.name);
        console.log('  - 参数:', tc.function.arguments);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('API响应:', error.response.status, error.response.data);
    }
    return false;
  }
}

// 运行测试
testDeepSeekAPI().then(success => {
  if (success) {
    console.log('🎉 DeepSeek API 测试成功！');
  } else {
    console.log('💥 DeepSeek API 测试失败！');
  }
  process.exit(success ? 0 : 1);
});
