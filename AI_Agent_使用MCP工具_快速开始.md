# AI Agent 使用 MCP 工具 - 快速开始指南

## 🎯 5 分钟上手

本指南将帮助你快速创建一个能够使用 MCP 工具的 AI Agent 并执行任务。

---

## 📋 前置要求

1. ✅ 项目已启动（前端 + 后端）
2. ✅ 至少启用了 1 个 MCP 服务

### 如何启用 MCP 服务？

```
1. 进入"设置"页面
2. 找到"MCP Services"模块
3. 选择一个服务（例如 Wikipedia）
4. 点击"启用"按钮
5. 确认服务状态为"运行中"
```

---

## 🚀 步骤 1: 创建 AI Agent

### 1.1 进入 AI Agents 页面

点击左侧菜单的 **"AI Agents"**

### 1.2 创建新代理

点击右上角的 **"创建新代理"** 按钮

### 1.3 填写基本信息

**"基本信息"标签页**:
- **名称**: `Wikipedia 研究助手`
- **描述**: `帮助我搜索和整理 Wikipedia 资料`
- **类型**: `Task-based` (基于任务)

### 1.4 选择能力

**"能力"标签页**:

点击以下能力按钮：
- ✅ Research
- ✅ Writing

### 1.5 选择工具 ⭐

**重点**：在"能力"标签页向下滚动到"工具"区域

1. **确保右上角的开关显示 "MCP Services"** （应该是打开状态）

2. **浏览可用工具**：
   - 工具按类别分组显示
   - 例如：`搜索和检索`、`文件操作` 等

3. **选择工具**（点击工具卡片）：
   - ✅ `wikipedia_findPage` - 搜索维基百科页面
   - ✅ `wikipedia_getPage` - 获取页面内容
   - ✅ `filesystem_write_file` - 保存文件（如果启用了 Filesystem 服务）

4. **查看已选工具**：
   - 底部会显示蓝色 Badges
   - 每个 Badge 代表一个已选工具
   - 点击 Badge 上的 X 可以移除

### 1.6 高级配置（可选）

**"高级"标签页**:
- **Model**: `gpt-4o` （或你喜欢的模型）
- **Temperature**: `0.7`
- **Max Tokens**: `4000`

### 1.7 保存

点击底部的 **"创建代理"** 按钮

---

## 🎬 步骤 2: 执行任务

### 2.1 选择 Agent

在 AI Agents 列表中，找到刚创建的 `Wikipedia 研究助手`

### 2.2 点击"执行任务"

点击 Agent 卡片上的 **"执行任务"** 按钮

### 2.3 输入任务信息

**任务标题**:
```
研究人工智能的历史
```

**任务描述**:
```
请搜索维基百科上关于人工智能历史的信息，
并整理成一份简短的总结。
```

**任务输入数据（可选）**:
```json
{
  "topic": "Artificial Intelligence",
  "focus": "history and development"
}
```

### 2.4 开始执行

点击 **"开始执行"** 按钮

---

## 👀 步骤 3: 观察执行过程

### 3.1 查看任务分解

执行开始后，Agent 会自动分解任务为多个子任务：

**示例子任务**:
1. ✅ 搜索维基百科 - `wikipedia_findPage`
2. ✅ 获取页面内容 - `wikipedia_getPage`
3. ✅ 整理和总结 - AI 分析
4. ✅ 保存结果 - `filesystem_write_file`

### 3.2 查看工具调用

点击每个子任务，可以看到详细信息：

**子任务 1: 搜索维基百科**
- **类型**: `tool_call`
- **工具**: `wikipedia_findPage`
- **参数**:
  ```json
  {
    "query": "Artificial Intelligence history"
  }
  ```
- **结果**:
  ```json
  {
    "pages": [
      { "title": "Artificial Intelligence", "id": 12345 },
      { "title": "History of AI", "id": 67890 }
    ]
  }
  ```

### 3.3 查看任务进度

顶部会显示进度条：
- 🔵 运行中 - 正在执行
- 🟢 已完成 - 执行成功
- 🔴 失败 - 执行失败

---

## ✅ 步骤 4: 查看结果

### 4.1 任务完成

当所有子任务完成后，任务状态变为 **"已完成"**

### 4.2 查看输出

在任务执行页面的"结果"标签页，可以看到：

**最终输出**:
```
人工智能历史总结：

人工智能（AI）的概念起源于 20 世纪 50 年代...
[从 Wikipedia 获取并整理的内容]
```

**生成的文件**:
- 如果选择了 `filesystem_write_file` 工具
- 文件可能已保存到服务器（根据配置）

### 4.3 查看执行日志

点击"日志"标签页，可以看到完整的执行过程：

```
[2025-01-15 10:30:00] 任务开始执行
[2025-01-15 10:30:01] 分解为 4 个子任务
[2025-01-15 10:30:02] 执行子任务 1: 搜索维基百科
[2025-01-15 10:30:03] 调用 MCP 工具: wikipedia_findPage
[2025-01-15 10:30:04] 工具调用成功，找到 2 个结果
[2025-01-15 10:30:05] 执行子任务 2: 获取页面内容
...
[2025-01-15 10:30:15] 任务执行完成
```

---

## 🎨 UI 界面说明

### Agent Editor - 工具选择区域

```
┌─────────────────────────────────────────────┐
│ 工具                        [MCP Services ✓]│
├─────────────────────────────────────────────┤
│ 加载中... / 工具列表                          │
│                                             │
│ [搜索和检索 (3)]                              │
│   ○ wikipedia_findPage                      │
│     Search for Wikipedia pages              │
│   ○ wikipedia_getPage                       │
│     Get Wikipedia page content              │
│   ○ brave_search                            │
│     Search the web using Brave              │
│                                             │
│ [文件操作 (2)]                                │
│   ○ filesystem_read_file                    │
│     Read file contents                      │
│   ● filesystem_write_file       (已选中)     │
│     Write content to file                   │
│                                             │
├─────────────────────────────────────────────┤
│ 已选工具:                                     │
│ [wikipedia_findPage ✕]                      │
│ [wikipedia_getPage ✕]                       │
│ [filesystem_write_file ✕]                   │
└─────────────────────────────────────────────┘
```

**说明**:
- `○` = 未选中
- `●` = 已选中
- 点击工具卡片切换选中状态
- 点击底部 Badge 的 ✕ 可以移除工具

---

## 🔍 常见问题

### Q1: 看不到 MCP 工具？

**原因**: MCP 服务未启用

**解决**:
1. 进入"设置" → "MCP Services"
2. 启用至少一个服务
3. 等待服务启动（状态变为"运行中"）
4. 刷新 Agent 编辑器

### Q2: 工具调用失败？

**可能原因**:
- MCP 服务已停止
- 工具参数错误
- 网络连接问题

**解决**:
1. 检查 MCP 服务状态
2. 查看任务执行日志
3. 重试任务执行

### Q3: 能同时使用多个工具吗？

**回答**: 可以！

Agent 可以：
- 使用多个 MCP 工具
- 混合使用 MCP 工具和静态工具
- 在不同子任务中调用不同工具

### Q4: 如何知道工具被真正调用了？

**验证方法**:
1. 查看子任务详情
2. 查看"结果"字段，应包含 MCP 返回的数据
3. 查看后端日志:
   ```bash
   # 在终端查看日志
   # 应该看到类似:
   # [AgentEngine] 调用 MCP 工具: wikipedia_findPage
   # [MCPManager] Tool result: {...}
   ```

### Q5: 静态工具还能用吗？

**回答**: 完全可以！

关闭"MCP Services"开关，就会显示静态工具：
- web_search
- read_file
- write_file
- validate_data
- data_transform

---

## 🎯 进阶示例

### 示例 1: 网页测试助手

**工具选择**:
- ✅ `playwright_navigate` - 打开网页
- ✅ `playwright_click` - 点击元素
- ✅ `playwright_screenshot` - 截图
- ✅ `filesystem_write_file` - 保存截图

**任务示例**:
```
测试 GitHub 登录页面
1. 打开 https://github.com/login
2. 截图保存
3. 检查登录按钮是否存在
```

### 示例 2: 数据分析助手

**工具选择**:
- ✅ `filesystem_read_file` - 读取 CSV 文件
- ✅ 数据处理工具
- ✅ `filesystem_write_file` - 保存分析结果

**任务示例**:
```
分析销售数据
1. 读取 sales.csv
2. 计算总销售额和平均值
3. 生成分析报告并保存
```

### 示例 3: 知识库助手

**工具选择**:
- ✅ `wikipedia_findPage`
- ✅ `wikipedia_getPage`
- ✅ `memory_create_entities` - 保存到记忆
- ✅ `memory_search_entities` - 搜索记忆

**任务示例**:
```
构建关于量子计算的知识库
1. 搜索相关 Wikipedia 页面
2. 提取关键信息
3. 保存到知识库
4. 建立知识点之间的关联
```

---

## 📚 相关文档

- [AI Agent 与 MCP 集成说明](./AI_Agent_MCP集成说明.md) - 功能概览
- [AI Agent 与 MCP 集成技术实现](./AI_Agent_MCP集成_技术实现.md) - 技术细节
- [MCP Services 用户自定义功能](./MCP_用户自定义服务功能说明.md) - MCP 服务配置
- [MCP 后端支持说明](./MCP_后端支持说明.md) - 后端 API 文档

---

## 🎉 开始使用

现在你已经了解了如何创建和使用 AI Agent with MCP 工具！

**建议的学习路径**:
1. ✅ 跟随本指南创建第一个 Agent
2. ✅ 尝试不同的 MCP 工具组合
3. ✅ 观察任务分解和执行过程
4. ✅ 查看技术实现文档了解原理
5. ✅ 创建自己的 MCP 服务并集成

**Happy Agent Building! 🚀**

