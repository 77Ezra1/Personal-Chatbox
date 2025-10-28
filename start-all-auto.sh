#!/bin/bash
# ====================================
# Personal Chatbox 一键启动脚本 (Mac/Linux)
# 自动处理依赖编译和服务启动
# ====================================

# 颜色定义
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Personal Chatbox 一键启动${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# 设置错误处理
set +e

# 1. 检查 Node.js
echo -e "${YELLOW}[1/5] 检查 Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}  ✅ Node.js 版本: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}  ❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
    echo -e "${YELLOW}  💡 安装方法: brew install node${NC}"
    exit 1
fi

# 2. 检查 pnpm
echo -e "${YELLOW}[2/5] 检查 pnpm...${NC}"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}  ✅ pnpm 版本: ${PNPM_VERSION}${NC}"
else
    echo -e "${RED}  ❌ 错误: 未找到 pnpm，正在安装...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}  ✅ pnpm 安装完成${NC}"
fi

# 3. 检查并编译 better-sqlite3
echo -e "${YELLOW}[3/5] 检查 better-sqlite3...${NC}"

# 测试 better-sqlite3 是否可用
SQLITE_TEST=$(node -e "try { require('better-sqlite3'); console.log('OK'); } catch(e) { console.log('FAIL'); }" 2>/dev/null)

if [ "$SQLITE_TEST" != "OK" ]; then
    echo -e "${YELLOW}  ⚠️  better-sqlite3 需要编译...${NC}"
    echo -e "${CYAN}  🔨 正在编译 better-sqlite3 (这可能需要几分钟)...${NC}"
    
    # 先安装依赖
    pnpm install
    
    # 重新编译 better-sqlite3
    pnpm rebuild better-sqlite3
    
    # 再次测试
    SQLITE_TEST_AFTER=$(node -e "try { require('better-sqlite3'); console.log('OK'); } catch(e) { console.log('FAIL'); }" 2>/dev/null)
    
    if [ "$SQLITE_TEST_AFTER" = "OK" ]; then
        echo -e "${GREEN}  ✅ better-sqlite3 编译成功!${NC}"
    else
        echo -e "${YELLOW}  ⚠️  better-sqlite3 编译失败，将使用 JSON fallback${NC}"
    fi
else
    echo -e "${GREEN}  ✅ better-sqlite3 已就绪${NC}"
fi

# 4. 检查端口占用
echo -e "${YELLOW}[4/5] 检查端口占用...${NC}"

# 检查 3001 端口
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$PORT_3001_PID" ]; then
    echo -e "${YELLOW}  ⚠️  端口 3001 已被占用，正在尝试关闭...${NC}"
    kill -9 $PORT_3001_PID 2>/dev/null
    sleep 1
fi

# 检查 5173 端口
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null)
if [ -n "$PORT_5173_PID" ]; then
    echo -e "${YELLOW}  ⚠️  端口 5173 已被占用，正在尝试关闭...${NC}"
    kill -9 $PORT_5173_PID 2>/dev/null
    sleep 1
fi

echo -e "${GREEN}  ✅ 端口检查完成${NC}"

# 5. 启动服务
echo -e "${YELLOW}[5/5] 启动服务...${NC}"
echo ""

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo -e "${CYAN}  🚀 启动后端服务 (http://localhost:3001)...${NC}"
if command -v osascript &> /dev/null; then
    # macOS - 使用 osascript 打开新终端窗口
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && node server/index.cjs"'
else
    # Linux - 后台运行并记录日志
    nohup node server/index.cjs > logs/backend.log 2>&1 &
    echo $! > logs/backend.pid
    echo -e "${GRAY}  后端进程 PID: $(cat logs/backend.pid)${NC}"
fi
sleep 3

# 启动前端服务
echo -e "${CYAN}  🚀 启动前端服务 (http://localhost:5173)...${NC}"
if command -v osascript &> /dev/null; then
    # macOS - 使用 osascript 打开新终端窗口
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && pnpm dev"'
else
    # Linux - 后台运行并记录日志
    nohup pnpm dev > logs/frontend.log 2>&1 &
    echo $! > logs/frontend.pid
    echo -e "${GRAY}  前端进程 PID: $(cat logs/frontend.pid)${NC}"
fi
sleep 3

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ 所有服务启动成功!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${CYAN}📍 前端地址: http://localhost:5173${NC}"
echo -e "${CYAN}📍 后端地址: http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
if command -v osascript &> /dev/null; then
    echo -e "${WHITE}  - macOS: 前端和后端已在独立终端窗口中运行${NC}"
    echo -e "${WHITE}  - 关闭这些窗口即可停止服务${NC}"
else
    echo -e "${WHITE}  - Linux: 服务已在后台运行${NC}"
    echo -e "${WHITE}  - 日志文件: logs/backend.log, logs/frontend.log${NC}"
fi
echo -e "${WHITE}  - 运行 ./stop-all-auto.sh 停止所有服务${NC}"
echo ""

# 如果是 Linux，提示查看日志
if ! command -v osascript &> /dev/null; then
    echo -e "${GRAY}查看实时日志:${NC}"
    echo -e "${GRAY}  后端: tail -f logs/backend.log${NC}"
    echo -e "${GRAY}  前端: tail -f logs/frontend.log${NC}"
    echo ""
fi

echo -e "${GRAY}按 Enter 键退出...${NC}"
read
