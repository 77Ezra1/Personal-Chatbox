#!/bin/bash

# 核心功能自动化测试脚本
# Core Features Automated Test Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0
TOTAL=0

# 测试报告文件
REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).md"

# 打印函数
print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED++))
  ((TOTAL++))
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED++))
  ((TOTAL++))
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 初始化报告
init_report() {
  cat > "$REPORT_FILE" << EOF
# 核心功能测试报告 / Core Features Test Report

**测试时间 / Test Time:** $(date '+%Y-%m-%d %H:%M:%S')
**测试环境 / Test Environment:** $(uname -s) $(uname -r)

---

## 测试结果汇总 / Test Summary

EOF
}

# 追加到报告
append_to_report() {
  echo "$1" >> "$REPORT_FILE"
}

# 测试服务健康状态
test_service_health() {
  print_header "测试 1/10: 服务健康检查 / Service Health Check"

  # 测试后端
  if curl -s http://localhost:3001/health | grep -q "ok"; then
    print_success "后端服务运行正常 / Backend service OK"
    append_to_report "- ✅ 后端服务 / Backend: OK"
  else
    print_error "后端服务无响应 / Backend service not responding"
    append_to_report "- ❌ 后端服务 / Backend: Failed"
    return 1
  fi

  # 测试前端
  if curl -s http://localhost:5173 | grep -q "Personal Chatbox"; then
    print_success "前端服务运行正常 / Frontend service OK"
    append_to_report "- ✅ 前端服务 / Frontend: OK"
  else
    print_error "前端服务无响应 / Frontend service not responding"
    append_to_report "- ❌ 前端服务 / Frontend: Failed"
    return 1
  fi
}

# 测试用户登录
test_user_login() {
  print_header "测试 2/10: 用户登录 / User Login"

  # 登录测试
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123456"}')

  if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_success "登录成功 / Login successful"
    append_to_report "- ✅ 用户登录 / User Login: Success"

    # 提取 Token
    export TEST_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    print_info "Token已提取 / Token extracted"
    return 0
  else
    print_error "登录失败 / Login failed"
    append_to_report "- ❌ 用户登录 / User Login: Failed"
    echo "$LOGIN_RESPONSE"
    return 1
  fi
}

# 测试对话管理
test_conversations() {
  print_header "测试 3/10: 对话管理 / Conversation Management"

  if [ -z "$TEST_TOKEN" ]; then
    print_error "未找到测试Token，跳过测试 / No test token, skipping"
    append_to_report "- ⚠️  对话管理 / Conversations: Skipped (no token)"
    return 1
  fi

  # 获取对话列表
  CONV_RESPONSE=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3001/api/user-data/conversations)

  if echo "$CONV_RESPONSE" | grep -q '"conversations"'; then
    print_success "对话列表API正常 / Conversations API OK"
    append_to_report "- ✅ 对话管理 / Conversations: OK"

    # 显示对话数量
    CONV_COUNT=$(echo "$CONV_RESPONSE" | jq '.conversations | length' 2>/dev/null || echo "0")
    print_info "当前对话数量 / Conversation count: $CONV_COUNT"
    return 0
  else
    print_error "对话列表API失败 / Conversations API failed"
    append_to_report "- ❌ 对话管理 / Conversations: Failed"
    return 1
  fi
}

# 测试笔记功能
test_notes() {
  print_header "测试 4/10: 笔记功能 / Notes Feature"

  if [ -z "$TEST_TOKEN" ]; then
    print_error "未找到测试Token，跳过测试 / No test token, skipping"
    append_to_report "- ⚠️  笔记功能 / Notes: Skipped (no token)"
    return 1
  fi

  # 获取笔记列表
  NOTES_RESPONSE=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3001/api/notes)

  if echo "$NOTES_RESPONSE" | grep -q '"notes"'; then
    print_success "笔记API正常 / Notes API OK"
    append_to_report "- ✅ 笔记功能 / Notes: OK"

    # 显示笔记数量
    NOTES_COUNT=$(echo "$NOTES_RESPONSE" | jq '.notes | length' 2>/dev/null || echo "0")
    print_info "当前笔记数量 / Notes count: $NOTES_COUNT"
    return 0
  else
    print_error "笔记API失败 / Notes API failed"
    append_to_report "- ❌ 笔记功能 / Notes: Failed"
    return 1
  fi
}

# 测试文档管理
test_documents() {
  print_header "测试 5/10: 文档管理 / Document Management"

  if [ -z "$TEST_TOKEN" ]; then
    print_error "未找到测试Token，跳过测试 / No test token, skipping"
    append_to_report "- ⚠️  文档管理 / Documents: Skipped (no token)"
    return 1
  fi

  # 获取文档列表
  DOCS_RESPONSE=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3001/api/documents)

  if echo "$DOCS_RESPONSE" | grep -q '"documents"'; then
    print_success "文档API正常 / Documents API OK"
    append_to_report "- ✅ 文档管理 / Documents: OK"

    # 显示文档数量
    DOCS_COUNT=$(echo "$DOCS_RESPONSE" | jq '.documents | length' 2>/dev/null || echo "0")
    print_info "当前文档数量 / Documents count: $DOCS_COUNT"
    return 0
  else
    print_error "文档API失败 / Documents API failed"
    append_to_report "- ❌ 文档管理 / Documents: Failed"
    return 1
  fi
}

# 测试分析功能
test_analytics() {
  print_header "测试 6/10: 分析功能 / Analytics Feature"

  if [ -z "$TEST_TOKEN" ]; then
    print_error "未找到测试Token，跳过测试 / No test token, skipping"
    append_to_report "- ⚠️  分析功能 / Analytics: Skipped (no token)"
    return 1
  fi

  # 获取分析数据
  ANALYTICS_RESPONSE=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3001/api/analytics/stats)

  if echo "$ANALYTICS_RESPONSE" | grep -q -E '"conversationCount"|"messageCount"|"stats"'; then
    print_success "分析API正常 / Analytics API OK"
    append_to_report "- ✅ 分析功能 / Analytics: OK"
    return 0
  else
    print_error "分析API失败 / Analytics API failed"
    append_to_report "- ❌ 分析功能 / Analytics: Failed"
    return 1
  fi
}

# 测试MCP服务
test_mcp_services() {
  print_header "测试 7/10: MCP服务 / MCP Services"

  # 获取MCP服务列表
  MCP_RESPONSE=$(curl -s http://localhost:3001/api/mcp/services)

  if echo "$MCP_RESPONSE" | grep -q '"services"'; then
    print_success "MCP服务API正常 / MCP Services API OK"

    # 检查关键服务
    if echo "$MCP_RESPONSE" | grep -q '"memory"'; then
      print_success "Memory服务可用 / Memory service available"
    fi

    if echo "$MCP_RESPONSE" | grep -q '"wikipedia"'; then
      print_success "Wikipedia服务可用 / Wikipedia service available"
    fi

    append_to_report "- ✅ MCP服务 / MCP Services: OK"
    return 0
  else
    print_error "MCP服务API失败 / MCP Services API failed"
    append_to_report "- ❌ MCP服务 / MCP Services: Failed"
    return 1
  fi
}

# 测试MCP工具
test_mcp_tools() {
  print_header "测试 8/10: MCP工具 / MCP Tools"

  # 获取MCP工具列表
  TOOLS_RESPONSE=$(curl -s http://localhost:3001/api/mcp/tools)

  if echo "$TOOLS_RESPONSE" | grep -q '"tools"'; then
    print_success "MCP工具API正常 / MCP Tools API OK"

    # 显示工具数量
    TOOLS_COUNT=$(echo "$TOOLS_RESPONSE" | jq '.tools | length' 2>/dev/null || echo "unknown")
    print_info "可用工具数量 / Available tools: $TOOLS_COUNT"

    append_to_report "- ✅ MCP工具 / MCP Tools: OK ($TOOLS_COUNT tools)"
    return 0
  else
    print_error "MCP工具API失败 / MCP Tools API failed"
    append_to_report "- ❌ MCP工具 / MCP Tools: Failed"
    return 1
  fi
}

# 测试用户资料
test_user_profile() {
  print_header "测试 9/10: 用户资料 / User Profile"

  if [ -z "$TEST_TOKEN" ]; then
    print_error "未找到测试Token，跳过测试 / No test token, skipping"
    append_to_report "- ⚠️  用户资料 / User Profile: Skipped (no token)"
    return 1
  fi

  # 获取当前用户信息
  USER_RESPONSE=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" \
    http://localhost:3001/api/auth/me)

  if echo "$USER_RESPONSE" | grep -q '"email"'; then
    print_success "用户资料API正常 / User Profile API OK"

    # 显示用户邮箱
    USER_EMAIL=$(echo "$USER_RESPONSE" | jq -r '.email' 2>/dev/null || echo "unknown")
    print_info "当前用户 / Current user: $USER_EMAIL"

    append_to_report "- ✅ 用户资料 / User Profile: OK"
    return 0
  else
    print_error "用户资料API失败 / User Profile API failed"
    append_to_report "- ❌ 用户资料 / User Profile: Failed"
    return 1
  fi
}

# 测试配置API
test_config_api() {
  print_header "测试 10/10: 配置API / Config API"

  # 获取配置
  CONFIG_RESPONSE=$(curl -s http://localhost:3001/api/config/all)

  if echo "$CONFIG_RESPONSE" | grep -q '"config"'; then
    print_success "配置API正常 / Config API OK"
    append_to_report "- ✅ 配置API / Config API: OK"
    return 0
  else
    print_error "配置API失败 / Config API failed"
    append_to_report "- ❌ 配置API / Config API: Failed"
    return 1
  fi
}

# 生成最终报告
generate_final_report() {
  append_to_report "\n---\n"
  append_to_report "## 测试统计 / Test Statistics\n"
  append_to_report "- **总测试数 / Total Tests:** $TOTAL"
  append_to_report "- **通过 / Passed:** $PASSED"
  append_to_report "- **失败 / Failed:** $FAILED"

  if [ $FAILED -eq 0 ]; then
    append_to_report "- **成功率 / Success Rate:** 100% ✅"
  else
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    append_to_report "- **成功率 / Success Rate:** ${SUCCESS_RATE}%"
  fi

  append_to_report "\n---\n"
  append_to_report "## 建议 / Recommendations\n"

  if [ $FAILED -gt 0 ]; then
    append_to_report "\n### 需要修复的问题 / Issues to Fix\n"
    append_to_report "请查看上面标记为 ❌ 的测试项目并进行修复。\n"
    append_to_report "Please review the tests marked with ❌ above and fix them.\n"
  else
    append_to_report "\n所有测试通过！系统运行正常。\n"
    append_to_report "All tests passed! System is running smoothly.\n"
  fi
}

# 主测试流程
main() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     Personal Chatbox - 核心功能测试                   ║
║     Core Features Automated Test Suite               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}\n"

  init_report

  # 运行所有测试
  test_service_health || true
  test_user_login || true
  test_conversations || true
  test_notes || true
  test_documents || true
  test_analytics || true
  test_mcp_services || true
  test_mcp_tools || true
  test_user_profile || true
  test_config_api || true

  # 生成最终报告
  generate_final_report

  # 打印测试结果
  print_header "测试完成 / Test Completed"

  echo -e "总测试数 / Total Tests: ${BLUE}$TOTAL${NC}"
  echo -e "通过 / Passed: ${GREEN}$PASSED${NC}"
  echo -e "失败 / Failed: ${RED}$FAILED${NC}"

  if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！/ All tests passed!${NC}"
    echo -e "${GREEN}✨ 系统运行正常！/ System is healthy!${NC}\n"
  else
    echo -e "\n${YELLOW}⚠️  有 $FAILED 个测试失败 / $FAILED tests failed${NC}"
    echo -e "${YELLOW}📝 请查看测试报告获取详细信息 / Check test report for details${NC}\n"
  fi

  echo -e "📄 测试报告已保存到 / Test report saved to: ${BLUE}$REPORT_FILE${NC}\n"

  # 返回退出码
  if [ $FAILED -eq 0 ]; then
    exit 0
  else
    exit 1
  fi
}

# 运行主函数
main
