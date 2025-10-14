#!/bin/bash

# Personal Chatbox - 新MCP服务安装脚本
# 用于安装Puppeteer、Fetch、Google Maps、EverArt四个服务

set -e  # 遇到错误立即退出

echo "=========================================="
echo "Personal Chatbox - MCP服务安装"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js环境
echo -e "${YELLOW}[1/5] 检查Node.js环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js${NC}"
    echo "请先安装Node.js 18+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: Node.js版本过低 (当前: $(node --version), 需要: 18+)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js版本: $(node --version)${NC}"
echo -e "${GREEN}✓ npm版本: $(npm --version)${NC}"
echo ""

# 测试MCP服务可用性
echo -e "${YELLOW}[2/5] 测试MCP服务可用性...${NC}"

# 1. Puppeteer
echo "测试 Puppeteer..."
if npx -y @modelcontextprotocol/server-puppeteer --help &> /dev/null; then
    echo -e "${GREEN}✓ Puppeteer 可用${NC}"
else
    echo -e "${RED}✗ Puppeteer 不可用${NC}"
fi

# 2. Fetch
echo "测试 Fetch..."
if npx -y @modelcontextprotocol/server-fetch --help &> /dev/null; then
    echo -e "${GREEN}✓ Fetch 可用${NC}"
else
    echo -e "${RED}✗ Fetch 不可用${NC}"
fi

# 3. Google Maps (需要API Key,只测试包是否存在)
echo "测试 Google Maps..."
if npx -y @modelcontextprotocol/server-google-maps --help &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Google Maps 可用${NC}"
else
    echo -e "${YELLOW}! Google Maps 包可能需要API Key才能测试${NC}"
fi

# 4. EverArt (需要API Key,只测试包是否存在)
echo "测试 EverArt..."
if npx -y @modelcontextprotocol/server-everart --help &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ EverArt 可用${NC}"
else
    echo -e "${YELLOW}! EverArt 包可能需要API Key才能测试${NC}"
fi

echo ""

# 检查配置文件
echo -e "${YELLOW}[3/5] 检查配置文件...${NC}"
CONFIG_FILE="./server/config.cjs"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}错误: 配置文件不存在: $CONFIG_FILE${NC}"
    exit 1
fi

# 检查配置中是否包含新服务
if grep -q "puppeteer:" "$CONFIG_FILE" && \
   grep -q "fetch_official:" "$CONFIG_FILE" && \
   grep -q "google_maps:" "$CONFIG_FILE" && \
   grep -q "everart:" "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ 配置文件包含所有新服务${NC}"
else
    echo -e "${RED}错误: 配置文件缺少某些服务定义${NC}"
    exit 1
fi

echo ""

# 安装Puppeteer依赖(可选,用于本地运行)
echo -e "${YELLOW}[4/5] 安装Puppeteer浏览器依赖...${NC}"
echo "Puppeteer需要Chromium浏览器,是否安装? (y/n)"
read -r INSTALL_CHROMIUM

if [ "$INSTALL_CHROMIUM" = "y" ] || [ "$INSTALL_CHROMIUM" = "Y" ]; then
    echo "安装Chromium依赖..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y \
            chromium-browser \
            libx11-xcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxi6 \
            libxtst6 \
            libnss3 \
            libcups2 \
            libxss1 \
            libxrandr2 \
            libasound2 \
            libpangocairo-1.0-0 \
            libatk1.0-0 \
            libatk-bridge2.0-0 \
            libgtk-3-0
        echo -e "${GREEN}✓ Chromium依赖已安装${NC}"
    else
        echo -e "${YELLOW}! 无法检测到apt-get,请手动安装Chromium${NC}"
    fi
else
    echo "跳过Chromium安装"
fi

echo ""

# 创建API Key配置提示
echo -e "${YELLOW}[5/5] API Key配置说明${NC}"
echo ""
echo "以下服务需要API Key才能使用:"
echo ""
echo "1. Google Maps API Key"
echo "   - 访问: https://console.cloud.google.com/"
echo "   - 启用: Maps JavaScript API, Geocoding API, Places API"
echo "   - 免费额度: 每月$200"
echo "   - 配置位置: server/config.cjs -> google_maps.env.GOOGLE_MAPS_API_KEY"
echo ""
echo "2. EverArt API Key"
echo "   - 访问: https://everart.ai/"
echo "   - 注册免费账户"
echo "   - 配置位置: server/config.cjs -> everart.env.EVERART_API_KEY"
echo ""
echo "注意: Puppeteer和Fetch无需API Key,可直接使用!"
echo ""

# 完成
echo "=========================================="
echo -e "${GREEN}安装完成!${NC}"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 如需使用Google Maps,请配置API Key"
echo "2. 如需使用EverArt,请配置API Key"
echo "3. 重启服务器: npm run server"
echo "4. 测试新功能"
echo ""
echo "已启用的服务:"
echo "  ✓ Puppeteer浏览器控制"
echo "  ✓ Fetch网页抓取(官方)"
echo "  ○ Google Maps位置服务 (需要API Key)"
echo "  ○ EverArt图像生成 (需要API Key)"
echo ""

