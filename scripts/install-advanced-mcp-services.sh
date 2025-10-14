#!/bin/bash

###############################################################################
# Personal Chatbox - 高级MCP服务安装脚本
# 
# 此脚本用于安装和配置以下高级MCP服务:
# 1. Magg - 元MCP服务器(AI自主管理工具)
# 2. Slack - 消息通知服务
# 3. Qdrant - 向量数据库(RAG)
# 4. PostgreSQL - 生产级数据库
#
# 使用方法:
#   chmod +x scripts/install-advanced-mcp-services.sh
#   ./scripts/install-advanced-mcp-services.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

###############################################################################
# 1. 环境检查
###############################################################################

print_header "步骤 1/6: 环境检查"

# 检查Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js已安装: $NODE_VERSION"
else
    print_error "Node.js未安装,请先安装Node.js 18+"
    exit 1
fi

# 检查npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm已安装: $NPM_VERSION"
else
    print_error "npm未安装"
    exit 1
fi

# 检查Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python已安装: $PYTHON_VERSION"
    
    # 检查Python版本是否>=3.12(Magg需要)
    PYTHON_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
    if [ "$PYTHON_MINOR" -lt 12 ]; then
        print_warning "Magg需要Python 3.12+,当前版本可能不支持"
        print_info "您可以稍后手动安装Magg"
    fi
else
    print_warning "Python未安装,Magg服务将无法使用"
fi

# 检查Docker(可选)
if command_exists docker; then
    print_success "Docker已安装(可用于Qdrant和PostgreSQL)"
else
    print_warning "Docker未安装,建议安装以便使用Qdrant和PostgreSQL"
    print_info "安装命令: curl -fsSL https://get.docker.com | sh"
fi

###############################################################################
# 2. 安装Magg元服务器
###############################################################################

print_header "步骤 2/6: 安装Magg元服务器"

if command_exists python3 && [ "$PYTHON_MINOR" -ge 12 ]; then
    print_info "开始安装Magg..."
    
    # 检查uv是否已安装
    if ! command_exists uv; then
        print_info "安装uv包管理器..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # 添加uv到PATH
        export PATH="$HOME/.cargo/bin:$PATH"
        
        # 重新检查
        if command_exists uv; then
            print_success "uv安装成功"
        else
            print_warning "uv安装可能需要重新登录shell才能生效"
            print_info "请运行: source ~/.bashrc 或 source ~/.zshrc"
        fi
    else
        print_success "uv已安装"
    fi
    
    # 安装Magg
    if command_exists uv; then
        print_info "使用uv安装Magg..."
        uv tool install magg || print_warning "Magg安装失败,请稍后手动安装"
        
        if uv tool list | grep -q magg; then
            print_success "Magg安装成功"
            
            # 创建Magg配置目录
            mkdir -p .magg
            print_success "创建Magg配置目录: .magg/"
        fi
    fi
else
    print_warning "跳过Magg安装(需要Python 3.12+)"
    print_info "如需使用Magg,请升级Python后运行:"
    print_info "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    print_info "  uv tool install magg"
fi

###############################################################################
# 3. 配置Slack服务
###############################################################################

print_header "步骤 3/6: 配置Slack服务"

print_info "Slack服务需要以下步骤:"
echo "1. 访问 https://api.slack.com/apps"
echo "2. 创建新的Slack App"
echo "3. 添加Bot Token Scopes: channels:read, chat:write, files:write"
echo "4. 安装App到工作区"
echo "5. 复制Bot User OAuth Token(以xoxb-开头)"
echo ""

read -p "是否已获取Slack Bot Token? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "请输入Slack Bot Token: " SLACK_BOT_TOKEN
    
    # 保存到.env文件
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || touch .env
    fi
    
    # 更新或添加SLACK_BOT_TOKEN
    if grep -q "SLACK_BOT_TOKEN=" .env; then
        sed -i "s|SLACK_BOT_TOKEN=.*|SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN|" .env
    else
        echo "SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN" >> .env
    fi
    
    print_success "Slack Bot Token已保存到.env文件"
else
    print_warning "跳过Slack配置,稍后可在.env文件中配置"
fi

###############################################################################
# 4. 安装Qdrant向量数据库
###############################################################################

print_header "步骤 4/6: 安装Qdrant向量数据库"

if command_exists docker; then
    read -p "是否使用Docker安装Qdrant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "启动Qdrant Docker容器..."
        
        # 检查是否已有Qdrant容器
        if docker ps -a | grep -q qdrant; then
            print_warning "Qdrant容器已存在"
            read -p "是否重启? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker restart qdrant
                print_success "Qdrant容器已重启"
            fi
        else
            # 启动新容器
            docker run -d \
                --name qdrant \
                -p 6333:6333 \
                -p 6334:6334 \
                -v $(pwd)/data/qdrant:/qdrant/storage \
                qdrant/qdrant
            
            print_success "Qdrant已启动在 http://localhost:6333"
        fi
        
        # 保存配置到.env
        if [ ! -f .env ]; then
            cp .env.example .env 2>/dev/null || touch .env
        fi
        
        if ! grep -q "QDRANT_URL=" .env; then
            echo "QDRANT_URL=http://localhost:6333" >> .env
            print_success "Qdrant配置已保存到.env文件"
        fi
    else
        print_info "跳过Qdrant安装"
        print_info "手动安装命令: docker run -d -p 6333:6333 qdrant/qdrant"
    fi
else
    print_warning "Docker未安装,无法自动安装Qdrant"
    print_info "请先安装Docker或使用Qdrant Cloud服务"
fi

###############################################################################
# 5. 安装PostgreSQL数据库
###############################################################################

print_header "步骤 5/6: 安装PostgreSQL数据库"

if command_exists docker; then
    read -p "是否使用Docker安装PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 设置默认密码
        read -p "请输入PostgreSQL密码(默认: chatbox123): " PG_PASSWORD
        PG_PASSWORD=${PG_PASSWORD:-chatbox123}
        
        print_info "启动PostgreSQL Docker容器..."
        
        # 检查是否已有PostgreSQL容器
        if docker ps -a | grep -q postgres-chatbox; then
            print_warning "PostgreSQL容器已存在"
            read -p "是否重启? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker restart postgres-chatbox
                print_success "PostgreSQL容器已重启"
            fi
        else
            # 启动新容器
            docker run -d \
                --name postgres-chatbox \
                -e POSTGRES_PASSWORD=$PG_PASSWORD \
                -e POSTGRES_DB=chatbox \
                -p 5432:5432 \
                -v $(pwd)/data/postgres:/var/lib/postgresql/data \
                postgres:16-alpine
            
            print_success "PostgreSQL已启动在 localhost:5432"
            print_info "数据库名: chatbox"
            print_info "用户名: postgres"
            print_info "密码: $PG_PASSWORD"
        fi
        
        # 保存连接字符串到.env
        if [ ! -f .env ]; then
            cp .env.example .env 2>/dev/null || touch .env
        fi
        
        CONN_STRING="postgresql://postgres:$PG_PASSWORD@localhost:5432/chatbox"
        if grep -q "POSTGRES_CONNECTION_STRING=" .env; then
            sed -i "s|POSTGRES_CONNECTION_STRING=.*|POSTGRES_CONNECTION_STRING=$CONN_STRING|" .env
        else
            echo "POSTGRES_CONNECTION_STRING=$CONN_STRING" >> .env
        fi
        
        print_success "PostgreSQL配置已保存到.env文件"
    else
        print_info "跳过PostgreSQL安装"
    fi
else
    print_warning "Docker未安装,无法自动安装PostgreSQL"
    print_info "请先安装Docker或手动安装PostgreSQL"
fi

###############################################################################
# 6. 测试服务
###############################################################################

print_header "步骤 6/6: 测试服务"

print_info "测试MCP服务包是否可用..."

# 测试Puppeteer
if npx -y @modelcontextprotocol/server-puppeteer --help >/dev/null 2>&1; then
    print_success "Puppeteer MCP服务可用"
else
    print_warning "Puppeteer MCP服务测试失败"
fi

# 测试Fetch
if npx -y @modelcontextprotocol/server-fetch --help >/dev/null 2>&1; then
    print_success "Fetch MCP服务可用"
else
    print_warning "Fetch MCP服务测试失败"
fi

# 测试Slack(如果配置了)
if [ -n "$SLACK_BOT_TOKEN" ]; then
    print_info "Slack MCP服务已配置,需要启动服务器后测试"
fi

# 测试Qdrant连接
if command_exists curl && docker ps | grep -q qdrant; then
    if curl -s http://localhost:6333/collections >/dev/null 2>&1; then
        print_success "Qdrant服务连接成功"
    else
        print_warning "Qdrant服务连接失败"
    fi
fi

# 测试PostgreSQL连接
if command_exists docker && docker ps | grep -q postgres-chatbox; then
    if docker exec postgres-chatbox pg_isready >/dev/null 2>&1; then
        print_success "PostgreSQL服务连接成功"
    else
        print_warning "PostgreSQL服务连接失败"
    fi
fi

###############################################################################
# 完成
###############################################################################

print_header "安装完成!"

echo -e "${GREEN}已成功配置以下服务:${NC}"
echo ""

if command_exists uv && uv tool list | grep -q magg; then
    echo "✓ Magg元服务器 - AI自主管理MCP工具"
fi

if [ -n "$SLACK_BOT_TOKEN" ]; then
    echo "✓ Slack消息服务 - 团队协作通知"
fi

if docker ps | grep -q qdrant; then
    echo "✓ Qdrant向量数据库 - RAG应用支持"
fi

if docker ps | grep -q postgres-chatbox; then
    echo "✓ PostgreSQL数据库 - 生产级数据存储"
fi

echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "1. 查看配置文件: cat .env"
echo "2. 启动后端服务: npm run server"
echo "3. 启动前端服务: npm run dev"
echo "4. 在应用中启用新服务"
echo ""
echo -e "${YELLOW}文档位置:${NC}"
echo "- 完整文档: docs/ADVANCED_MCP_INTEGRATION.md"
echo "- 快速开始: docs/QUICK_START_ADVANCED_SERVICES.md"
echo "- API密钥配置: .env.example"
echo ""
echo -e "${GREEN}祝您使用愉快!${NC}"

