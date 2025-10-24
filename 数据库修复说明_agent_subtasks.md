# 数据库修复说明 - agent_subtasks 表

## 🔧 问题

在使用 AI Agent 执行任务时，出现以下错误：

```
任务执行失败
table agent_subtasks has no column named config
```

## 📋 原因

`agent_subtasks` 表缺少 `config` 字段，该字段用于存储子任务的配置信息（工具名称、参数等），这是 MCP 工具集成所必需的。

## ✅ 解决方案

已为 `agent_subtasks` 表添加 `config` 字段（TEXT 类型）。

### 修改详情

**添加的字段**:
- `config` (TEXT) - 存储子任务配置（JSON 格式）

**更新后的表结构**:
```sql
CREATE TABLE agent_subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  dependencies TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  config TEXT,  -- ⭐ 新增字段
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES agent_subtasks(id) ON DELETE CASCADE
);
```

### config 字段用途

存储子任务执行所需的配置信息，格式为 JSON：

```json
{
  "toolName": "wikipedia_findPage",
  "parameters": {
    "query": "Artificial Intelligence"
  }
}
```

## 🎯 验证

修复后，AI Agent 可以正常：
1. 分解任务为子任务
2. 保存子任务配置（包含 MCP 工具名称和参数）
3. 执行子任务并调用 MCP 工具

## 📁 相关文件

- 迁移文件: `server/db/migrations/023-add-agent-subtasks-config.sql`
- 修复完成时间: 2025-01-15

## 🚀 下次启动

下次项目启动时，数据库迁移系统会自动检测并应用这个更改（如果尚未应用）。

---

**状态**: ✅ 已修复

