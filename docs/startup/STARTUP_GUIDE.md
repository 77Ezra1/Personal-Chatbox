# 🚀 Personal Chatbox 一键启动指南

## 快速开始

### Windows 系统

#### 方法 1: 一键启动 (推荐)

双击运行 `start-all-auto.ps1` 或在 PowerShell 中执行:

```powershell
.\start-all-auto.ps1
```

#### 一键停止

双击运行 `stop-all-auto.ps1` 或在 PowerShell 中执行:

```powershell
.\stop-all-auto.ps1
```

### Mac/Linux 系统

#### 方法 1: 一键启动 (推荐)

在终端中执行:

```bash
./start-all-auto.sh
```

**首次使用需要添加执行权限:**

```bash
chmod +x start-all-auto.sh stop-all-auto.sh
```

#### 一键停止

在终端中执行:

```bash
./stop-all-auto.sh
```

### 脚本功能

这些脚本会自动:
- ✅ 检查 Node.js 和 pnpm
- ✅ 检查并编译 better-sqlite3 (如果需要)
- ✅ 检查端口占用并清理
- ✅ 启动后端服务 (http://localhost:3001)
- ✅ 启动前端服务 (http://localhost:5173)

### 方法 2: 手动启动

#### 后端服务
```powershell
node server/index.cjs
```

#### 前端服务
```powershell
pnpm dev
```

## 停止服务

### 一键停止

双击运行 `stop-all-auto.ps1` 或在 PowerShell 中执行:

```powershell
.\stop-all-auto.ps1
```

这会自动停止所有相关进程并释放端口。

### 手动停止

在各自的终端窗口中按 `Ctrl + C`

## better-sqlite3 编译说明

### 为什么需要编译?

`better-sqlite3` 是一个原生 Node.js 模块,需要针对你的操作系统和 Node.js 版本进行编译。

### 自动编译

使用 `start-all-auto.ps1` 会自动检测并编译 better-sqlite3:
- 首次运行会自动编译
- 后续运行会检测是否需要重新编译
- 编译失败会自动降级到 JSON fallback

### 手动编译

如果需要手动编译:

```bash
# 重新编译 better-sqlite3
pnpm rebuild better-sqlite3

# 或者完全重新安装
pnpm install
```

### 编译失败?

如果编译失败,应用会自动使用 JSON fallback 模式,功能完全正常,只是性能稍低。

要解决编译问题:

1. **安装构建工具** (Windows):
   ```powershell
   npm install -g windows-build-tools
   ```

2. **或者安装 Visual Studio Build Tools**:
   - 下载: https://visualstudio.microsoft.com/downloads/
   - 选择 "Desktop development with C++" 工作负载

3. **重新编译**:
   ```powershell
   pnpm rebuild better-sqlite3
   ```

## 常见问题

### 端口被占用

#### Windows 系统

运行 `stop-all-auto.ps1` 停止所有服务,或手动停止占用端口的进程:

```powershell
# 查找占用端口的进程
Get-NetTCPConnection -LocalPort 3001 -State Listen
Get-NetTCPConnection -LocalPort 5173 -State Listen

# 停止进程 (替换 PID)
Stop-Process -Id <PID> -Force
### Windows: PowerShell 执行策略错误

如果出现 "无法加载文件,因为在此系统上禁止运行脚本" 错误:

```powershell
# 临时允许运行脚本 (仅当前会话)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 或者永久设置 (需要管理员权限)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Mac/Linux: 权限错误

如果出现 "Permission denied" 错误:

```bash
# 添加执行权限
chmod +x start-all-auto.sh stop-all-auto.sh
```
# 停止进程 (替换 PID)
kill -9 <PID>
```

### PowerShell 执行策略错误

如果出现 "无法加载文件,因为在此系统上禁止运行脚本" 错误:

```powershell
# 临时允许运行脚本 (仅当前会话)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 或者永久设置 (需要管理员权限)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Node.js 版本问题

确保使用 Node.js 18+ 版本:

```powershell
node --version  # 应该显示 v18.x.x 或更高
```

## 服务地址

- **前端**: <http://localhost:5173>
- **后端 API**: <http://localhost:3001>

## 项目结构

```text
Personal-Chatbox/
├── start-all-auto.ps1    # Windows 一键启动脚本
├── stop-all-auto.ps1     # Windows 一键停止脚本
├── start-all-auto.sh     # Mac/Linux 一键启动脚本
├── stop-all-auto.sh      # Mac/Linux 一键停止脚本
├── server/               # 后端代码
│   └── index.cjs         # 后端入口
├── src/                  # 前端代码
├── data/                 # 数据存储
└── logs/                 # 日志文件 (Mac/Linux)
```

## 开发提示

- 前端代码修改会自动热重载
- 后端代码修改需要重启后端服务
- 数据库文件位于 `data/app.db`

## 获取帮助

如有问题,请查看:
- GitHub Issues: https://github.com/77Ezra1/Personal-Chatbox/issues
- 项目文档: 查看 `docs/` 目录

---

**享受你的 Personal Chatbox 之旅! 🎉**
