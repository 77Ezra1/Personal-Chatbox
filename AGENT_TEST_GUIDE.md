# Agent 功能测试指南

**日期**: 2025-10-26
**目的**: 验证 Agent 工具过滤和工作流集成功能

---

## 🎯 测试目标

1. **Agent 工具过滤**: 确认只有已配置的 MCP 服务的工具显示在 Agent 编辑器中
2. **工作流 Agent 集成**: 确认工作流可以调用 Agent 执行任务

---

## 📋 前置条件

### 1. 服务器状态检查

✅ **后端服务器**:
```bash
npm run server
# 应该运行在 http://localhost:3001
```

✅ **前端服务器**:
```bash
npm run dev
# 应该运行在 http://localhost:5174
```

✅ **MCP 服务状态**:
查看后端日志，应该显示：
```
[INFO] ✅ 已加载 11 个MCP服务
[INFO] 免费 MCP 服务启动完成: 7/10 个成功
```

**已配置且运行的服务** (7个):
- Memory记忆系统 (9个工具)
- Filesystem文件系统 (14个工具)
- Sequential Thinking推理增强 (1个工具)
- SQLite数据库 (8个工具)
- Wikipedia维基百科 (4个工具)
- Puppeteer浏览器控制 (7个工具)
- YouTube字幕提取 (1个工具)

**未配置的服务** (2个):
- Brave Search网页搜索 (需要 API Key)
- GitHub仓库管理 (需要 API Key)

---

## 🧪 测试 1: Agent 工具过滤功能

### 目标
验证未配置服务的工具不会显示在 Agent 编辑器中

### 测试步骤

1. **打开应用**
   - 浏览器访问: http://localhost:5174
   - 登录你的账户

2. **进入 Agent 页面**
   - 点击左侧导航栏的 "Agents" 或 "智能体"
   - 如果有现有 Agent，点击"编辑"；否则点击"创建新 Agent"

3. **查看工具列表**
   - 点击 "Capabilities" 或 "能力" 标签
   - 启用 "MCP Services" 开关
   - 查看显示的工具列表

### 预期结果

✅ **应该显示的工具** (来自已配置的服务):

- **Memory 工具** (9个):
  - create_entities
  - create_relations
  - add_observations
  - delete_entities
  - delete_observations
  - delete_relations
  - read_graph
  - search_nodes
  - open_nodes

- **Filesystem 工具** (14个):
  - read_file
  - write_file
  - edit_file
  - list_directory
  - create_directory
  - move_file
  - search_files
  - get_file_info
  - 等等...

- **SQLite 工具** (8个):
  - db_info
  - query
  - list_tables
  - get_table_schema
  - create_record
  - read_records
  - update_records
  - delete_records

- **Wikipedia 工具** (4个):
  - onThisDay
  - findPage
  - getPage
  - getImagesForPage

- **Puppeteer 工具** (7个):
  - puppeteer_navigate
  - puppeteer_screenshot
  - puppeteer_click
  - puppeteer_fill
  - puppeteer_select
  - puppeteer_hover
  - puppeteer_evaluate

- **YouTube Transcript 工具** (1个):
  - get_transcript

- **Sequential Thinking 工具** (1个):
  - sequentialthinking

❌ **不应该显示的工具** (来自未配置的服务):

- Brave Search 相关工具 (如果有)
- GitHub 相关工具 (如果有)

### 验证方法

1. **工具总数**: 应该显示约 44 个工具 (9+14+8+4+7+1+1)
2. **服务分类**: 工具应该按类别或服务分组
3. **未配置服务**: 不应该看到 Brave Search 或 GitHub 的工具

### 故障排查

如果看到未配置服务的工具：

1. 检查浏览器控制台是否有错误
2. 检查 `/api/mcp/services` 返回的数据:
   ```javascript
   // 在浏览器控制台执行
   fetch('/api/mcp/services', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(d => console.log(d))
   ```
3. 查看每个服务的 `isConfigured` 字段

---

## 🧪 测试 2: 工作流 Agent 集成

### 目标
验证工作流可以调用 Agent 执行任务

### 前置条件

1. **创建一个测试 Agent**
   - 名称: "测试 Agent"
   - 类型: task-based
   - Capabilities: research
   - Tools: 选择几个可用工具（如 wikipedia, filesystem）

2. **记录 Agent ID**
   - 创建后，从 URL 或列表中获取 Agent ID

### 测试步骤

#### 方法 A: 通过 API 测试（推荐）

1. **创建测试工作流**

创建文件 `test-workflow.json`:
```json
{
  "name": "Agent 测试工作流",
  "description": "测试工作流调用 Agent",
  "definition": {
    "nodes": [
      {
        "id": "start1",
        "type": "start",
        "config": {}
      },
      {
        "id": "agent1",
        "type": "agent",
        "config": {
          "agentId": "YOUR_AGENT_ID",
          "taskDescription": "查询维基百科，找到关于人工智能的信息",
          "timeout": 300000
        }
      },
      {
        "id": "end1",
        "type": "end",
        "config": {}
      }
    ],
    "connections": [
      { "sourceNodeId": "start1", "targetNodeId": "agent1" },
      { "sourceNodeId": "agent1", "targetNodeId": "end1" }
    ]
  }
}
```

2. **通过 API 创建并执行工作流**

```bash
# 1. 创建工作流
curl -X POST http://localhost:3001/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-workflow.json

# 2. 执行工作流
curl -X POST http://localhost:3001/api/workflows/{workflowId}/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "人工智能"}'
```

3. **查看执行结果**

检查返回的数据，应该包含 Agent 执行结果。

#### 方法 B: 通过界面测试

如果有工作流可视化编辑器：

1. 打开工作流页面
2. 创建新工作流
3. 添加以下节点：
   - Start 节点
   - Agent 节点（配置 Agent ID 和任务描述）
   - End 节点
4. 连接节点
5. 执行工作流
6. 查看执行结果

### 预期结果

✅ **成功指标**:
- 工作流执行状态: `completed`
- Agent 节点执行成功
- 返回 Agent 执行结果
- 结果包含 Wikipedia 查询的信息

❌ **失败指标**:
- 工作流执行状态: `failed`
- 错误信息: "Agent 节点必须配置 Agent ID" 或 "无法找到工作流执行上下文"

### 故障排查

1. **Agent ID 无效**
   - 确认 Agent 已创建
   - 检查 Agent ID 是否正确

2. **任务执行超时**
   - 增加 timeout 值
   - 检查 Agent 配置的工具是否可用

3. **权限问题**
   - 确认 userId 正确传递
   - 检查 Agent 是否属于当前用户

---

## 🧪 测试 3: MCP 服务配置状态

### 目标
验证 MCP 服务配置状态检测功能

### 测试步骤

1. **查看 MCP 服务列表**
   - 打开设置 → MCP Services
   - 查看服务列表

2. **检查服务状态**

每个服务应该显示以下信息：
- **服务名称**
- **启用状态** (已启用/未启用)
- **运行状态** (运行中/已停止)
- **工具数量**
- **配置状态** (已配置/需要配置) ← 这是新增的

3. **验证未配置服务**

查找 Brave Search 和 GitHub 服务：
- 应该显示 "需要配置" 或 "未配置" 标记
- 工具数量应该为 0
- 状态应该为 "已停止"

### 预期结果

✅ **已配置服务** (7个):
```
Memory记忆系统
  ✓ 已启用  ✓ 已配置  ▶ 运行中  (9 个工具)

Filesystem文件系统
  ✓ 已启用  ✓ 已配置  ▶ 运行中  (14 个工具)

...
```

❌ **未配置服务** (2个):
```
Brave Search网页搜索
  ✓ 已启用  ✗ 需要配置  ⏸ 已停止  (0 个工具)
  ⚠️ 需要 BRAVE_API_KEY

GitHub仓库管理
  ✓ 已启用  ✗ 需要配置  ⏸ 已停止  (0 个工具)
  ⚠️ 需要 GITHUB_PERSONAL_ACCESS_TOKEN
```

---

## 📊 测试结果记录

### Agent 工具过滤

- [ ] ✅ 只显示已配置服务的工具
- [ ] ✅ 未配置服务的工具被正确过滤
- [ ] ✅ 工具总数正确 (约44个)
- [ ] ✅ 工具按服务分组显示

**备注**: _____________________________________

### 工作流 Agent 集成

- [ ] ✅ Agent 节点类型存在
- [ ] ✅ 可以配置 Agent ID 和任务描述
- [ ] ✅ 工作流成功执行 Agent 任务
- [ ] ✅ Agent 执行结果正确返回

**备注**: _____________________________________

### MCP 服务配置状态

- [ ] ✅ 服务列表显示配置状态
- [ ] ✅ 未配置服务正确标记
- [ ] ✅ 已配置服务正确显示工具数量

**备注**: _____________________________________

---

## 💡 补充测试建议

### 1. 配置测试

1. 为 Brave Search 或 GitHub 配置 API Key
2. 重启服务器
3. 验证服务变为 "已配置" 状态
4. 验证工具显示在 Agent 编辑器中

### 2. 多 Agent 工作流测试

创建包含多个 Agent 节点的工作流：
```
Start → Agent1(研究) → Agent2(分析) → Agent3(总结) → End
```

验证：
- 数据正确在 Agent 之间传递
- 每个 Agent 都能访问前一个的结果

### 3. 错误处理测试

1. 配置无效的 Agent ID
2. 执行工作流
3. 验证错误信息清晰

---

## 📝 已知问题

1. ⚠️ 某些数据库迁移显示错误（不影响功能）
2. ⚠️ Filesystem 服务偶尔显示超时警告（不影响使用）

---

## ✅ 测试完成确认

测试完成后，请确认：

- [ ] Agent 工具过滤功能正常
- [ ] 工作流可以调用 Agent
- [ ] MCP 服务配置状态正确显示
- [ ] 没有发现新的 bug

**测试日期**: ______________
**测试人员**: ______________
**测试结果**: ☐ 通过  ☐ 失败
**备注**: _________________________________

