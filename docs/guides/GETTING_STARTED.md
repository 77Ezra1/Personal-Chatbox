# AI-Life-System 完整启动教程

## 📋 前置要求

在开始之前,请确保你的系统已安装:

- **Node.js**: 版本 18.0 或更高 ([下载地址](https://nodejs.org/))
- **npm**: 通常随Node.js一起安装
- **Git**: 用于克隆代码 ([下载地址](https://git-scm.com/))

### 检查安装

打开终端/命令提示符,运行以下命令检查:

```bash
node --version   # 应该显示 v18.x.x 或更高
npm --version    # 应该显示 9.x.x 或更高
git --version    # 应该显示 git version 2.x.x
```

## 🚀 快速开始

### 第一步: 克隆项目

```bash
# 克隆仓库
git clone https://github.com/77Ezra1/Personal Chatbox.git

# 进入项目目录
cd Personal Chatbox
```

### 第二步: 安装依赖

**重要**: 必须使用 `--legacy-peer-deps` 参数!

```bash
npm install --legacy-peer-deps
```

> ⚠️ **为什么需要 --legacy-peer-deps?**  
> 项目中的 `date-fns@4.1.0` 与 `react-day-picker@8.10.1` 有peer依赖冲突。  
> 使用此参数可以忽略冲突,不影响功能正常使用。

**预计时间**: 2-5分钟(取决于网络速度)

### 第三步: 启动后端服务

#### Windows用户

```bash
node server/index.cjs
```

#### Mac/Linux用户

```bash
# 方式1: 使用启动脚本(推荐)
chmod +x start-backend.sh
./start-backend.sh

# 方式2: 直接运行
node server/index.cjs
```

**成功标志**: 看到以下输出

```
[INFO] ✅ 服务器已启动: http://localhost:3001
[INFO] ✅ 已加载 6 个MCP服务
[INFO] ✅ 已启用服务: 天气服务, 时间服务
```

> 💡 **提示**: 保持这个终端窗口打开,后端需要持续运行

### 第四步: 启动前端服务

**打开新的终端窗口**,在项目目录下运行:

```bash
npm run dev
```

**成功标志**: 看到以下输出

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 第五步: 访问应用

在浏览器中打开: **http://localhost:5173**

🎉 恭喜!应用已成功启动!

## 🔧 配置MCP服务

### 默认启用的服务

应用启动后,以下服务已自动启用:

- ✅ **天气服务** - 查询全球天气
- ✅ **时间服务** - 时区转换

### 手动启用其他服务

1. 打开应用 (http://localhost:5173)
2. 点击右上角的 **设置图标** ⚙️
3. 找到 **MCP服务** 标签
4. 点击服务卡片上的开关按钮启用:
   - 🔍 **搜索服务** - DuckDuckGo网络搜索
   - 📹 **YouTube服务** - 视频字幕提取
   - 💰 **加密货币服务** - 实时价格查询
   - 🌐 **网页抓取服务** - HTML转Markdown

## 📝 测试服务

### 测试天气服务

在对话框中输入:

```
北京今天天气怎么样?
```

应该看到AI调用天气服务并返回实时天气信息。

### 测试搜索服务

1. 先在设置中启用搜索服务
2. 在对话框中输入:

```
帮我搜索一下2025年AI发展趋势
```

### 测试网页抓取服务

1. 先在设置中启用网页抓取服务
2. 在对话框中输入:

```
帮我抓取 https://example.com 的内容
```

## 🛠️ 常见问题

### Q1: npm install 失败怎么办?

**解决方案**:

```bash
# 清除缓存
npm cache clean --force

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json  # Mac/Linux
# 或
rmdir /s node_modules & del package-lock.json  # Windows

# 重新安装
npm install --legacy-peer-deps
```

### Q2: 后端启动失败,提示端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:

#### Windows
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 杀死进程(替换PID为实际进程ID)
taskkill /PID <PID> /F
```

#### Mac/Linux
```bash
# 查找并杀死占用端口的进程
lsof -ti:3001 | xargs kill -9
```

### Q3: 前端无法连接后端

**检查清单**:

1. 确认后端已启动: 访问 http://localhost:3001/health
2. 检查 `.env` 文件中的配置:
   ```
   VITE_MCP_API_URL=http://localhost:3001/api/mcp
   ```
3. 重启前端服务

### Q4: 搜索服务返回错误

**常见错误**: "DDG detected an anomaly in the request"

**原因**: DuckDuckGo检测到请求过快

**解决方案**: 等待几秒后再试,或者使用其他查询

### Q5: 加密货币服务无法使用

**错误**: "fetch failed" 或 "ENOTFOUND api.coincap.io"

**原因**: 网络限制或防火墙

**解决方案**: 
- 检查网络连接
- 尝试使用VPN
- 暂时禁用该服务

## 📂 项目结构

```
Personal Chatbox/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── hooks/              # React Hooks
│   │   └── useMcpManager.js  # MCP服务管理(已修改)
│   ├── lib/                # 工具库
│   │   └── mcpApiClient.js   # 后端API客户端(新增)
│   └── App.jsx             # 主应用
├── server/                 # 后端服务(新增)
│   ├── index.cjs           # 服务器入口
│   ├── config.cjs          # 配置文件
│   ├── routes/             # API路由
│   ├── services/           # MCP服务实现
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── .env                    # 环境变量(新增)
├── package.json            # 项目配置
├── start-backend.sh        # 后端启动脚本(新增)
└── README.md               # 项目说明
```

## 🔍 查看日志

### 后端日志

```bash
# 实时查看日志
tail -f server.log

# 查看最近的日志
tail -100 server.log
```

### 前端日志

打开浏览器的开发者工具:
- **Windows/Linux**: 按 `F12`
- **Mac**: 按 `Cmd + Option + I`

切换到 **Console** 标签查看日志

## 🛑 停止服务

### 停止前端

在运行前端的终端窗口中按 `Ctrl + C`

### 停止后端

#### 如果使用 start-backend.sh 启动

```bash
# 查看进程ID
cat server.pid

# 停止进程
kill $(cat server.pid)
```

#### 如果直接运行 node server/index.cjs

在运行后端的终端窗口中按 `Ctrl + C`

## 📚 进阶配置

### 修改后端端口

编辑 `server/config.cjs`:

```javascript
server: {
  port: 3001,  // 修改为其他端口,如 3002
  // ...
}
```

同时修改 `.env`:

```
VITE_MCP_API_URL=http://localhost:3002/api/mcp
```

### 修改前端端口

编辑 `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 5173,  // 修改为其他端口,如 3000
  },
  // ...
})
```

### 配置CORS

如果前后端部署在不同域名,编辑 `server/config.cjs`:

```javascript
server: {
  cors: {
    origin: 'https://your-frontend-domain.com',
    credentials: true
  }
}
```

## 🚀 生产部署

### 构建前端

```bash
npm run build
```

构建产物在 `dist/` 目录

### 部署后端

```bash
# 使用PM2(推荐)
npm install -g pm2
pm2 start server/index.cjs --name ai-life-backend

# 或使用nohup
nohup node server/index.cjs > server.log 2>&1 &
```

## 📞 获取帮助

如果遇到问题:

1. 查看 [MCP_SERVICES_GUIDE.md](./MCP_SERVICES_GUIDE.md) - 详细使用指南
2. 查看 [DELIVERY_REPORT.md](./DELIVERY_REPORT.md) - 交付报告
3. 查看后端日志: `cat server.log`
4. 查看浏览器控制台
5. 提交 GitHub Issue: https://github.com/77Ezra1/Personal Chatbox/issues

## ✅ 启动检查清单

- [ ] Node.js 已安装(v18+)
- [ ] 项目已克隆
- [ ] 依赖已安装(`npm install --legacy-peer-deps`)
- [ ] 后端已启动(http://localhost:3001)
- [ ] 前端已启动(http://localhost:5173)
- [ ] 浏览器可以访问应用
- [ ] 天气服务可以正常使用
- [ ] 其他服务可以手动启用

---

**祝你使用愉快!** 🎉

如有问题,欢迎反馈!

