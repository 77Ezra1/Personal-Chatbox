// 测试DeepSeek两个模型的工具调用能力
const API_KEY = 'sk-03db8009812649359e2f83cc738861aa';
const BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

// 定义搜索工具
const searchTool = {
  type: "function",
  function: {
    name: "duckduckgo_search",
    description: "搜索网络信息，获取最新的资讯和数据",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索查询关键词"
        },
        max_results: {
          type: "integer",
          description: "最大搜索结果数量",
          default: 10
        }
      },
      required: ["query"]
    }
  }
};

// 测试函数
async function testModel(modelId, query) {
  console.log(`\n=== 测试模型: ${modelId} ===`);
  console.log(`查询: ${query}`);
  
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        tools: [searchTool],
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API错误 (${response.status}):`, errorText);
      return false;
    }

    const data = await response.json();
    console.log(`✅ 模型响应成功`);
    
    // 检查是否有工具调用
    const message = data.choices[0].message;
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(`🔧 工具调用检测到: ${message.tool_calls.length} 个工具调用`);
      message.tool_calls.forEach((toolCall, index) => {
        console.log(`   工具 ${index + 1}: ${toolCall.function.name}`);
        console.log(`   参数: ${toolCall.function.arguments}`);
      });
      return true;
    } else {
      console.log(`❌ 未检测到工具调用`);
      console.log(`回复内容: ${message.content}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ 请求失败:`, error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试DeepSeek模型的工具调用能力...\n');
  
  const testQuery = "帮我搜索一下2025年的中国美妆市场趋势和发展前景";
  
  // 测试两个模型
  const models = ['deepseek-chat', 'deepseek-reasoner'];
  const results = {};
  
  for (const model of models) {
    results[model] = await testModel(model, testQuery);
    // 等待一秒避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 总结结果
  console.log('\n📊 测试结果总结:');
  for (const [model, success] of Object.entries(results)) {
    console.log(`${model}: ${success ? '✅ 支持工具调用' : '❌ 不支持工具调用'}`);
  }
  
  // 推荐使用的模型
  const supportedModels = Object.entries(results).filter(([_, success]) => success).map(([model, _]) => model);
  if (supportedModels.length > 0) {
    console.log(`\n🎯 推荐使用模型: ${supportedModels.join(', ')}`);
  } else {
    console.log('\n⚠️  警告: 没有模型支持工具调用');
  }
}

// 运行测试
runTests().catch(console.error);
