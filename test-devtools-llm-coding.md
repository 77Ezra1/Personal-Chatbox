# 开发者验证：大模型编程能力工具链

## 目标
验证新增工具：`code_editor`, `command_runner`, `linter_formatter`, `test_runner` 在对话链路中的可用性。

## 前置

```bash
pnpm install
pnpm run server  # 终端A
pnpm dev         # 终端B
```

## 步骤

1) 获取工具列表

```bash
curl -s http://localhost:3001/api/chat/tools | jq '.count'
```

2) 让模型修改一个文件并运行 lint

在前端对话中输入：

> 请读取 `server/services/code-editor.cjs` 的代码，并将 `createDiffPreview` 函数输出最大长度从 1200 提升到 1600，随后运行 `run_lint --fix` 并把结果告诉我。如果有变更，请展示 diff 预览。

3) 运行测试

> 请运行 `test_runner.run_tests` 并返回摘要结果。

4) 提交到 Git（可选）

> 请使用 MCP Git 工具提交本次修改，提交信息为 "feat: enhance diff preview length"。

## 审计

检查 `logs/audit.log`，确认工具调用与文件变更有记录。


