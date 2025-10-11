/**
 * 简化的大模型工具调用测试
 */

import OpenAI from 'openai'

// 使用环境变量中的OpenAI配置
const client = new OpenAI()

// 简单的工具定义
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的天气信息',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: '城市名称'
          }
        },
        required: ['location']
      }
    }
  }
]

async function testSimpleLLM() {
  console.log('🤖 开始简单的大模型工具调用测试...')
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: '北京今天天气怎么样？'
        }
      ],
      tools: tools,
      tool_choice: 'auto'
    })
    
    console.log('✅ 大模型调用成功！')
    console.log('📝 响应:', JSON.stringify(response.choices[0].message, null, 2))
    
    if (response.choices[0].message.tool_calls) {
      console.log('🔧 大模型请求调用工具!')
      console.log('工具调用详情:', response.choices[0].message.tool_calls)
    }
    
  } catch (error) {
    console.log('❌ 大模型调用失败:', error.message)
    if (error.response) {
      console.log('错误详情:', error.response.data)
    }
  }
}

testSimpleLLM().catch(console.error)
