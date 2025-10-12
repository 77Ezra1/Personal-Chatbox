# MCP服务配置功能使用指南

## 功能概述

本次更新为**SQLite数据库**和**Filesystem文件系统**两个MCP服务添加了配置UI,允许用户自定义数据库路径和文件系统访问目录。

## 如何使用

### 1. 打开设置页面

1. 点击应用右上角的**设置图标**⚙️
2. 在左侧菜单中选择**MCP Services**

### 2. 配置Filesystem服务

#### 步骤:
1. 在MCP Services页面中找到**Filesystem文件系统**服务卡片
2. 点击服务名称旁边的**配置按钮**⚙️
3. 在弹出的对话框中输入允许访问的目录路径
4. 点击**保存配置**按钮

#### 示例配置:
```
/home/ubuntu/documents
/home/ubuntu/projects
/home/ubuntu/data
```

#### 注意事项:
- 可以配置多个目录,每行一个
- 路径必须是绝对路径
- 确保路径存在且有访问权限
- 子目录会自动包含在允许访问范围内

### 3. 配置SQLite服务

#### 步骤:
1. 在MCP Services页面中找到**SQLite数据库**服务卡片
2. 点击服务名称旁边的**配置按钮**⚙️
3. 在弹出的对话框中输入数据库文件路径
4. 点击**保存配置**按钮

#### 示例配置:
```
/home/ubuntu/myapp.db
```

#### 注意事项:
- 路径必须是绝对路径
- 如果数据库文件不存在,SQLite会自动创建
- 确保目录有写入权限

### 4. 重启服务使配置生效

配置保存后,需要重启后端服务才能使新配置生效:

```bash
# 停止当前服务
ps aux | grep "node.*server/index.cjs" | grep -v grep | awk '{print $2}' | xargs kill

# 启动服务
cd /home/ubuntu/AI-Life-system
nohup node server/index.cjs > /tmp/backend.log 2>&1 &
```

或者直接重启整个应用。

## 配置文件位置

所有配置都保存在:
```
/home/ubuntu/AI-Life-system/data/config.json
```

配置文件示例:
```json
{
  "version": "1.0.0",
  "services": {
    "filesystem": {
      "allowedDirectories": [
        "/home/ubuntu/documents",
        "/home/ubuntu/projects"
      ],
      "enabled": true
    },
    "sqlite": {
      "databasePath": "/home/ubuntu/myapp.db",
      "enabled": true
    }
  }
}
```

## 使用场景

### Filesystem服务使用场景

1. **文档管理**: 让AI助手访问和管理您的文档目录
2. **项目开发**: 让AI助手读写项目文件
3. **数据处理**: 让AI助手处理数据文件

### SQLite服务使用场景

1. **数据查询**: 让AI助手查询数据库中的数据
2. **数据分析**: 让AI助手分析数据库中的统计信息
3. **数据管理**: 让AI助手增删改查数据库记录

## 示例对话

### 使用Filesystem服务

**用户**: "帮我读取 /home/ubuntu/documents/report.txt 文件的内容"

**AI**: 会使用 `filesystem_read_text_file` 工具读取文件内容并返回

### 使用SQLite服务

**用户**: "查询users表中所有用户的信息"

**AI**: 会使用 `sqlite_query` 工具执行SQL查询并返回结果

## 故障排查

### 问题1: 配置保存后不生效

**解决方案**: 
- 确保已重启后端服务
- 检查 `/tmp/backend.log` 日志确认服务启动时是否读取了新配置

### 问题2: Filesystem服务无法访问文件

**可能原因**:
- 文件路径不在配置的允许目录中
- 路径不存在或没有访问权限

**解决方案**:
- 检查配置的目录路径是否正确
- 确保目录存在且有读写权限

### 问题3: SQLite服务无法连接数据库

**可能原因**:
- 数据库文件路径错误
- 目录没有写入权限

**解决方案**:
- 检查数据库路径是否正确
- 确保目录存在且有写入权限

## 技术细节

### 配置流程

1. **前端**: 用户在UI中输入配置 → 点击保存
2. **API**: POST `/api/config/service/:serviceId` 保存配置到文件
3. **后端**: ConfigStorage 模块将配置写入 `data/config.json`
4. **启动**: MCP Manager 读取配置并使用自定义参数启动服务

### 服务启动命令

#### Filesystem服务
```bash
npx -y @modelcontextprotocol/server-filesystem /path/to/dir1 /path/to/dir2
```

#### SQLite服务
```bash
npx -y mcp-sqlite /path/to/database.db
```

## 安全建议

1. **限制访问范围**: 只配置必要的目录,避免授予过大的访问权限
2. **定期检查**: 定期检查配置文件,确保没有不必要的目录访问权限
3. **备份数据**: 在配置SQLite服务前,建议备份数据库文件
4. **权限控制**: 确保配置的目录和文件有适当的权限设置

## 未来扩展

可以为以下服务添加类似的配置UI:
- GitHub服务: 配置访问令牌和仓库
- Notion服务: 配置Integration Token
- Gmail服务: 配置OAuth凭证
- Google Calendar服务: 配置OAuth凭证

## 反馈与支持

如有问题或建议,请通过以下方式联系:
- GitHub Issues: https://github.com/77Ezra1/AI-Life-system/issues
- 项目文档: 查看项目README.md

---

**版本**: 1.0.0  
**更新日期**: 2025年10月12日

