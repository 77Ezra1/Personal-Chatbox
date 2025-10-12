# 后端架构设计文档

## 目标

为AI-Life-system添加Node.js后端,支持5个新MCP服务的集成,同时保持现有功能不变。

## 技术栈

- **后端框架**: Express.js (轻量、易用)
- **MCP服务管理**: 独立模块
- **进程管理**: child_process (用于Python服务)
- **API协议**: RESTful JSON

## 目录结构

```
AI-Life-system/
├── src/                    # 前端代码(保持不变)
├── server/                 # 新增后端目录
│   ├── index.js           # 服务器入口
│   ├── config.js          # 配置文件
│   ├── routes/            # API路由
│   │   └── mcp.js         # MCP服务路由
│   ├── services/          # MCP服务实现
│   │   ├── base.js        # 基础服务类
│   │   ├── weather.js     # 天气服务(迁移)
│   │   ├── time.js        # 时间服务(迁移)
│   │   ├── search.js      # 搜索服务(新)
│   │   ├── youtube.js     # YouTube服务(新)
│   │   ├── coincap.js     # 加密货币服务(新)
│   │   ├── scraper.js     # 网页提取服务(新)
│   │   └── memory.js      # 记忆服务(新)
│   └── utils/             # 工具函数
│       ├── logger.js      # 日志
│       └── errors.js      # 错误处理
├── package.json           # 更新依赖
└── .env                   # 环境变量(新增)
```

## API设计

### 1. 获取可用服务列表

```
GET /api/mcp/services
```

响应:
```json
{
  "services": [
    {
      "id": "weather",
      "name": "天气服务",
      "enabled": true,
      "tools": [...]
    }
  ]
}
```

### 2. 调用MCP工具

```
POST /api/mcp/call
```

请求:
```json
{
  "toolName": "search_web",
  "parameters": {
    "query": "2025年AI趋势",
    "max_results": 10
  }
}
```

响应:
```json
{
  "success": true,
  "content": "搜索结果...",
  "metadata": {...}
}
```

### 3. 启用/禁用服务

```
POST /api/mcp/services/:serviceId/toggle
```

请求:
```json
{
  "enabled": true
}
```

## 服务实现策略

### 1. 天气服务 (迁移)
- 保持现有逻辑
- 从前端移到后端
- API调用Open-Meteo

### 2. 时间服务 (迁移)
- 保持现有逻辑
- 从前端移到后端

### 3. 搜索服务 (新 - open-webSearch)
- 克隆GitHub仓库: `Aas-ee/open-webSearch`
- 通过child_process调用Python脚本
- 支持多引擎: Bing, Baidu, DuckDuckGo, Brave

### 4. YouTube服务 (新)
- 克隆: `kimtaeyoon83/mcp-server-youtube-transcript`
- TypeScript实现,直接集成

### 5. Coincap服务 (新)
- 克隆: `QuantGeekDev/coincap-mcp`
- 调用CoinCap公共API

### 6. 网页提取服务 (新 - ashra)
- 克隆: `getrupt/ashra-mcp`
- TypeScript实现

### 7. 记忆服务 (新 - 官方)
- 克隆: `modelcontextprotocol/server-memory`
- 官方实现,持久化存储

## 前端改动

### 最小化修改原则

1. **保持UI不变**: 所有UI组件保持原样
2. **修改API调用**: 
   - 原: 前端直接调用MCP逻辑
   - 新: 前端调用后端API
3. **配置管理**: 服务启用/禁用通过后端API

### 修改文件列表

- `src/lib/aiClient.js` - 修改工具调用逻辑
- `src/hooks/useMcpManager.js` - 改为调用后端API
- `src/App.jsx` - 最小化修改

## 错误处理

### 统一错误格式

```json
{
  "success": false,
  "error": "服务暂时不可用",
  "details": "当前API服务拥挤导致该服务暂不可用,请稍后再试",
  "code": "SERVICE_UNAVAILABLE"
}
```

### 错误类型

- `SERVICE_UNAVAILABLE` - 服务不可用
- `INVALID_PARAMETERS` - 参数错误
- `API_RATE_LIMIT` - API限流
- `NETWORK_ERROR` - 网络错误
- `INTERNAL_ERROR` - 内部错误

## 懒加载实现

### 服务状态管理

```javascript
const serviceStates = {
  weather: { enabled: true, loaded: true },
  time: { enabled: true, loaded: true },
  search: { enabled: false, loaded: false },  // 默认关闭
  youtube: { enabled: false, loaded: false },
  coincap: { enabled: false, loaded: false },
  scraper: { enabled: false, loaded: false },
  memory: { enabled: false, loaded: false }
}
```

### 加载流程

1. 用户在设置中启用服务
2. 前端调用 `POST /api/mcp/services/:id/toggle`
3. 后端首次加载服务(克隆仓库、安装依赖)
4. 服务就绪后返回成功

## 测试计划

### 1. 单元测试
- 每个服务独立测试
- 使用真实API调用

### 2. 集成测试
- 前后端联调
- 使用DeepSeek API测试完整流程

### 3. 测试用例

```javascript
// 测试搜索服务
测试查询: "2025年AI发展趋势"
预期: 返回多引擎搜索结果

// 测试YouTube服务
测试URL: "https://www.youtube.com/watch?v=xxx"
预期: 返回字幕文本

// 测试Coincap服务
测试查询: "比特币价格"
预期: 返回BTC实时价格

// 测试网页提取
测试URL: "https://example.com"
预期: 返回结构化JSON数据

// 测试记忆服务
测试: 存储和检索对话记忆
预期: 能够跨会话记忆
```

## 部署配置

### 开发环境

```bash
# 启动后端
cd server && node index.js

# 启动前端
npm run dev
```

### 生产环境

```bash
# 构建前端
npm run build

# 启动后端(生产模式)
NODE_ENV=production node server/index.js
```

## 安全考虑

1. **API密钥管理**: 使用环境变量
2. **CORS配置**: 只允许前端域名
3. **请求限流**: 防止滥用
4. **输入验证**: 所有参数严格验证

## 性能优化

1. **服务缓存**: 相同查询缓存5分钟
2. **连接池**: 复用HTTP连接
3. **超时控制**: 每个服务30秒超时
4. **并发限制**: 最多10个并发请求

## 回滚策略

如果新架构出现问题:
1. 保留原有前端代码分支
2. 可快速切换回纯前端模式
3. 后端作为可选增强功能

