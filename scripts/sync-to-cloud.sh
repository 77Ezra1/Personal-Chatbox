#!/bin/bash
# 自动备份并同步到云盘（macOS/Linux）

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 开始备份数据库...${NC}"

# 创建备份
npm run db:backup > /dev/null 2>&1

# 获取最新备份文件
LATEST_BACKUP=$(ls -t data/backups/app-*.db 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${YELLOW}❌ 没有找到备份文件${NC}"
    exit 1
fi

# 检测云盘路径
CLOUD_PATH=""

# 检查环境变量
if [ ! -z "$CHATBOX_CLOUD_BACKUP" ]; then
    CLOUD_PATH="$CHATBOX_CLOUD_BACKUP"
# 检查 iCloud Drive
elif [ -d "$HOME/Library/Mobile Documents/com~apple~CloudDocs" ]; then
    CLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"
# 检查 OneDrive
elif [ -d "$HOME/OneDrive" ]; then
    CLOUD_PATH="$HOME/OneDrive/ChatboxBackup"
# 检查 Google Drive
elif [ -d "$HOME/Google Drive" ]; then
    CLOUD_PATH="$HOME/Google Drive/ChatboxBackup"
# 检查 Dropbox
elif [ -d "$HOME/Dropbox" ]; then
    CLOUD_PATH="$HOME/Dropbox/ChatboxBackup"
else
    echo -e "${YELLOW}❌ 未检测到云盘，请设置环境变量 CHATBOX_CLOUD_BACKUP${NC}"
    echo ""
    echo "示例："
    echo "export CHATBOX_CLOUD_BACKUP=\"\$HOME/iCloud/ChatboxBackup\""
    exit 1
fi

# 创建云盘目录（如果不存在）
mkdir -p "$CLOUD_PATH"

# 复制到云盘
cp "$LATEST_BACKUP" "$CLOUD_PATH/chatbox-latest.db"

# 显示信息
FILE_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
BACKUP_NAME=$(basename "$LATEST_BACKUP")

echo ""
echo -e "${GREEN}✅ 备份成功同步到云盘${NC}"
echo ""
echo "📁 备份信息:"
echo "   文件: $BACKUP_NAME"
echo "   大小: $FILE_SIZE"
echo "   云盘路径: $CLOUD_PATH/chatbox-latest.db"
echo ""
echo -e "${BLUE}💡 在另一台电脑上运行: npm run sync:pull${NC}"
