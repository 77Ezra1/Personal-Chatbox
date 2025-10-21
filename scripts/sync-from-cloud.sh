#!/bin/bash
# 从云盘恢复数据库（macOS/Linux）

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}☁️  从云盘获取备份...${NC}"

# 检测云盘路径
CLOUD_PATH=""

# 检查环境变量
if [ ! -z "$CHATBOX_CLOUD_BACKUP" ]; then
    CLOUD_PATH="$CHATBOX_CLOUD_BACKUP"
# 检查 iCloud Drive
elif [ -d "$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup" ]; then
    CLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"
# 检查 OneDrive
elif [ -d "$HOME/OneDrive/ChatboxBackup" ]; then
    CLOUD_PATH="$HOME/OneDrive/ChatboxBackup"
# 检查 Google Drive
elif [ -d "$HOME/Google Drive/ChatboxBackup" ]; then
    CLOUD_PATH="$HOME/Google Drive/ChatboxBackup"
# 检查 Dropbox
elif [ -d "$HOME/Dropbox/ChatboxBackup" ]; then
    CLOUD_PATH="$HOME/Dropbox/ChatboxBackup"
else
    echo -e "${YELLOW}❌ 未检测到云盘备份，请设置环境变量 CHATBOX_CLOUD_BACKUP${NC}"
    echo ""
    echo "示例："
    echo "export CHATBOX_CLOUD_BACKUP=\"\$HOME/iCloud/ChatboxBackup\""
    exit 1
fi

CLOUD_BACKUP="$CLOUD_PATH/chatbox-latest.db"

# 检查云盘备份是否存在
if [ ! -f "$CLOUD_BACKUP" ]; then
    echo -e "${YELLOW}❌ 云盘中没有找到备份文件${NC}"
    echo "   路径: $CLOUD_BACKUP"
    echo ""
    echo "请先在另一台电脑上运行: npm run sync:push"
    exit 1
fi

# 创建本地备份目录
mkdir -p data/backups

# 生成带时间戳的文件名
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
LOCAL_BACKUP="data/backups/app-$TIMESTAMP.db"

# 复制到本地
cp "$CLOUD_BACKUP" "$LOCAL_BACKUP"

# 显示云盘备份信息
FILE_SIZE=$(du -h "$CLOUD_BACKUP" | cut -f1)
FILE_DATE=$(date -r "$CLOUD_BACKUP" '+%Y/%m/%d %H:%M:%S' 2>/dev/null || stat -c %y "$CLOUD_BACKUP")

echo ""
echo -e "${GREEN}✅ 从云盘下载备份成功${NC}"
echo ""
echo "📁 云盘备份信息:"
echo "   修改时间: $FILE_DATE"
echo "   文件大小: $FILE_SIZE"
echo ""

# 恢复数据库
echo -e "${BLUE}🔄 正在恢复数据库...${NC}"
npm run db:restore $TIMESTAMP > /dev/null 2>&1

echo ""
echo -e "${GREEN}✅ 数据库恢复完成${NC}"
echo ""
echo -e "${BLUE}💡 现在可以启动服务器: npm run dev${NC}"
