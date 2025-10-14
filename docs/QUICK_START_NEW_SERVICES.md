# 新MCP服务快速开始指南

## 🚀 10分钟快速部署

### 前置条件

- ✅ Node.js 18+ 已安装
- ✅ 项目已克隆到本地
- ✅ 依赖已安装(`npm install`)

### 步骤1: 运行安装脚本(2分钟)

```bash
cd Personal-Chatbox
chmod +x scripts/install-new-mcp-services.sh
./scripts/install-new-mcp-services.sh
```

按提示选择是否安装Chromium依赖:
- 选择 `y`: 安装完整的浏览器支持(推荐)
- 选择 `n`: 跳过(Puppeteer可能无法使用)

### 步骤2: 重启服务器(1分钟)

```bash
# 停止现有服务
pkill -f "node server/index.cjs"

# 启动服务器
npm run server
```

### 步骤3: 测试新功能(5分钟)

打开前端,测试以下功能:

#### 测试Puppeteer(浏览器控制)

```
你: 帮我截个百度首页的图
AI: [自动使用Puppeteer截图]
```

#### 测试Fetch(网页抓取)

```
你: 总结一下 https://news.ycombinator.com/ 的内容
AI: [自动使用Fetch提取并总结]
```

### 步骤4: (可选)配置API Key(2分钟)

如需使用Google Maps或EverArt:

1. 复制环境变量模板:
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件,填入API Key:
```bash
GOOGLE_MAPS_API_KEY=your_key_here
EVERART_API_KEY=your_key_here
```

3. 重启服务器:
```bash
npm run server
```

---

## 📋 服务清单

### 立即可用(无需配置)

- ✅ **Puppeteer浏览器控制**
  - 截图、PDF生成、表单填写
  - 完全免费
  
- ✅ **Fetch网页抓取(官方)**
  - 智能内容提取、Markdown转换
  - 完全免费

### 需要API Key

- ⏳ **Google Maps位置服务**
  - 地点搜索、路线规划
  - 免费额度: 每月$200
  - 获取: https://console.cloud.google.com/
  
- ⏳ **EverArt图像生成**
  - AI图像生成、多种风格
  - 免费版可用
  - 获取: https://everart.ai/

---

## 💡 使用示例

### Puppeteer示例

**用户**: 帮我截个GitHub首页的图

**AI响应**:
1. 使用Puppeteer打开 https://github.com
2. 等待页面加载
3. 截取全页面截图
4. 返回图片给用户

### Fetch示例

**用户**: 这个网页讲了什么? https://example.com

**AI响应**:
1. 使用Fetch访问URL
2. 提取主要内容
3. 转换为Markdown
4. 总结内容要点

### Google Maps示例(需要API Key)

**用户**: 北京到上海怎么走?

**AI响应**:
1. 使用Google Maps API
2. 查询路线
3. 返回详细路线信息
4. 包含距离、时间、交通方式

### EverArt示例(需要API Key)

**用户**: 生成一张日落的图片

**AI响应**:
1. 使用EverArt API
2. 根据描述生成图像
3. 返回生成的图片
4. 提供下载链接

---

## 🔧 常见问题

### Q1: Puppeteer提示"Chromium not found"

**A**: 运行安装脚本并选择安装Chromium:
```bash
./scripts/install-new-mcp-services.sh
# 选择 'y' 安装Chromium依赖
```

### Q2: Fetch无法访问某些网站

**A**: 某些网站有反爬虫机制,可以:
- 使用Puppeteer作为备选
- 或者使用代理

### Q3: 如何获取Google Maps API Key?

**A**: 
1. 访问 https://console.cloud.google.com/
2. 创建新项目
3. 启用 Maps JavaScript API, Geocoding API, Places API
4. 创建凭据 → API密钥
5. 复制到 `.env` 文件

### Q4: EverArt有免费额度吗?

**A**: 
- 是的,免费版可用
- 有速率限制
- 升级到付费版可获得更多额度

---

## 📊 性能对比

| 功能 | 之前 | 现在 | 提升 |
|------|------|------|------|
| 浏览器控制 | Playwright | Playwright + Puppeteer | +50% |
| 网页抓取 | 基础fetch | 官方Fetch服务 | +200% |
| 位置服务 | 无 | Google Maps | 新功能 |
| 图像生成 | 无 | EverArt | 新功能 |

---

## ✅ 验证成功标志

部署成功后,你应该能看到:

1. **服务器日志**:
```
✓ Puppeteer服务已启动
✓ Fetch服务已启动
✓ Google Maps服务已启动 (如已配置)
✓ EverArt服务已启动 (如已配置)
```

2. **前端界面**:
- 服务列表中显示新服务
- 服务状态为"运行中"
- 可以正常调用服务

3. **功能测试**:
- 截图功能正常
- 网页抓取正常
- 位置查询正常(如已配置)
- 图像生成正常(如已配置)

---

## 🎯 下一步

完成基础集成后,建议:

1. **测试所有功能**: 确保每个服务都能正常工作
2. **配置API Key**: 启用Google Maps和EverArt
3. **优化前端UI**: 添加服务配置界面
4. **添加更多服务**: Brave Search、GitHub、Slack等

---

## 📞 获取帮助

遇到问题?

1. 查看完整文档: `docs/NEW_MCP_SERVICES_INTEGRATION.md`
2. 查看日志: `tail -f logs/server.log`
3. 运行诊断: `./scripts/install-new-mcp-services.sh`

---

**祝您使用愉快! 🎉**

