# AI-Life-System MCP服务集成指南

## 概述

本项目已成功集成4个核心MCP服务,采用前后端分离架构:
- **前端**: React + Vite (原有架构保持不变)
- **后端**: Node.js + Express (新增)

## 已集成的服务

### 1. 搜索服务 (DuckDuckGo)
- **工具**: `search_web`
- **功能**: 网络搜索
- **参数**:
  - `query` (必需): 搜索查询词
  - `max_results` (可选): 最大结果数,默认10

### 2. YouTube字幕服务
- **工具**: `get_youtube_transcript`
- **功能**: 获取YouTube视频字幕
- **参数**:
  - `video_id` (必需): YouTube视频ID
  - `lang` (可选): 语言代码,默认'en'

### 3. 加密货币数据服务 (Coincap)
- **工具**:
  - `get_bitcoin_price`: 获取比特币价格
  - `get_crypto_price`: 获取指定加密货币价格
  - `list_crypto_assets`: 列出热门加密货币
- **参数**:
  - `symbol` (部分工具需要): 加密货币符号

### 4. 网页抓取服务
- **工具**: `fetch_url`
- **功能**: 抓取网页内容并转换为Markdown
- **参数**:
  - `url` (必需): 目标网页URL
  - `max_length` (可选): 最大内容长度

### 5. 天气服务 (保留)
- **工具**:
  - `get_current_weather`: 获取当前天气
  - `get_weather_forecast`: 获取天气预报

### 6. 时间服务 (保留)
- **工具**:
  - `get_current_time`: 获取当前时间
  - `convert_time`: 时区转换

## 架构说明

### 后端服务 (server/)

```
server/
├── index.cjs           # 主服务器入口
├── config.cjs          # 配置文件
├── routes/
│   └── mcp.cjs         # MCP API路由
├── services/           # MCP服务实现
│   ├── base.cjs        # 基础服务类
│   ├── weather.cjs     # 天气服务
│   ├── time.cjs        # 时间服务
│   ├── search.cjs      # 搜索服务
│   ├── youtube.cjs     # YouTube服务
│   ├── coincap.cjs     # 加密货币服务
│   └── fetch.cjs       # 网页抓取服务
└── utils/              # 工具函数
    ├── logger.cjs      # 日志工具
    └── errors.cjs      # 错误处理
```

### 前端修改 (src/)

- **新增**: `src/lib/mcpApiClient.js` - 后端API客户端
- **修改**: `src/hooks/useMcpManager.js` - 改为调用后端API
- **新增**: `.env` - 环境变量配置

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
# 方式1: 使用启动脚本(推荐)
./start-backend.sh

# 方式2: 手动启动
node server/index.cjs

# 方式3: 后台运行
nohup node server/index.cjs > server.log 2>&1 &
```

后端服务将运行在 `http://localhost:3001`

### 3. 启动前端服务

```bash
npm run dev
```

前端服务将运行在 `http://localhost:5173`

## API使用示例

### 获取服务列表

```bash
curl http://localhost:3001/api/mcp/services
```

### 启用/禁用服务

```bash
# 启用搜索服务
curl -X POST http://localhost:3001/api/mcp/services/search/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled":true}'
```

### 调用工具

```bash
# 搜索
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "search_web",
    "parameters": {
      "query": "AI trends 2025",
      "max_results": 5
    }
  }'

# 获取天气
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "get_current_weather",
    "parameters": {
      "location": "北京"
    }
  }'

# 抓取网页
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "fetch_url",
    "parameters": {
      "url": "https://example.com"
    }
  }'
```

## 配置说明

### 环境变量 (.env)

```env
# 后端API地址
VITE_MCP_API_URL=http://localhost:3001/api/mcp
```

### 服务配置 (server/config.cjs)

```javascript
services: {
  search: {
    enabled: false,  // 默认关闭
    autoLoad: false  // 不自动加载
  },
  // ... 其他服务配置
}
```

## 服务管理

### 默认启用的服务

- 天气服务 ✅
- 时间服务 ✅

### 需要手动启用的服务

- 搜索服务 (DuckDuckGo)
- YouTube字幕服务
- 加密货币服务
- 网页抓取服务

### 在应用中启用服务

1. 打开应用设置 ⚙️
2. 进入"MCP服务"标签
3. 点击服务卡片上的开关按钮
4. 服务将被启用并可供使用

## 错误处理

所有服务都实现了完善的错误处理:

- **网络错误**: 明确提示网络连接问题
- **API限流**: 提示请求过于频繁
- **参数错误**: 提示缺少必需参数
- **服务不可用**: 提示服务暂时无法使用

错误信息格式:

```json
{
  "success": false,
  "error": "错误类型",
  "code": "ERROR_CODE",
  "details": "详细错误信息"
}
```

## 性能优化

- **懒加载**: 服务默认关闭,按需启用
- **缓存**: 支持结果缓存(可配置)
- **限流**: 防止API滥用
- **超时控制**: 避免长时间等待

## 故障排查

### 后端无法启动

1. 检查端口3001是否被占用
2. 查看日志: `cat server.log`
3. 确认依赖已安装: `npm install`

### 前端无法连接后端

1. 确认后端已启动: `curl http://localhost:3001/health`
2. 检查.env配置
3. 查看浏览器控制台错误

### 服务调用失败

1. 确认服务已启用
2. 查看后端日志: `tail -f server.log`
3. 检查网络连接
4. 验证参数格式

## 开发建议

### 添加新服务

1. 在`server/services/`创建新服务类
2. 继承`BaseService`
3. 实现`initialize()`和`execute()`方法
4. 在`server/config.cjs`添加配置
5. 在`server/index.cjs`导入并注册

### 修改服务配置

编辑`server/config.cjs`:

```javascript
services: {
  myService: {
    id: 'myService',
    name: '我的服务',
    enabled: false,
    autoLoad: false,
    description: '服务描述'
  }
}
```

## 注意事项

1. **不要修改其他业务逻辑**: MCP服务是独立模块
2. **服务默认关闭**: 用户需要手动启用
3. **错误信息要明确**: 告知用户真实原因
4. **测试要充分**: 确保所有功能正常
5. **代码要简洁**: 易于维护和扩展

## 下一步计划

- [ ] 添加记忆服务(Knowledge Graph)
- [ ] 优化搜索质量(多引擎聚合)
- [ ] 添加更多免费MCP服务
- [ ] 实现服务插件化架构
- [ ] 添加服务使用统计

## 技术支持

如有问题,请查看:
- 后端日志: `server.log`
- 浏览器控制台
- GitHub Issues

---

**版本**: 1.0.0  
**更新日期**: 2025-10-11  
**维护者**: AI-Life-System Team

