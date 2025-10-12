# 依赖安装指南

## Playwright 浏览器自动化服务

Playwright 服务需要额外的依赖包。由于项目中存在依赖冲突,需要使用特殊标志安装。

### 安装方法

**方法 1: 使用 --legacy-peer-deps (推荐)**

```bash
npm install playwright --legacy-peer-deps
```

**方法 2: 使用 --force**

```bash
npm install playwright --force
```

### 依赖冲突说明

项目中的 `react-day-picker` 需要 `date-fns@^2.28.0 || ^3.0.0`,这可能与 playwright 的某些依赖产生冲突。使用 `--legacy-peer-deps` 可以忽略这些 peer 依赖警告。

### 验证安装

安装完成后,启动后端服务:

```bash
node server/index.cjs
```

检查日志中是否有:
```
✅ 已启用服务: 天气服务, 时间服务, 多引擎搜索, Dexscreener加密货币, 网页内容抓取, Playwright浏览器自动化
```

### 如果仍然报错

如果安装后仍然报错 `Cannot find module 'playwright'`,请检查:

1. **确认安装成功**
   ```bash
   npm list playwright
   ```

2. **重新安装**
   ```bash
   npm uninstall playwright
   npm install playwright --legacy-peer-deps
   ```

3. **检查 node_modules**
   ```bash
   ls node_modules/playwright
   ```

### 替代方案: 只安装 Chromium

如果完整的 Playwright 包太大,可以只安装 Chromium 版本:

```bash
npm install playwright-chromium --legacy-peer-deps
```

然后修改 `server/services/playwright-browser.cjs` 中的导入:
```javascript
// 将
const { chromium } = require('playwright');

// 改为
const { chromium } = require('playwright-chromium');
```

## 其他服务依赖

### 搜索服务
- 已安装: `duck-duck-scrape`
- 无需额外操作

### 加密货币服务
- 使用 HTTP API,无需额外依赖

### 网页抓取服务
- 使用 `node-fetch`,已在 package.json 中

### 天气和时间服务
- 无外部依赖

## 完整安装流程

从零开始设置项目:

```bash
# 1. 克隆仓库
git clone https://github.com/77Ezra1/Personal Chatbox.git
cd Personal Chatbox

# 2. 安装基础依赖
npm install

# 3. 安装 Playwright (如需浏览器自动化)
npm install playwright --legacy-peer-deps

# 4. 配置环境变量
# 编辑 .env 文件,添加必要的配置

# 5. 启动后端
node server/index.cjs

# 6. 启动前端 (新终端)
npm run dev
```

## 故障排除

### 问题: npm install 失败

**解决:**
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题: Playwright 下载浏览器失败

**解决:**

1. 使用代理
   ```bash
   export HTTP_PROXY=http://127.0.0.1:7890
   export HTTPS_PROXY=http://127.0.0.1:7890
   npm install playwright --legacy-peer-deps
   ```

2. 或跳过浏览器下载
   ```bash
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright --legacy-peer-deps
   ```
   
   然后手动安装浏览器:
   ```bash
   npx playwright install chromium
   ```

### 问题: 后端启动报错

**检查:**
1. Node.js 版本 (推荐 v16+)
   ```bash
   node --version
   ```

2. 端口占用
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

3. 日志文件
   ```bash
   tail -f server.log
   ```

## 性能优化建议

### Playwright 浏览器缓存

Playwright 会下载完整的浏览器(约 300MB),建议:

1. 只在需要时安装
2. 使用 playwright-chromium 替代完整版
3. 配置浏览器缓存位置

### 搜索服务优化

DuckDuckGo 有频率限制,建议:

1. 使用合理的请求间隔
2. 实现结果缓存
3. 考虑付费搜索 API

---

**更新时间:** 2025-10-12

