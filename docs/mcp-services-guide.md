# MCP 服务配置指南

## 概述

MCP (Model Context Protocol) 服务让您的 AI 助手能够访问实时信息，包括网络搜索和天气查询。本指南将帮助您快速配置和使用这些服务。

## 支持的服务

### 搜索服务

#### 1. Tavily 搜索（推荐）
- **特点**：专为 AI 优化，提供高质量、相关性强的搜索结果
- **功能**：网络搜索，返回摘要和来源链接
- **费用**：免费版每月 1000 次调用
- **获取 API Key**：
  1. 访问 [Tavily 官网](https://tavily.com)
  2. 注册账号并登录
  3. 在控制台复制 API Key（格式：`tvly-xxxxxxxx...`）

#### 2. Brave 搜索
- **特点**：隐私优先的搜索引擎
- **功能**：网页搜索、本地商家搜索
- **费用**：免费版有限额，付费版无限制
- **获取 API Key**：
  1. 访问 [Brave Search API](https://brave.com/search/api/)
  2. 注册并获取 API Key（格式：`BSA-xxxxxxxx...`）

### 天气服务

#### 1. OpenWeather（推荐）
- **特点**：全球天气服务，数据准确
- **功能**：当前天气、5天预报
- **费用**：免费版每天 1000 次调用
- **获取 API Key**：
  1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
  2. 注册账号
  3. 在 API Keys 页面获取密钥（32位字符串）

#### 2. NWS 天气（美国）
- **特点**：美国国家气象局免费服务
- **功能**：美国地区天气预报和警报
- **费用**：完全免费，无需 API Key
- **限制**：仅支持美国地区

## 配置步骤

### 1. 打开设置页面
1. 点击右上角的设置图标
2. 选择 **MCP Services** 标签页

### 2. 配置搜索服务（以 Tavily 为例）
1. 找到 **Tavily 搜索** 卡片
2. 点击右侧的开关启用服务
3. 点击 **配置 API Key** 按钮
4. 在输入框中粘贴您的 API Key
5. 点击 **保存** 按钮
6. 配置成功后，开关会保持开启状态

### 3. 配置天气服务（以 OpenWeather 为例）
1. 找到 **OpenWeather** 卡片
2. 点击右侧的开关启用服务
3. 点击 **配置 API Key** 按钮
4. 在输入框中粘贴您的 API Key
5. 点击 **保存** 按钮

### 4. 验证配置
配置完成后，您可以在对话中测试：
- **搜索测试**：询问 AI "搜索一下最新的科技新闻"
- **天气测试**：询问 AI "北京今天的天气怎么样？"

## 使用示例

### 网络搜索
```
用户：搜索一下 2024 年诺贝尔物理学奖获得者
AI：[调用 tavily_search 工具]
    根据搜索结果，2024年诺贝尔物理学奖授予了...
```

### 天气查询
```
用户：上海明天的天气如何？
AI：[调用 get_weather_forecast 工具]
    上海明天的天气预报：
    - 温度：22°C
    - 天气：多云
    - 湿度：65%
```

## 工具说明

### Tavily 搜索工具
- **工具名称**：`tavily_search`
- **功能**：在网络上搜索信息
- **参数**：
  - `query`（必需）：搜索查询词
  - `search_depth`（可选）：搜索深度（basic/advanced）

### OpenWeather 工具
- **工具名称**：`get_current_weather`
- **功能**：获取当前天气
- **参数**：
  - `location`（必需）：城市名称（如 Beijing, London）
  - `units`（可选）：温度单位（metric/imperial）

- **工具名称**：`get_weather_forecast`
- **功能**：获取天气预报
- **参数**：
  - `location`（必需）：城市名称
  - `units`（可选）：温度单位

## 常见问题

### Q1: API Key 保存后为什么看不到？
A: 出于安全考虑，API Key 默认以密码形式隐藏。点击"小眼睛"图标可以查看明文。

### Q2: 配置后 AI 为什么不调用工具？
A: 请确保：
1. 服务已启用（开关为开启状态）
2. API Key 已正确保存
3. 您的提问明确需要实时信息（如"搜索"、"查询天气"等关键词）

### Q3: API 调用失败怎么办？
A: 检查以下几点：
1. API Key 是否正确
2. 是否超出免费额度
3. 网络连接是否正常

### Q4: 可以同时启用多个搜索服务吗？
A: 可以。AI 会根据需要选择最合适的工具。

### Q5: 如何查看 API 使用量？
A: 请访问对应服务商的控制台：
- Tavily: https://app.tavily.com
- OpenWeather: https://home.openweathermap.org/api_keys

## 技术实现

### 数据库结构
MCP 服务配置存储在 IndexedDB 的 `mcp_servers` 表中：
```javascript
{
  id: 'tavily-search',
  name: 'Tavily 搜索',
  type: 'search',
  apiKey: 'tvly-xxx...',
  isEnabled: true,
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### API 调用流程
1. 用户发送消息
2. 系统检测是否需要工具调用
3. 获取已启用的 MCP 服务
4. 将工具列表发送给 AI 模型
5. AI 决定是否调用工具
6. 执行工具调用并返回结果
7. AI 基于结果生成最终回复

### 代码示例

#### 获取启用的工具
```javascript
import { useMcpServers } from '@/hooks/useMcpServers'

const { getTools } = useMcpServers()
const tools = await getTools()
// 返回 OpenAI 格式的工具列表
```

#### 执行工具调用
```javascript
import { useMcpServers } from '@/hooks/useMcpServers'

const { callTool } = useMcpServers()
const result = await callTool('tavily_search', {
  query: '2024 AI 发展趋势'
})
```

## 安全建议

1. **不要分享 API Key**：API Key 是您的私密凭证，请勿公开分享
2. **定期更换**：建议定期在服务商控制台重新生成 API Key
3. **监控使用量**：定期检查 API 使用情况，避免异常消耗
4. **使用免费额度**：对于个人使用，免费额度通常足够

## 更新日志

### v1.0.0 (2024-10-11)
- ✅ 支持 Tavily 搜索服务
- ✅ 支持 Brave 搜索服务
- ✅ 支持 OpenWeather 天气服务
- ✅ 支持 NWS 天气服务（美国）
- ✅ 提供可视化配置界面
- ✅ API Key 安全存储
- ✅ 工具自动调用

## 反馈与支持

如有问题或建议，请访问：
- GitHub Issues: https://github.com/77Ezra1/AI-Life-system/issues
- 项目文档: https://github.com/77Ezra1/AI-Life-system/docs

---

**提示**：配置 MCP 服务后，您的 AI 助手将能够访问实时信息，提供更准确、更及时的回答！

