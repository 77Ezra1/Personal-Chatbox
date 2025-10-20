#!/bin/bash

# 文档整理脚本
# 将根目录下的文档分类移动到 docs 对应子目录

echo "📚 开始整理项目文档..."

# 创建归档目录
mkdir -p docs/archive/2025-01
mkdir -p docs/reports/fixes
mkdir -p docs/reports/tests
mkdir -p docs/features/notes
mkdir -p docs/features/analytics
mkdir -p docs/features/ai-agent
mkdir -p docs/features/documents
mkdir -p docs/guides/api
mkdir -p docs/guides/i18n
mkdir -p docs/quickstart

# 计数器
MOVED=0
ARCHIVED=0

# ========== 笔记功能相关文档 ==========
echo "📝 整理笔记功能文档..."
for file in \
  NOTES_*.md \
  CREATE_CATEGORY_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/features/notes/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 分析功能相关文档 ==========
echo "📊 整理分析功能文档..."
for file in \
  ANALYTICS_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/features/analytics/
    MOVED=$((MOVED + 1))
  fi
done

# ========== AI Agent 相关文档 ==========
echo "🤖 整理 AI Agent 文档..."
for file in \
  AGENT_*.md \
  AI_AGENT_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/features/ai-agent/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 文档管理功能 ==========
echo "📄 整理文档管理功能文档..."
for file in \
  DOCUMENTS_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/features/documents/
    MOVED=$((MOVED + 1))
  fi
done

# ========== API 配置相关 ==========
echo "🔑 整理 API 配置文档..."
for file in \
  API_*.md \
  API*.md \
  正确的API*.md \
  配置API*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/guides/api/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 修复报告 ==========
echo "🔧 整理修复报告..."
for file in \
  *_FIX*.md \
  *FIX_*.md \
  CRITICAL_FIX_*.md \
  SEND_BUTTON_FIX.md \
  DATABASE_FIX_*.md \
  PASSWORD_VAULT_FIX_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/reports/fixes/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 测试报告 ==========
echo "✅整理测试报告..."
for file in \
  *TEST*.md \
  test-*.md \
  CORE_FEATURES_TEST_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/reports/tests/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 快速开始文档 ==========
echo "⚡ 整理快速开始文档..."
for file in \
  *QUICKSTART*.md \
  *QUICK_START*.md \
  QUICK_*.md \
  MCP_QUICK_START.md \
  TRANSLATION_QUICK_START.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/quickstart/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 国际化文档 ==========
echo "🌍 整理国际化文档..."
for file in \
  I18N_*.md \
  TRANSLATION_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/guides/i18n/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 优化和路线图 ==========
echo "🚀 整理优化和路线图文档..."
for file in \
  OPTIMIZATION_*.md \
  PROJECT_OPTIMIZATION_*.md \
  *ROADMAP*.md \
  NEXT_STEPS.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/reports/
    MOVED=$((MOVED + 1))
  fi
done

# ========== MCP 相关 ==========
echo "🔌 整理 MCP 文档..."
for file in \
  MCP_*.md \
  CHANGELOG_MCP.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/features/
    MOVED=$((MOVED + 1))
  fi
done

# ========== UI/UX 文档 ==========
echo "🎨 整理 UI/UX 文档..."
for file in \
  V0_*.md \
  *UI_*.md \
  GLOBAL_COLOR_*.md \
  CATEGORY_UI_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/ui/
    MOVED=$((MOVED + 1))
  fi
done

# ========== DEBUG 和问题诊断 ==========
echo "🐛 整理调试文档..."
for file in \
  *DEBUG*.md \
  CHAT_NO_RESPONSE_*.md \
  FRONTEND_ISSUES_*.md \
  FILTER_DEBUG_*.md \
  聊天功能问题*.md \
  发送消息无*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/reports/fixes/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 数据库相关 ==========
echo "🗄️ 整理数据库文档..."
for file in \
  SQLSERVER_*.md \
  MIGRATION_*.md \
  RETURNING_*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/database/
    MOVED=$((MOVED + 1))
  fi
done

# ========== 归档旧文档 ==========
echo "📦 归档过时文档..."
for file in \
  DOCUMENTATION_CLEANUP_*.md \
  DOCUMENTATION_REORGANIZATION_*.md \
  README_ANALYSIS.md \
  README_FIX_*.md \
  CODEBASE_ANALYSIS.md \
  DOCS_SUMMARY.md \
  IMPACT_ANALYSIS.md \
  CONVERSATION_DATA_*.md \
  文件系统使用*.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/archive/2025-01/
    ARCHIVED=$((ARCHIVED + 1))
  fi
done

# ========== 完成报告 ==========
for file in \
  *_COMPLETE*.md \
  INCREMENTAL_SAVE_FIX.md \
  DATA_SOURCE_TRACKING_*.md \
  FINAL_FIX_SUMMARY.md \
  RICH_TEXT_TOOLBAR_GUIDE.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/archive/2025-01/
    ARCHIVED=$((ARCHIVED + 1))
  fi
done

echo ""
echo "✅ 文档整理完成！"
echo "📊 统计信息："
echo "   - 移动文档: $MOVED 个"
echo "   - 归档文档: $ARCHIVED 个"
echo ""
echo "📁 文档结构："
echo "   docs/"
echo "   ├── features/        # 功能文档"
echo "   ├── guides/          # 使用指南"
echo "   ├── reports/         # 报告文档"
echo "   ├── quickstart/      # 快速开始"
echo "   ├── ui/              # UI/UX 文档"
echo "   ├── database/        # 数据库文档"
echo "   └── archive/         # 归档文档"
echo ""
