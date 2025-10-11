import { generateAIResponse } from './src/lib/aiClient.js';
import { getActiveMcpServers } from './src/lib/db/mcpServers.js';
import { convertMcpToolsToOpenAIFormat } from './src/lib/mcpClient.js';

console.log('🧪 开始测试 DeepSeek + MCP 集成...');

async function testDeepSeekMCP() {
  try {
    // 1. 获取MCP工具
    console.log('📡 获取MCP工具...');
    const activeServers = await getActiveMcpServers();
    const tools = convertMcpToolsToOpenAIFormat(activeServers);
    console.log(`✅ 获取到 ${tools.length} 个MCP工具`);
    
    // 2. 模拟DeepSeek配置
    const modelConfig = {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: 'sk-8ebd495072cb4222a160', // 使用您配置的API密钥的前缀
      temperature: 0.1,
      maxTokens: 1024
    };
    
    // 3. 测试消息
    const testMessages = [
      { role: 'user', content: '现在几点了？' }
    ];
    
    console.log('🤖 调用DeepSeek API...');
    console.log('模型配置:', {
      provider: modelConfig.provider,
      model: modelConfig.model,
      apiKey: modelConfig.apiKey.substring(0, 10) + '...',
      toolCount: tools.length
    });
    
    // 4. 调用AI
    const response = await generateAIResponse({
      messages: testMessages,
      modelConfig,
      tools,
      systemPrompt: '你是一个有用的AI助手。'
    });
    
    console.log('✅ DeepSeek API调用成功！');
    console.log('响应内容:', response.content);
    
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('🔧 工具调用:', response.tool_calls.map(tc => tc.function.name));
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

// 运行测试
testDeepSeekMCP().then(success => {
  if (success) {
    console.log('🎉 DeepSeek + MCP 集成测试成功！');
  } else {
    console.log('💥 DeepSeek + MCP 集成测试失败！');
  }
  process.exit(success ? 0 : 1);
});
