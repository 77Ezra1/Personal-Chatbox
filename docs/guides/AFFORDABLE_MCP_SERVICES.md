# 轻付费MCP服务推荐 (月预算≤10美金)

根据awesome-mcp-servers仓库的调研,以下是适合您预算的优质MCP服务:

---

## 🔍 搜索服务

### 1. **Kagi Search** ⭐ 强烈推荐
- **仓库**: `kagisearch/kagimcp`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 免费试用: 100次搜索
  - Starter: $5/月 - 300次搜索
  - Professional: $10/月 - **无限搜索**
- **特点**:
  - 无广告、无追踪、高质量搜索结果
  - 比Google更好的搜索体验
  - 公平定价:未使用的月份自动退款
  - 包含AI助手功能
- **推荐**: Professional计划$10/月,无限搜索,完全符合预算
- **官网**: https://kagi.com/

### 2. **Tavily AI Search**
- **仓库**: `kshern/mcp-tavily`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 免费: 1000次搜索/月
  - Basic: $20/月 - 2000次搜索
- **特点**:
  - AI优化的搜索结果
  - 专为AI应用设计
  - 包含来源引用
- **推荐**: 免费额度足够轻度使用

### 3. **Exa AI Search**
- **仓库**: `exa-labs/exa-mcp-server`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 免费: 1000次搜索/月
  - Starter: $20/月
- **特点**:
  - 语义搜索,理解查询意图
  - 高质量结果过滤
  - 实时网页数据
- **推荐**: 免费额度试用

---

## 🌤️ 天气服务

### **AccuWeather**
- **仓库**: `TimLukaHorstmann/mcp-weather`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 免费层: 50次调用/天
  - Limited Trial: $25/月 - 无限调用
- **特点**:
  - 准确的天气预报
  - 全球覆盖
  - 详细的天气数据
- **推荐**: 免费层足够日常使用

---

## 💰 金融数据服务

### 1. **Alpha Vantage** ⭐ 推荐
- **仓库**: `berlinbra/alpha-vantage-mcp`
- **类型**: 🐍 Python, ☁️ 云服务
- **定价**: 
  - 免费: 25次请求/天
  - Premium: $49.99/月 - 无限请求
- **特点**:
  - 股票和加密货币数据
  - 实时和历史数据
  - 技术指标
- **推荐**: 免费层适合轻度使用

### 2. **Dexscreener** ✅ 已集成
- **仓库**: `janswist/mcp-dexscreener`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: **完全免费**
- **特点**:
  - 实时加密货币价格
  - 20+区块链支持
  - 500万+代币数据
- **推荐**: 免费且强大,已在您的系统中集成

---

## 🎥 视频/多媒体服务

### **YouTube Transcription (OpenAI Whisper)**
- **仓库**: `format37/youtube_mcp`
- **类型**: 🐍 Python, ☁️ 云服务
- **定价**: 
  - 使用OpenAI Whisper API
  - 约$0.006/分钟音频
  - 估算: 1小时视频 ≈ $0.36
- **特点**:
  - 比字幕更准确的转录
  - 支持多语言
  - 自动下载和处理
- **推荐**: 按需使用,成本极低

---

## 📰 新闻和内容服务

### 1. **New York Times**
- **仓库**: `angheljf/nyt`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 免费: 500次请求/天
  - 付费: $5-10/月
- **特点**:
  - 高质量新闻内容
  - 文章搜索
  - 分类浏览
- **推荐**: 免费层足够使用

### 2. **Google News**
- **仓库**: `chanmeng/google-news-mcp-server`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - 通过SerpAPI
  - 免费: 100次搜索/月
  - Paid: $50/月 - 5000次搜索
- **特点**:
  - 多语言支持
  - 主题分类
  - 实时新闻
- **推荐**: 免费层试用

---

## 📊 数据和分析服务

### **Perplexity Sonar** (via Nexus)
- **仓库**: `adawalli/nexus`
- **类型**: 📇 TypeScript, ☁️ 云服务
- **定价**: 
  - Perplexity API: $5/月起
  - 包含搜索和AI回答
- **特点**:
  - AI驱动的搜索
  - 带来源引用的答案
  - 零安装(NPX)
- **推荐**: 高性价比

---

## 💡 最佳组合推荐 (月预算$10)

### 方案A: 全功能套餐
```
1. Kagi Search Professional - $10/月
   ✅ 无限搜索
   ✅ AI助手(标准模型)
   ✅ 无广告、无追踪
   ✅ 高质量结果

总计: $10/月
```

### 方案B: 免费+按需付费
```
1. Tavily AI Search - 免费 (1000次/月)
2. Dexscreener - 免费 (加密货币)
3. AccuWeather - 免费 (50次/天)
4. YouTube Whisper - 按需 (~$2-3/月)
5. NYT API - 免费 (500次/天)

总计: ~$2-3/月
```

### 方案C: 混合方案
```
1. Kagi Search Starter - $5/月 (300次搜索)
2. Dexscreener - 免费
3. AccuWeather - 免费
4. YouTube Whisper - 按需 (~$2/月)

总计: ~$7/月
```

---

## 🎯 具体推荐

根据您的需求,我建议:

### 立即集成 (免费):
1. ✅ **Dexscreener** - 已集成,加密货币数据
2. **Tavily AI Search** - 免费1000次/月,替代DuckDuckGo
3. **AccuWeather** - 免费50次/天,替代当前天气服务

### 考虑付费 (高性价比):
1. **Kagi Search Professional** - $10/月
   - 无限搜索,完全解决搜索问题
   - 包含AI助手功能
   - 公平定价政策

---

## 📝 集成优先级

### 高优先级 (免费且稳定):
1. **Tavily AI Search** - 替代DuckDuckGo
2. **AccuWeather** - 改进天气服务
3. **NYT API** - 新增新闻功能

### 中优先级 (轻付费):
1. **Kagi Search** - 如果预算允许
2. **YouTube Whisper** - 按需使用

### 低优先级 (可选):
1. **Perplexity Sonar** - 如果需要AI搜索
2. **Alpha Vantage** - 如果需要股票数据

---

## 🔧 下一步行动

1. **立即集成免费服务**:
   - Tavily AI Search (注册免费API密钥)
   - AccuWeather (注册免费API密钥)

2. **测试Kagi Search**:
   - 注册免费试用(100次搜索)
   - 评估是否值得$10/月

3. **保留现有服务**:
   - Dexscreener (已集成,工作良好)
   - YouTube字幕 (免费,无需更换)

---

## 📚 参考链接

- Kagi Search: https://kagi.com/
- Tavily AI: https://tavily.com/
- AccuWeather API: https://developer.accuweather.com/
- Alpha Vantage: https://www.alphavantage.co/
- Awesome MCP Servers: https://github.com/punkpeye/awesome-mcp-servers

