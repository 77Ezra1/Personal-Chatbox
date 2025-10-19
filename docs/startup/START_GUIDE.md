# Personal Chatbox - 启动指南

## 快速开始

### Linux/Mac

```bash
# 一键启动
./start.sh

# 停止服务
./stop.sh
```

### Windows

```cmd
# 一键启动
start.bat

# 停止服务
stop.bat
```

---

## 手动启动

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
# 或
pnpm install --legacy-peer-deps
```

### 2. 初始化数据库

```bash
node server/db/init.cjs
```

### 3. 创建邀请码(可选)

```bash
node scripts/manage-invite-codes.cjs add WELCOME2025 100 "欢迎使用"
```

### 4. 启动后端

```bash
npm run server
# 或在后台运行
nohup npm run server > logs/backend.log 2>&1 &
```

### 5. 启动前端

```bash
npm run dev
# 或在后台运行
nohup npm run dev > logs/frontend.log 2>&1 &
```

### 6. 访问应用

打开浏览器访问: http://localhost:5173

---

## 服务信息

- **前端地址**: http://localhost:5173
- **后端地址**: http://localhost:3001
- **默认邀请码**: WELCOME2025

---

## 日志查看

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

---

## 故障排查

### 端口被占用

**Linux/Mac**:
```bash
# 查看端口占用
lsof -i :3001
lsof -i :5173

# 停止进程
kill -9 <PID>
```

**Windows**:
```cmd
# 查看端口占用
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# 停止进程
taskkill /F /PID <PID>
```

### 依赖安装失败

```bash
# 清理后重新安装
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 数据库错误

```bash
# 重置数据库
bash scripts/reset-db.sh
```

---

## 环境要求

- Node.js 18+
- npm 或 pnpm
- 操作系统: Linux/Mac/Windows

---

## 更多信息

查看完整文档: `README.md`
