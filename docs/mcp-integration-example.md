# MCP 集成示例代码

本文档展示如何在您的 AI 对话应用中集成 MCP 工具调用功能。

## 1. 在对话组件中集成 MCP

### 导入必要的 Hook
```javascript
import { useMcpServers } from '@/hooks/useMcpServers'
```

### 在组件中使用
```javascript
function ChatComponent() {
  const { getTools, callTool } = useMcpServers()
  
  // 发送消息时获取工具列表
  const handleSendMessage = async (message) => {
    // 1. 获取已启用的工具
    const tools = await getTools()
    
    // 2. 调用 AI API（以 OpenAI 为例）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: message }
        ],
        tools: tools, // 传递工具列表
        tool_choice: 'auto'
      })
    })
    
    const data = await response.json()
    const assistantMessage = data.choices[0].message
    
    // 3. 检查是否需要调用工具
    if (assistantMessage.tool_calls) {
      const toolResults = []
      
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await callTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        )
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: result.success ? result.content : result.error
        })
      }
      
      // 4. 将工具结果发送回 AI
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'user', content: message },
            assistantMessage,
            ...toolResults
          ]
        })
      })
      
      const finalData = await finalResponse.json()
      return finalData.choices[0].message.content
    }
    
    return assistantMessage.content
  }
  
  return (
    // 您的 UI 组件
  )
}
```

## 2. 完整的流式响应示例

```javascript
async function sendMessageWithTools(messages, apiKey) {
  const { getTools, callTool } = useMcpServers()
  const tools = await getTools()
  
  // 第一次请求
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      stream: true
    })
  })
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let toolCalls = []
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices[0]?.delta
          
          // 收集工具调用
          if (delta?.tool_calls) {
            toolCalls.push(...delta.tool_calls)
          }
        } catch (e) {
          console.error('Parse error:', e)
        }
      }
    }
  }
  
  // 如果有工具调用，执行它们
  if (toolCalls.length > 0) {
    const toolResults = []
    
    for (const toolCall of toolCalls) {
      const result = await callTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      )
      
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result.success ? result.content : `Error: ${result.error}`
      })
    }
    
    // 第二次请求，包含工具结果
    return await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: null,
            tool_calls: toolCalls
          },
          ...toolResults
        ],
        stream: true
      })
    })
  }
  
  return response
}
```

## 3. 手动调用工具示例

### 搜索示例
```javascript
import { callTavilySearch, formatTavilyResults } from '@/lib/mcpClient'

async function searchWeb(query) {
  const apiKey = 'tvly-your-api-key'
  
  const result = await callTavilySearch(apiKey, query, {
    searchDepth: 'basic',
    maxResults: 5
  })
  
  if (result.success) {
    const formatted = formatTavilyResults(result.data)
    console.log(formatted)
  } else {
    console.error('Search failed:', result.error)
  }
}

// 使用
searchWeb('最新的 AI 技术发展')
```

### 天气查询示例
```javascript
import { callOpenWeatherCurrent, formatOpenWeatherCurrent } from '@/lib/mcpClient'

async function getWeather(city) {
  const apiKey = 'your-openweather-api-key'
  
  const result = await callOpenWeatherCurrent(apiKey, city, 'metric')
  
  if (result.success) {
    const formatted = formatOpenWeatherCurrent(result.data)
    console.log(formatted)
  } else {
    console.error('Weather query failed:', result.error)
  }
}

// 使用
getWeather('Beijing')
```

## 4. 数据库操作示例

### 保存 MCP 服务配置
```javascript
import { saveMcpServer } from '@/lib/db/mcpServers'

async function saveService() {
  const server = await saveMcpServer({
    id: 'tavily-search',
    name: 'Tavily 搜索',
    type: 'search',
    url: 'https://api.tavily.com/search',
    authType: 'bearer',
    apiKey: 'tvly-your-api-key',
    isEnabled: true
  })
  
  console.log('Saved:', server)
}
```

### 更新服务状态
```javascript
import { updateMcpServer } from '@/lib/db/mcpServers'

async function toggleService(id, enabled) {
  const updated = await updateMcpServer(id, {
    isEnabled: enabled
  })
  
  console.log('Updated:', updated)
}
```

### 获取所有启用的服务
```javascript
import { getActiveMcpServers } from '@/lib/db/mcpServers'

async function getEnabledServices() {
  const servers = await getActiveMcpServers()
  console.log('Enabled services:', servers)
}
```

## 5. React Hook 使用示例

```javascript
import { useMcpServers } from '@/hooks/useMcpServers'

function MyComponent() {
  const { servers, loading, error, getTools, callTool } = useMcpServers()
  
  useEffect(() => {
    async function init() {
      const tools = await getTools()
      console.log('Available tools:', tools)
    }
    init()
  }, [])
  
  const handleSearch = async () => {
    const result = await callTool('tavily_search', {
      query: 'React best practices 2024'
    })
    
    if (result.success) {
      console.log('Search results:', result.content)
    }
  }
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <h3>Enabled Services: {servers.length}</h3>
      <button onClick={handleSearch}>Search</button>
    </div>
  )
}
```

## 6. 错误处理

```javascript
async function safeToolCall(toolName, parameters) {
  const { callTool } = useMcpServers()
  
  try {
    const result = await callTool(toolName, parameters)
    
    if (!result.success) {
      // 处理工具调用失败
      console.error(`Tool ${toolName} failed:`, result.error)
      return {
        success: false,
        message: `抱歉，${toolName} 调用失败：${result.error}`
      }
    }
    
    return {
      success: true,
      content: result.content
    }
  } catch (error) {
    // 处理异常
    console.error('Unexpected error:', error)
    return {
      success: false,
      message: '发生未知错误，请稍后重试'
    }
  }
}
```

## 7. 测试工具调用

```javascript
// 测试搜索功能
async function testSearch() {
  const { callTool } = useMcpServers()
  
  console.log('Testing Tavily search...')
  const result = await callTool('tavily_search', {
    query: 'OpenAI GPT-4',
    search_depth: 'basic'
  })
  
  console.log('Result:', result)
}

// 测试天气功能
async function testWeather() {
  const { callTool } = useMcpServers()
  
  console.log('Testing weather query...')
  const result = await callTool('get_current_weather', {
    location: 'London',
    units: 'metric'
  })
  
  console.log('Result:', result)
}

// 运行测试
testSearch()
testWeather()
```

## 8. 工具选择策略

```javascript
function shouldUseTools(message) {
  const searchKeywords = ['搜索', '查找', '最新', 'search', 'find', 'latest']
  const weatherKeywords = ['天气', '气温', '温度', 'weather', 'temperature']
  
  const needsSearch = searchKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  const needsWeather = weatherKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  return {
    needsSearch,
    needsWeather,
    needsTools: needsSearch || needsWeather
  }
}

// 使用
const message = "搜索一下北京今天的天气"
const { needsSearch, needsWeather } = shouldUseTools(message)
console.log({ needsSearch, needsWeather }) // { needsSearch: true, needsWeather: true }
```

## 总结

通过以上示例，您可以：
1. ✅ 在对话中集成 MCP 工具
2. ✅ 处理流式响应和工具调用
3. ✅ 手动调用特定工具
4. ✅ 管理服务配置
5. ✅ 实现错误处理
6. ✅ 测试工具功能

更多详细信息，请参考 [MCP 服务配置指南](./mcp-services-guide.md)。

