# MCP 手动配置功能说明

## 📋 功能概述

现在用户可以完全自定义配置 MCP 服务，无需依赖预设模板！这个功能适合：
- 🔧 配置自己开发的 MCP 服务
- 🌐 使用社区中的第三方 MCP 服务
- 🎯 精确控制服务的所有参数和环境变量

---

## 🎯 如何使用

### 步骤 1: 打开手动配置界面
1. 点击 "添加服务" 按钮
2. 选择 **"手动配置"** 标签页

### 步骤 2: 填写基本信息

#### 必填字段
- **服务 ID** (mcp_id)
  - 唯一标识符
  - 只能包含：字母、数字、下划线 (_)、连字符 (-)
  - 例如：`my-custom-service`, `github-private`, `local-db`

- **服务名称** (name)
  - 显示名称
  - 例如：`我的自定义服务`, `私有 GitHub`, `本地数据库`

- **执行命令** (command)
  - 用于启动服务的命令
  - 例如：`npx`, `node`, `python`, `python3`

#### 可选字段
- **服务描述** (description)
  - 描述服务的功能和用途

- **分类** (category)
  - 从下拉列表选择
  - 可选：开发工具、数据库、自动化、云服务等

- **图标** (icon)
  - 使用一个表情符号
  - 例如：🔧 🚀 📊 💾 🌐

### 步骤 3: 配置命令参数

#### 命令参数 (args)
- **格式**：JSON 数组
- **示例**：
```json
["-y", "@modelcontextprotocol/server-github"]
```

```json
["--host", "localhost", "--port", "8080"]
```

- **说明**：
  - 必须是有效的 JSON 格式
  - 留空表示无参数
  - 每个参数作为数组的一个元素

#### 环境变量 (env_vars)
- **格式**：JSON 对象
- **示例**：
```json
{
  "API_KEY": "your-api-key-here",
  "TIMEOUT": "30000",
  "DEBUG": "true"
}
```

```json
{
  "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
  "REPO_OWNER": "username"
}
```

- **说明**：
  - 必须是有效的 JSON 对象格式
  - 键值对形式
  - 留空表示无环境变量

### 步骤 4: 添加功能列表（可选）

#### 功能描述 (features)
- **格式**：JSON 数组
- **示例**：
```json
["文件读写", "目录管理", "文件搜索"]
```

```json
["仓库管理", "Issue 操作", "PR 管理"]
```

---

## 📝 完整配置示例

### 示例 1: 自定义 GitHub 服务
```
服务 ID: my-github
服务名称: 我的 GitHub
描述: 连接到我的 GitHub 私有仓库
分类: development (开发工具)
图标: 🐙
命令: npx
参数: ["-y", "@modelcontextprotocol/server-github"]
环境变量: {"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"}
功能: ["仓库管理", "Issue管理", "Pull Request"]
```

### 示例 2: 本地 PostgreSQL
```
服务 ID: local-postgres
服务名称: 本地数据库
描述: 连接到本地 PostgreSQL 数据库
分类: database (数据库)
图标: 🐘
命令: npx
参数: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost/mydb"]
环境变量: {}
功能: ["SQL查询", "表结构管理", "数据分析"]
```

### 示例 3: 自定义 Python 服务
```
服务 ID: my-python-service
服务名称: Python 数据处理
描述: 自己开发的 Python MCP 服务
分类: other (其他)
图标: 🐍
命令: python
参数: ["./my_mcp_server.py"]
环境变量: {"DATA_PATH": "/path/to/data", "LOG_LEVEL": "INFO"}
功能: ["数据清洗", "统计分析", "可视化"]
```

### 示例 4: Node.js 本地服务
```
服务 ID: local-node-service
服务名称: 本地 Node 服务
描述: 运行本地开发的 Node.js MCP 服务
分类: development (开发工具)
图标: 🟢
命令: node
参数: ["./server.js"]
环境变量: {"PORT": "3000", "ENV": "development"}
功能: ["API调用", "数据处理"]
```

---

## ⚠️ 注意事项

### JSON 格式要求
1. **参数必须是数组**
   - ✅ 正确：`["-y", "package-name"]`
   - ❌ 错误：`"-y package-name"` (字符串)
   - ❌ 错误：`{"-y": "package-name"}` (对象)

2. **环境变量必须是对象**
   - ✅ 正确：`{"KEY": "value"}`
   - ❌ 错误：`["KEY", "value"]` (数组)
   - ❌ 错误：`"KEY=value"` (字符串)

3. **功能列表必须是数组**
   - ✅ 正确：`["功能1", "功能2"]`
   - ❌ 错误：`"功能1,功能2"` (字符串)

### 字段验证
- **服务 ID**：
  - 不能与现有服务重复
  - 只能使用英文字母、数字、下划线、连字符
  - 建议使用小写字母

- **必填字段**：
  - 服务 ID、服务名称、执行命令必须填写
  - 其他字段可以留空

### 安全建议
1. **环境变量中的敏感信息**
   - API Token、密码等会保存在数据库
   - 建议使用有限权限的 Token
   - 定期轮换密钥

2. **命令安全**
   - 只使用可信的命令
   - 避免执行不明来源的脚本

---

## 🔧 高级用法

### 使用本地文件路径
```json
{
  "args": ["./path/to/local/script.js"],
  "env_vars": {
    "CONFIG_PATH": "C:/Users/username/config.json"
  }
}
```

### 多个环境变量
```json
{
  "API_KEY": "key1",
  "API_SECRET": "secret1",
  "BASE_URL": "https://api.example.com",
  "TIMEOUT": "30000",
  "RETRY_COUNT": "3",
  "DEBUG": "false"
}
```

### 复杂的参数配置
```json
[
  "-y",
  "@my-org/my-package",
  "--config",
  "./config.json",
  "--verbose",
  "--log-level",
  "debug"
]
```

---

## 🐛 常见错误

### 错误 1: JSON 格式错误
```
错误信息: 参数格式错误: Unexpected token...
解决方案: 检查 JSON 格式，确保使用双引号，逗号正确
```

### 错误 2: 服务 ID 已存在
```
错误信息: 该MCP服务已存在
解决方案: 使用不同的服务 ID
```

### 错误 3: 必填字段缺失
```
错误信息: 请填写所有必填字段
解决方案: 确保服务 ID、名称、命令都已填写
```

### 错误 4: 服务启动失败
```
可能原因:
- 命令路径不正确
- 依赖包未安装
- 环境变量配置错误
- 网络问题

解决方案:
- 检查命令是否存在
- 运行 npm install 安装依赖
- 验证环境变量值
- 检查代理设置
```

---

## 📚 参考资源

### MCP 官方文档
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [MCP 服务器列表](https://github.com/modelcontextprotocol/servers)

### JSON 工具
- [JSON Formatter](https://jsonformatter.org/)
- [JSON Validator](https://jsonlint.com/)

### 示例服务
查看 `server/data/mcp-templates.json` 中的模板配置，可以作为参考。

---

## ✅ 验证清单

创建服务前，请确认：
- [ ] 服务 ID 唯一且符合命名规范
- [ ] 服务名称清晰易懂
- [ ] 执行命令正确（可在终端测试）
- [ ] 参数 JSON 格式正确
- [ ] 环境变量 JSON 格式正确
- [ ] 所需依赖已安装
- [ ] 敏感信息已妥善处理

---

## 🎉 成功案例

配置成功后，你将看到：
1. ✅ "自定义 MCP 服务创建成功！" 提示
2. 🔄 对话框自动关闭
3. 📋 服务列表中出现新服务
4. 🟢 服务自动启动（如果配置正确）

在聊天中，AI 现在可以使用你自定义的 MCP 服务了！🎊

---

**提示**: 如果不确定如何配置，建议先从模板添加相似的服务，然后查看其配置作为参考。

