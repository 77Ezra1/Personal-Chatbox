# 登录页面JSON解析错误修复

## 问题日期
2025-10-15

## 问题描述

### 用户报告
- 登录页面出现错误："Unexpected end of JSON input"
- 无法正常登录或注册
- 浏览器控制台显示500错误

### 错误信息
```
[LoginPage] [ERROR] [Auth] Email submit error:
SyntaxError: Unexpected end of JSON input
at handleEmailSubmit (LoginPage.jsx:91:35)

Failed to load resource:
the server responded with a status of 500 (Internal Server Error)
api/auth/check-email.js
```

## 根本原因

**后端服务器未重启，使用旧代码**

具体原因：
1. 之前对`server/routes/auth.cjs`和`server/db/adapter.cjs`做了修改
2. 修改后没有重启后端Node进程
3. 旧代码中的数据库适配器可能有兼容性问题
4. 导致`/api/auth/check-email`端点返回空响应或500错误
5. 前端尝试解析空响应为JSON时触发"Unexpected end of JSON input"错误

## 诊断过程

### 1. 检查错误日志
```bash
Get-Content backend.log -Tail 100
```
**结果**: 没有看到`check-email`的请求记录，说明后端可能没有运行最新代码

### 2. 测试API端点
```bash
curl -X POST http://localhost:3001/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**重启前**: 无响应或错误响应
**重启后**: `{"success":true,"exists":false}` ✅

## 解决方案

### 步骤1: 停止旧进程
```powershell
taskkill /F /IM node.exe
```

### 步骤2: 重启后端服务器
```powershell
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd 'D:\Personal-Chatbox'; node server/index.cjs > backend.log 2>&1" `
  -WindowStyle Minimized
```

### 步骤3: 重启前端服务器
```powershell
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd 'D:\Personal-Chatbox'; npm run dev" `
  -WindowStyle Minimized
```

### 步骤4: 验证API正常
```bash
curl -s http://localhost:3001/api/auth/check-email \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 预期输出
{"success":true,"exists":false}
```

## 验证结果

### API测试
```json
// 请求
POST /api/auth/check-email
{
  "email": "test@example.com"
}

// 响应 ✅
{
  "success": true,
  "exists": false
}
```

### 后端日志
```
[2025-10-15T11:24:50.643Z] [INFO] ✅ 服务器已启动: http://0.0.0.0:3001
[2025-10-15T11:24:50.643Z] [INFO] ✅ 已加载 11 个MCP服务
[2025-10-15T11:25:41.532Z] [INFO] POST /api/auth/check-email
```

## 预防措施

### 1. 自动重启脚本
创建`restart-all.ps1`：
```powershell
# 停止所有服务
taskkill /F /IM node.exe 2>$null

Write-Host "等待进程完全停止..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 启动后端
Write-Host "启动后端服务器..." -ForegroundColor Green
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$PSScriptRoot'; node server/index.cjs > backend.log 2>&1" `
  -WindowStyle Minimized

Start-Sleep -Seconds 3

# 启动前端
Write-Host "启动前端服务器..." -ForegroundColor Green
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$PSScriptRoot'; npm run dev" `
  -WindowStyle Minimized

Write-Host "所有服务已启动！" -ForegroundColor Cyan
```

### 2. 开发流程改进
1. **代码修改后必须重启**
   - 修改`server/`目录下任何文件后
   - 必须重启后端Node进程
   - 前端Vite有HMR，但后端Node没有

2. **使用nodemon监控后端**
   ```bash
   npm install -g nodemon
   nodemon server/index.cjs
   ```

3. **检查服务状态**
   ```bash
   # 检查进程
   Get-Process node

   # 检查端口
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   ```

## 类似问题排查清单

当遇到"Unexpected end of JSON input"错误时：

### ✅ 前端检查
- [ ] 检查API URL是否正确
- [ ] 检查请求头（Content-Type）
- [ ] 检查请求体格式
- [ ] 查看Network面板的响应内容

### ✅ 后端检查
- [ ] **重启后端服务器** ⭐ 最常见原因
- [ ] 检查后端日志
- [ ] 验证路由是否注册
- [ ] 测试API端点
- [ ] 检查数据库连接

### ✅ 环境检查
- [ ] Node进程是否运行
- [ ] 端口是否被占用
- [ ] 数据库文件是否存在
- [ ] 依赖包是否完整

## 总结

**问题**: 登录页面JSON解析错误
**原因**: 后端服务器未重启
**解决**: 重启后端和前端服务器
**预防**: 使用自动重启脚本或nodemon

**关键教训**:
1. 修改后端代码后必须重启Node进程
2. 前端错误可能源于后端问题
3. 使用工具自动化重启流程

## 参考链接

- [Node.js process management](https://nodejs.org/en/docs/)
- [Nodemon documentation](https://nodemon.io/)
- [PM2 process manager](https://pm2.keymetrics.io/)

