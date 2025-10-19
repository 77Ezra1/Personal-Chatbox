# 🚀 启动指南索引

本目录包含 Personal Chatbox 的所有启动相关文档和脚本。

## 📚 文档列表

### 启动文档
- **[STARTUP_GUIDE.md](STARTUP_GUIDE.md)** - 完整的一键启动指南 ⭐⭐⭐⭐⭐
  - Windows/Mac/Linux 全平台支持
  - 自动化脚本使用说明
  - better-sqlite3 编译指南
  - 常见问题解决方案

- **[START_GUIDE.md](START_GUIDE.md)** - 快速启动指南
  - 基础启动步骤
  - 环境配置
  - 快速测试

## 🔧 启动脚本

### Windows 脚本 (PowerShell)
位于项目根目录:
- `start-all-auto.ps1` - 一键启动脚本 (自动编译 better-sqlite3)
- `stop-all-auto.ps1` - 一键停止脚本
- `start-all.ps1` - 基础启动脚本
- `stop-all.ps1` - 基础停止脚本
- `启动项目.bat` - 双击启动 (批处理)
- `停止服务.bat` - 双击停止 (批处理)

### Mac/Linux 脚本 (Bash)
位于项目根目录:
- `start-all-auto.sh` - 一键启动脚本 (自动编译 better-sqlite3)
- `stop-all-auto.sh` - 一键停止脚本
- `start-all.sh` - 基础启动脚本
- `start.sh` - 原始启动脚本
- `stop-services.sh` - 停止服务脚本

## 🎯 快速开始

### Windows 用户

**推荐方式 (一键启动):**
```powershell
.\start-all-auto.ps1
```

**或者双击运行:**
- 双击 `start-all-auto.ps1`
- 或双击 `启动项目.bat`

**停止服务:**
```powershell
.\stop-all-auto.ps1
```

### Mac/Linux 用户

**首次使用,添加执行权限:**
```bash
chmod +x start-all-auto.sh stop-all-auto.sh
```

**一键启动:**
```bash
./start-all-auto.sh
```

**停止服务:**
```bash
./stop-all-auto.sh
```

## 📖 详细文档

### STARTUP_GUIDE.md - 完整启动指南
涵盖内容:
- ✅ Windows/Mac/Linux 分平台说明
- ✅ 一键启动脚本使用方法
- ✅ better-sqlite3 编译详解
- ✅ 手动启动步骤
- ✅ 常见问题解决
  - 端口占用
  - PowerShell 执行策略
  - 权限错误
  - Node.js 版本问题
  - 编译工具安装
- ✅ 跨平台特性说明

### START_GUIDE.md - 快速启动指南
涵盖内容:
- ✅ 环境要求检查
- ✅ 快速启动命令
- ✅ 基础配置步骤
- ✅ 访问地址

## 🌟 脚本特性对比

| 功能 | start-all-auto | start-all | start.sh |
|-----|----------------|-----------|----------|
| **自动检测依赖** | ✅ | ❌ | ❌ |
| **自动编译 sqlite3** | ✅ | ❌ | ❌ |
| **端口冲突检查** | ✅ | ❌ | ❌ |
| **独立窗口启动** | ✅ (Win/Mac) | ✅ | ❌ |
| **后台运行** | ✅ (Linux) | ❌ | ✅ |
| **状态提示** | ✅ 彩色详细 | ✅ 基础 | ✅ 基础 |
| **适合新手** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 🔧 高级配置

### better-sqlite3 编译

**为什么需要编译?**
- better-sqlite3 是原生 Node.js 模块
- 需要针对你的操作系统和 Node.js 版本编译
- 一键启动脚本会自动处理

**手动编译:**
```bash
pnpm rebuild better-sqlite3
```

**编译失败解决:**

#### Windows
```powershell
npm install -g windows-build-tools
```

#### Mac
```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install build-essential python3
```

### 环境变量配置

在项目根目录创建 `.env` 文件:
```env
# API Keys
OPENAI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# 代理设置 (可选)
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

## 📊 服务地址

启动后访问:
- **前端**: <http://localhost:5173>
- **后端 API**: <http://localhost:3001>

## 🐛 故障排除

### 端口被占用

**Windows:**
```powershell
# 查找占用进程
Get-NetTCPConnection -LocalPort 3001 -State Listen
# 停止进程
Stop-Process -Id <PID> -Force
```

**Mac/Linux:**
```bash
# 查找占用进程
lsof -ti:3001
# 停止进程
kill -9 <PID>
```

### PowerShell 执行策略错误

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Mac/Linux 权限错误

```bash
chmod +x *.sh
```

## 💡 最佳实践

1. **首选一键启动脚本**
   - 自动化程度高
   - 错误提示清晰
   - 适合新手

2. **定期更新依赖**
   ```bash
   pnpm install
   ```

3. **检查 Node.js 版本**
   ```bash
   node --version  # 应该 >= 18.0.0
   ```

4. **遇到问题先查看日志**
   - Windows: 查看启动窗口输出
   - Linux: 查看 `logs/` 目录

## 🔗 相关文档

- [完整用户指南](../guides/MCP_COMPLETE_USER_GUIDE.md)
- [依赖安装指南](../setup/INSTALL_DEPENDENCIES.md)
- [后端架构文档](../reports/BACKEND_ARCHITECTURE.md)
- [项目主文档](../../README.md)

## 📞 获取帮助

如有问题:
- 查看 [FAQ](STARTUP_GUIDE.md#常见问题)
- 提交 [GitHub Issue](https://github.com/77Ezra1/Personal-Chatbox/issues)
- 查看 [完整文档索引](../INDEX.md)

---

**最后更新**: 2025-10-19  
**文档版本**: v1.0.0
