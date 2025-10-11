# MCP服务使用指南

## 概述

本应用集成了6个MCP(Model Context Protocol)服务,为AI助手提供实时数据访问能力。所有服务都是免费的,无需API密钥即可使用。

## 快速开始

### 1. 启动服务

```bash
# 启动后端服务
cd AI-Life-system
npm run server

# 在另一个终端启动前端
npm run dev
```

### 2. 配置服务

1. 打开应用设置
2. 找到"MCP服务配置"部分
3. 点击服务卡片上的开关来启用/禁用服务
4. 点击信息图标(ℹ️)查看服务详情和参数格式

## 可用服务

### 🌤️ 天气服务

**功能**: 获取全球城市的实时天气和天气预报

**可用工具**:

1. **get_current_weather** - 获取当前天气
   ```json
   {
     "location": "北京",
     "units": "celsius"
   }
   ```
   
2. **get_weather_forecast** - 获取天气预报
   ```json
   {
     "location": "上海",
     "days": 3,
     "units": "celsius"
   }
   ```

**使用示例**:
- "北京今天天气怎么样?"
- "上海未来三天的天气预报"
- "纽约现在的温度是多少?"

**数据来源**: Open-Meteo API

---

### 🕐 时间服务

**功能**: 获取当前时间和时区转换

**可用工具**:

1. **get_current_time** - 获取当前时间
   ```json
   {
     "timezone": "Asia/Shanghai"
   }
   ```

2. **convert_time** - 时区转换
   ```json
   {
     "time": "2025-01-01 12:00",
     "from_tz": "UTC",
     "to_tz": "Asia/Shanghai"
   }
   ```

**使用示例**:
- "现在几点了?"
- "纽约现在是什么时间?"
- "北京时间下午3点是伦敦的几点?"

---

### 🔍 搜索服务

**功能**: 使用DuckDuckGo进行网络搜索

**可用工具**:

1. **search_web** - 网络搜索
   ```json
   {
     "query": "OpenAI GPT-4",
     "max_results": 10
   }
   ```

**使用示例**:
- "搜索最新的AI新闻"
- "查找Python编程教程"
- "GPT-4有什么新功能?"

**注意事项**:
- ⚠️ 请求过于频繁可能会被限流
- 建议在连续搜索之间间隔5-10秒
- 如果遇到限流,请稍后再试

---

### 📹 YouTube服务

**功能**: 提取YouTube视频的字幕和转录文本

**可用工具**:

1. **get_youtube_transcript** - 获取视频字幕
   ```json
   {
     "url": "https://www.youtube.com/watch?v=VIDEO_ID",
     "lang": "auto"
   }
   ```

**语言代码**:
- `auto` - 自动检测(优先中文和英文)
- `zh` - 中文
- `en` - 英文
- `ja` - 日语
- `ko` - 韩语

**使用示例**:
- "获取这个YouTube视频的字幕: https://www.youtube.com/watch?v=..."
- "总结这个视频的内容"
- "翻译这个英文视频"

**注意事项**:
- ⚠️ 仅支持有字幕的视频
- 部分视频可能没有指定语言的字幕
- 建议使用`lang: "auto"`让系统自动尝试

---

### 💰 加密货币服务

**功能**: 获取实时加密货币价格和市场数据

**可用工具**:

1. **get_bitcoin_price** - 获取比特币价格
   ```json
   {}
   ```

2. **get_crypto_price** - 获取指定加密货币价格
   ```json
   {
     "symbol": "ethereum"
   }
   ```

3. **list_crypto_assets** - 列出热门加密货币
   ```json
   {
     "limit": 10
   }
   ```

**使用示例**:
- "比特币现在多少钱?"
- "以太坊的价格是多少?"
- "列出前10名加密货币"

**注意事项**:
- ⚠️ 开发环境可能无法访问CoinCap API(DNS限制)
- 在生产环境中应该正常工作
- 数据来源: CoinCap API

---

### 🌐 网页抓取服务

**功能**: 从URL获取网页内容并转换为Markdown格式

**可用工具**:

1. **fetch_url** - 抓取网页内容
   ```json
   {
     "url": "https://example.com"
   }
   ```

**使用示例**:
- "抓取这个网页的内容: https://..."
- "总结这篇文章: https://..."
- "从这个网页提取主要信息"

**特点**:
- 自动提取网页主要内容
- 转换为Markdown格式便于阅读
- 过滤广告和无关内容

---

## API调用格式

### 后端API端点

**基础URL**: `http://localhost:3001/api/mcp`

### 1. 获取服务列表

```bash
GET /api/mcp/services
```

**响应**:
```json
{
  "success": true,
  "services": [
    {
      "id": "weather",
      "name": "天气服务",
      "description": "获取全球天气信息",
      "enabled": true,
      "loaded": true,
      "tools": [...]
    }
  ]
}
```

### 2. 调用工具

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "toolName": "get_current_weather",
  "parameters": {
    "location": "北京",
    "units": "celsius"
  }
}
```

**响应**:
```json
{
  "success": true,
  "content": "**北京市, 中国 天气信息**\n\n🌡️ 当前温度: 13.4°C\n..."
}
```

### 3. 启用/禁用服务

```bash
POST /api/mcp/services/:serviceId/toggle
Content-Type: application/json

{
  "enabled": true
}
```

---

## 前端集成

### 使用mcpApiClient

```javascript
import { callTool } from '@/lib/mcpApiClient'

// 调用工具
const result = await callTool('get_current_weather', {
  location: '北京',
  units: 'celsius'
})

if (result.success) {
  console.log(result.content)
} else {
  console.error(result.error, result.details)
}
```

### 使用useMcpManager Hook

```javascript
import { useMcpManager } from '@/hooks/useMcpManager'

function MyComponent() {
  const { services, loading, error, toggleService } = useMcpManager()
  
  // 启用/禁用服务
  const handleToggle = async (serviceId) => {
    await toggleService(serviceId, true)
  }
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>
          {service.name}: {service.enabled ? '已启用' : '已禁用'}
        </div>
      ))}
    </div>
  )
}
```

---

## 错误处理

### 常见错误

1. **参数错误**
   ```json
   {
     "success": false,
     "error": "参数错误",
     "code": "INVALID_PARAMETERS",
     "details": "缺少location参数"
   }
   ```
   **解决**: 检查参数名称和格式是否正确

2. **服务未启用**
   ```json
   {
     "success": false,
     "error": "未找到工具",
     "details": "该工具不存在或所属服务未启用"
   }
   ```
   **解决**: 在设置中启用对应的服务

3. **限流错误**
   ```json
   {
     "success": false,
     "error": "服务内部错误",
     "details": "DDG detected an anomaly in the request..."
   }
   ```
   **解决**: 等待几秒后再试,避免频繁请求

4. **网络错误**
   ```json
   {
     "success": false,
     "error": "服务内部错误",
     "details": "fetch failed"
   }
   ```
   **解决**: 检查网络连接,某些API在开发环境可能受限

---

## 测试

### 手动测试

使用提供的测试脚本:

```bash
cd AI-Life-system
node test-mcp-fixed.cjs
```

### 使用curl测试

```bash
# 测试天气服务
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"toolName":"get_current_weather","parameters":{"location":"Beijing"}}'

# 测试时间服务
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"toolName":"get_current_time","parameters":{"timezone":"Asia/Shanghai"}}'

# 测试网页抓取
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"toolName":"fetch_url","parameters":{"url":"https://example.com"}}'
```

---

## 故障排除

### 后端服务无法启动

1. 检查端口3001是否被占用
   ```bash
   lsof -i :3001
   ```

2. 检查依赖是否安装
   ```bash
   npm install
   ```

3. 查看日志
   ```bash
   tail -f server.log
   ```

### 服务调用失败

1. 确认后端服务正在运行
   ```bash
   ps aux | grep "node.*server"
   ```

2. 检查服务是否已启用
   ```bash
   curl http://localhost:3001/api/mcp/services
   ```

3. 验证参数格式
   - 使用正确的参数名(如`location`而非`city`)
   - 确保JSON格式正确
   - 检查必需参数是否提供

### 前端无法连接后端

1. 检查API基础URL配置
   ```javascript
   // src/lib/mcpApiClient.js
   const API_BASE_URL = 'http://localhost:3001/api/mcp'
   ```

2. 检查CORS设置
   ```javascript
   // server/index.cjs
   app.use(cors())
   ```

---

## 最佳实践

### 1. 错误处理

始终检查`success`字段:

```javascript
const result = await callTool(toolName, params)

if (result.success) {
  // 处理成功结果
  console.log(result.content)
} else {
  // 处理错误
  console.error(`错误: ${result.error}`)
  console.error(`详情: ${result.details}`)
}
```

### 2. 速率限制

对于搜索服务,实现请求队列:

```javascript
let lastSearchTime = 0
const MIN_INTERVAL = 5000 // 5秒

async function searchWithRateLimit(query) {
  const now = Date.now()
  const timeSinceLastSearch = now - lastSearchTime
  
  if (timeSinceLastSearch < MIN_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastSearch)
    )
  }
  
  lastSearchTime = Date.now()
  return await callTool('search_web', { query })
}
```

### 3. 用户反馈

提供清晰的状态反馈:

```javascript
// 加载状态
setLoading(true)
setStatus('正在搜索...')

// 调用服务
const result = await callTool('search_web', { query })

// 更新状态
setLoading(false)
if (result.success) {
  setStatus('搜索完成')
} else {
  setStatus(`搜索失败: ${result.error}`)
}
```

### 4. 参数验证

在发送请求前验证参数:

```javascript
function validateWeatherParams(params) {
  if (!params.location) {
    throw new Error('location参数是必需的')
  }
  
  if (params.units && !['celsius', 'fahrenheit'].includes(params.units)) {
    throw new Error('units必须是celsius或fahrenheit')
  }
  
  return true
}
```

---

## 更新日志

### 2025-10-11

- ✅ 修复后端API `/api/mcp/services` 500错误
- ✅ 更新天气服务参数(使用`location`而非`city`)
- ✅ 改进前端UI,显示工具参数和使用说明
- ✅ 添加服务限制和注意事项提示
- ✅ 创建完整的测试脚本
- ⚠️ 识别搜索服务限流问题
- ⚠️ 识别加密货币服务网络访问问题

---

## 支持

如有问题或建议,请:

1. 查看[MCP_SERVICES_STATUS.md](./MCP_SERVICES_STATUS.md)了解当前服务状态
2. 查看[GETTING_STARTED.md](./GETTING_STARTED.md)了解基本使用
3. 查看服务器日志文件`server.log`
4. 提交Issue到GitHub仓库

---

## 参考资源

- [Model Context Protocol规范](https://modelcontextprotocol.io/)
- [Open-Meteo天气API](https://open-meteo.com/)
- [DuckDuckGo搜索](https://duckduckgo.com/)
- [CoinCap加密货币API](https://coincap.io/)
- [YouTube Captions Scraper](https://www.npmjs.com/package/youtube-captions-scraper)

