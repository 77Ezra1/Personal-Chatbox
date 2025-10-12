# 适合国内网络环境的MCP服务推荐

基于对 [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) 仓库的分析,以下是适合国内网络环境的MCP服务推荐,可以替代当前无法使用的服务。

---

## 🔍 问题分析

### 当前无法使用的服务

1. **Dexscreener加密货币服务**
   - 问题: Dexscreener API服务器在国外,国内访问受限
   - 影响: 无法获取实时加密货币价格

2. **网页抓取服务 (Fetch)**
   - 问题: 部分国外网站访问受限
   - 影响: 抓取国外网站内容失败

3. **Playwright浏览器自动化**
   - 问题: 启动Chromium浏览器较慢,部分网站访问受限
   - 影响: 浏览器操作超时

---

## 🎯 推荐的替代服务

### 1. 中国股票市场数据服务 (替代加密货币服务)

#### **HuggingAGI/mcp-baostock-server** ⭐⭐⭐⭐⭐

**项目地址**: https://github.com/HuggingAGI/mcp-baostock-server

**特点**:
- 🐍 Python实现
- ☁️ 云服务
- 🇨🇳 **专门针对中国股票市场**
- 📊 基于baostock数据源

**功能**:
- 获取A股实时行情
- 历史数据查询
- 技术指标分析
- 财务数据获取

**优势**:
- ✅ 数据源在国内,访问速度快
- ✅ 完全免费,无需API密钥
- ✅ 数据准确可靠
- ✅ 支持中文股票代码

**安装方式**:
```bash
# 克隆项目
git clone https://github.com/HuggingAGI/mcp-baostock-server.git
cd mcp-baostock-server

# 安装依赖
pip install -r requirements.txt

# 启动服务
python server.py
```

---

### 2. 多引擎网页搜索服务 (替代网页抓取)

#### **Aas-ee/open-webSearch** ⭐⭐⭐⭐⭐

**项目地址**: https://github.com/Aas-ee/open-webSearch

**特点**:
- 🐍 Python / 📇 TypeScript双实现
- ☁️ 云服务
- 🆓 **完全免费,无需API密钥**
- 🌐 **支持百度搜索**

**支持的搜索引擎**:
- ✅ **Baidu** (百度) - 国内主流搜索引擎
- ✅ Bing
- ✅ DuckDuckGo
- ✅ Brave
- ✅ Exa
- ✅ CSDN (中文技术社区)

**功能**:
- 多引擎并行搜索
- 自动去重和排序
- 支持中文搜索
- 返回结构化结果

**优势**:
- ✅ 百度搜索对中文内容友好
- ✅ CSDN适合技术问题搜索
- ✅ 无需API密钥,开箱即用
- ✅ 支持国内网络环境

**安装方式**:
```bash
# Python版本
git clone https://github.com/Aas-ee/open-webSearch.git
cd open-webSearch
pip install -r requirements.txt
python server.py

# 或TypeScript版本
npm install
npm start
```

---

### 3. Bilibili内容服务 (额外推荐)

#### **34892002/bilibili-mcp-js** ⭐⭐⭐⭐

**项目地址**: https://github.com/34892002/bilibili-mcp-js

**特点**:
- 📇 TypeScript实现
- 🏠 本地服务
- 🎥 **B站内容搜索和获取**

**功能**:
- 搜索B站视频
- 获取视频信息
- 获取评论数据
- 获取UP主信息

**优势**:
- ✅ 完全国内服务,速度快
- ✅ 提供LangChain集成示例
- ✅ 支持中文内容搜索
- ✅ 数据丰富,适合内容分析

**安装方式**:
```bash
git clone https://github.com/34892002/bilibili-mcp-js.git
cd bilibili-mcp-js
npm install
npm start
```

---

#### **xspadex/bilibili-mcp** ⭐⭐⭐⭐

**项目地址**: https://github.com/xspadex/bilibili-mcp

**特点**:
- 📇 TypeScript实现
- 🏠 本地服务
- 🔥 **获取B站热门视频**
- 基于FastMCP框架

**功能**:
- 获取B站热门榜单
- 实时热点视频
- 标准MCP接口

**优势**:
- ✅ 轻量级实现
- ✅ 专注热门内容
- ✅ 易于集成

---

### 4. 阿里云服务集成 (企业级推荐)

#### **aliyun/alibaba-cloud-ops-mcp-server** ⭐⭐⭐⭐⭐

**项目地址**: https://github.com/aliyun/alibaba-cloud-ops-mcp-server

**特点**:
- 🎖️ 官方实现
- 🐍 Python实现
- ☁️ 云服务
- 🏢 **阿里云官方支持**

**功能**:
- ECS实例管理
- 云监控数据获取
- OOS运维编排
- 多种云产品支持

**优势**:
- ✅ 阿里云官方维护
- ✅ 国内访问速度快
- ✅ 企业级稳定性
- ✅ 完整的文档支持

**适用场景**:
- 企业云资源管理
- 自动化运维
- 监控告警集成

---

### 5. LeetCode编程题目服务 (开发者推荐)

#### **jinzcdev/leetcode-mcp-server** ⭐⭐⭐⭐

**项目地址**: https://github.com/jinzcdev/leetcode-mcp-server

**特点**:
- 📇 TypeScript实现
- ☁️ 云服务
- 🇨🇳 **同时支持 leetcode.com 和 leetcode.cn**

**功能**:
- 获取编程题目
- 查看题解
- 提交记录查询
- 用户笔记访问

**优势**:
- ✅ 支持力扣中国站
- ✅ 适合国内开发者
- ✅ 可选身份认证
- ✅ 完整的题目数据

---

### 6. 个人数据聚合服务 (综合推荐)

#### **YangLiangwei/PersonalizationMCP** ⭐⭐⭐⭐⭐

**项目地址**: https://github.com/YangLiangwei/PersonalizationMCP

**特点**:
- 🐍 Python实现
- ☁️ 云服务 + 🏠 本地服务
- 🌐 **支持B站、微信等国内平台**
- 🔐 OAuth2认证

**支持的平台**:
- ✅ **Bilibili** (B站)
- ✅ Steam
- ✅ YouTube
- ✅ Spotify
- ✅ Reddit
- 等90+工具

**功能**:
- 多平台数据聚合
- 自动令牌管理
- 游戏数据访问
- 音乐视频数据
- 社交平台数据

**优势**:
- ✅ 一站式数据聚合
- ✅ 支持国内主流平台
- ✅ 功能丰富(90+工具)
- ✅ 自动化认证管理

---

## 📋 服务对比表

| 服务名称 | 类型 | 语言 | 国内友好度 | 推荐指数 | 替代目标 |
|---------|------|------|-----------|---------|---------|
| **mcp-baostock-server** | 股票数据 | Python | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Dexscreener |
| **open-webSearch** | 网页搜索 | Python/TS | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 网页抓取 |
| **bilibili-mcp-js** | B站内容 | TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | - |
| **bilibili-mcp** | B站热门 | TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | - |
| **alibaba-cloud-ops** | 云服务 | Python | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - |
| **leetcode-mcp-server** | 编程题目 | TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | - |
| **PersonalizationMCP** | 数据聚合 | Python | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - |

---

## 🚀 推荐实施方案

### 方案A: 最小替换 (推荐)

**目标**: 只替换无法使用的服务

**步骤**:
1. **移除**: Dexscreener加密货币服务
2. **添加**: mcp-baostock-server (中国股票数据)
3. **保留**: 网页抓取服务 (可能部分可用)
4. **优化**: 添加open-webSearch作为备用

**优势**:
- ✅ 改动最小
- ✅ 风险最低
- ✅ 快速实施

---

### 方案B: 全面升级 (推荐)

**目标**: 打造适合国内环境的完整服务体系

**服务配置**:
1. ✅ **天气服务** - 保留
2. ✅ **时间服务** - 保留
3. 🆕 **mcp-baostock-server** - 中国股票数据
4. 🆕 **open-webSearch** - 多引擎搜索(含百度)
5. 🆕 **bilibili-mcp** - B站内容
6. ✅ **网页抓取** - 保留作为备用
7. ❌ **Playwright** - 移除(国内访问慢)
8. ❌ **Dexscreener** - 移除(国外服务)

**优势**:
- ✅ 完全适配国内网络
- ✅ 服务响应速度快
- ✅ 功能更丰富
- ✅ 用户体验更好

---

### 方案C: 企业级方案

**目标**: 适合企业和高级用户

**服务配置**:
1. ✅ **天气服务** - 保留
2. ✅ **时间服务** - 保留
3. 🆕 **mcp-baostock-server** - 股票数据
4. 🆕 **open-webSearch** - 搜索服务
5. 🆕 **alibaba-cloud-ops** - 阿里云管理
6. 🆕 **PersonalizationMCP** - 数据聚合
7. 🆕 **leetcode-mcp-server** - 编程学习

**优势**:
- ✅ 功能最全面
- ✅ 适合专业用户
- ✅ 支持企业场景
- ✅ 可扩展性强

---

## 🔧 实施步骤

### 步骤1: 备份当前配置

```bash
cd Personal Chatbox
cp server/config.cjs server/config.cjs.backup
```

### 步骤2: 安装新服务

```bash
# 创建MCP服务目录
mkdir -p ~/mcp-services

# 安装中国股票服务
cd ~/mcp-services
git clone https://github.com/HuggingAGI/mcp-baostock-server.git
cd mcp-baostock-server
pip3 install -r requirements.txt

# 安装多引擎搜索服务
cd ~/mcp-services
git clone https://github.com/Aas-ee/open-webSearch.git
cd open-webSearch
pip3 install -r requirements.txt

# 安装B站服务
cd ~/mcp-services
git clone https://github.com/xspadex/bilibili-mcp.git
cd bilibili-mcp
npm install
```

### 步骤3: 配置服务

编辑 `server/config.cjs`:

```javascript
module.exports = {
  mcpServers: {
    // 保留的服务
    weather: {
      enabled: true,
      autoLoad: true,
    },
    time: {
      enabled: true,
      autoLoad: true,
    },
    
    // 新增的国内服务
    'china-stock': {
      enabled: true,
      autoLoad: true,
      command: 'python3',
      args: ['/home/ubuntu/mcp-services/mcp-baostock-server/server.py'],
      description: '中国股票市场数据'
    },
    'web-search': {
      enabled: true,
      autoLoad: true,
      command: 'python3',
      args: ['/home/ubuntu/mcp-services/open-webSearch/server.py'],
      description: '多引擎网页搜索(含百度)'
    },
    'bilibili': {
      enabled: true,
      autoLoad: true,
      command: 'node',
      args: ['/home/ubuntu/mcp-services/bilibili-mcp/index.js'],
      description: 'B站热门视频'
    },
    
    // 移除的服务
    // dexscreener: { enabled: false },
    // playwright: { enabled: false },
  }
};
```

### 步骤4: 测试新服务

```bash
# 重启后端
cd Personal Chatbox
node server/index.cjs
```

### 步骤5: 验证功能

在前端对话中测试:
- "查询贵州茅台的股票价格"
- "搜索一下2025年人工智能发展趋势"
- "B站最近有什么热门视频?"

---

## 💡 额外建议

### 1. 网络优化

如果您经常需要访问国外服务,建议:
- 配置HTTP代理
- 使用国内镜像源
- 设置合理的超时时间

### 2. 服务监控

建议添加服务健康检查:
```javascript
// 在server/index.cjs中添加
setInterval(async () => {
  for (const [id, service] of Object.entries(services)) {
    try {
      await service.healthCheck();
    } catch (error) {
      console.error(`Service ${id} health check failed:`, error);
    }
  }
}, 60000); // 每分钟检查一次
```

### 3. 日志记录

增强日志记录以便排查问题:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 📚 参考资源

1. **awesome-mcp-servers**: https://github.com/punkpeye/awesome-mcp-servers
2. **MCP官方文档**: https://modelcontextprotocol.io
3. **Glama MCP目录**: https://glama.ai/mcp/servers
4. **MCP Reddit社区**: https://reddit.com/r/mcp

---

## 🎉 总结

通过使用这些适合国内网络环境的MCP服务,您可以:

1. ✅ **解决访问问题**: 所有服务都能快速响应
2. ✅ **提升用户体验**: 更快的响应速度
3. ✅ **丰富功能**: 添加更多国内平台支持
4. ✅ **降低成本**: 无需VPN或代理
5. ✅ **提高稳定性**: 减少网络超时和失败

**推荐优先实施方案B (全面升级)**,可以获得最佳的国内使用体验!

---

**最后更新**: 2025年10月12日  
**维护者**: Personal Chatbox Team

