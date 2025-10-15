#!/bin/bash

# Personal Chatbox - 统一一键启动入口
# 用法：
#   ./start.sh              # 全量一键启动（推荐）
#   START_MODE=quick ./start.sh  # 仅快速启动（依赖环境已就绪）

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${START_MODE:-full}"

if [ "$MODE" = "quick" ]; then
	if [ -x "$SCRIPT_DIR/start-quick.sh" ]; then
		"$SCRIPT_DIR/start-quick.sh"
	else
		echo "start-quick.sh 不存在或不可执行，改用全量模式"
		chmod +x "$SCRIPT_DIR/start-full.sh" 2>/dev/null || true
		"$SCRIPT_DIR/start-full.sh"
	fi
else
	chmod +x "$SCRIPT_DIR/start-full.sh" 2>/dev/null || true
	"$SCRIPT_DIR/start-full.sh"
fi
