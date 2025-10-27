# MCP工具国际化实现说明

## ✅ 实现内容

### 1. 创建翻译映射表
**文件**: `src/i18n/mcpToolsTranslations.js`

- 包含 **70+ 常用MCP工具** 的中文翻译
- 涵盖多个类别：
  - 🔍 搜索相关（search_nodes, search_files, findPage等）
  - 📁 文件操作（read_file, write_file, edit_file等）
  - 🗄️ 数据库操作（query, list_tables, describe_table等）
  - 🐙 Git操作（create_repository, push_files, create_issue等）
  - 🌐 API和网络（fetch, get_request, post_request等）
  - 🤖 浏览器自动化（puppeteer_navigate, puppeteer_screenshot等）
  - 💾 内存和笔记（create_entities, add_observations等）
  - 💬 Slack操作（post_slack_message, reply_slack_message等）
  - 🌤️ 时间和天气（get_current_time, get_weather等）
  - 📝 Notion操作（create_page, update_page, search_pages等）
  - 🐘 PostgreSQL操作（postgres_query, postgres_list_tables等）
  - 📺 YouTube相关（get_video_info, get_transcript等）

### 2. 修改工具Hook
**文件**: `src/hooks/useMcpTools.js`

- 导入翻译函数
- 在 `flatTools` 中应用翻译
- 在 `toolsByService` 中应用翻译
- 改进分类逻辑，同时支持英文和中文关键词匹配

### 3. 数据结构变化

#### 修改前（纯英文）
```javascript
{
  value: 'memory_search_nodes',
  label: 'Search for nodes in the knowledge graph based on a query',
  toolName: 'search_nodes',
  description: 'Search for nodes in the knowledge graph based on a query'
}
```

#### 修改后（中文显示，英文保留）
```javascript
{
  value: 'memory_search_nodes',           // 保持英文（API调用用）
  label: '在知识图谱中根据查询搜索节点',    // 中文描述
  toolName: '搜索节点',                   // 中文名称
  originalToolName: 'search_nodes',      // 保留英文名称
  description: '在知识图谱中根据查询搜索节点', // 中文描述
  originalDescription: 'Search for nodes in the knowledge graph based on a query' // 保留英文描述
}
```

---

## 🎯 实现原理

### 翻译函数

**getToolTranslatedName(toolName)**
- 输入：工具的英文名称（如 `search_nodes`）
- 输出：中文名称（如 `搜索节点`）
- 回退：如果没有翻译，自动格式化英文名称（首字母大写，下划线转空格）

**getToolTranslatedDescription(toolName, originalDescription)**
- 输入：工具英文名称 + 原始英文描述
- 输出：中文描述
- 回退：如果没有翻译，返回原始英文描述

### 分类逻辑增强

原来只检查英文关键词：
```javascript
if (toolName.includes('search') || toolName.includes('find'))
```

现在同时检查英文和中文：
```javascript
if (
  originalName.includes('search') || originalName.includes('find') ||
  translatedName.includes('搜索') || translatedDesc.includes('查询')
)
```

这样无论是英文工具还是中文翻译后的工具，都能正确分类。

---

## 📸 效果展示

### 修改前
```
搜索和检索 (3)
  ○ search_nodes
    Search for nodes in the knowledge graph based on a query

  ○ search_files
    Recursively search for files and directories matching a pattern
```

### 修改后
```
搜索和检索 (3)
  ○ 搜索节点
    在知识图谱中根据查询搜索节点

  ○ 搜索文件
    递归搜索匹配模式的文件和目录
```

---

## 🔧 如何添加新的翻译

### 1. 编辑翻译文件

打开 `src/i18n/mcpToolsTranslations.js`，在 `mcpToolsTranslations` 对象中添加：

```javascript
export const mcpToolsTranslations = {
  // ... 现有翻译 ...

  // 添加新翻译
  'your_tool_name': {
    name: '你的工具名称',
    description: '你的工具描述'
  }
}
```

### 2. 工具名称格式

**重要**：工具名称是不含服务前缀的部分。

例如：
- 完整工具ID：`memory_search_nodes`
- 服务ID：`memory`
- 工具名称：`search_nodes` ← 用这个作为key

### 3. 无需重启

前端会自动使用新的翻译，只需刷新页面即可。

---

## 🧪 测试步骤

### 1. 刷新页面
强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）清除缓存

### 2. 打开Agent创建页面
- 点击"创建新代理"
- 切换到"Capabilities"标签

### 3. 启用MCP Services
打开"工具"部分的"MCP Services"开关

### 4. 验证翻译
你应该看到：
- ✅ 工具名称显示中文（如 "搜索节点" 而不是 "search_nodes"）
- ✅ 工具描述显示中文
- ✅ 类别名称保持中文
- ✅ 工具仍然可以正常选择和使用

---

## 🔍 故障排查

### 问题1: 某些工具仍显示英文

**原因**: 该工具尚未添加翻译

**解决方案**:
1. 查看控制台，记下工具的英文名称
2. 在 `mcpToolsTranslations.js` 中添加该工具的翻译
3. 刷新页面

### 问题2: 工具分类错误

**原因**: 分类关键词不匹配

**解决方案**:
1. 打开 `src/hooks/useMcpTools.js`
2. 找到 `toolsByCategory` 的 `useMemo`
3. 在对应类别的判断条件中添加更多关键词

例如，将工具分类到"搜索和检索"：
```javascript
if (
  originalName.includes('search') || originalName.includes('find') ||
  originalName.includes('lookup') || // 添加新关键词
  translatedName.includes('搜索') || translatedName.includes('查找')
)
```

### 问题3: 翻译文件报错

**检查清单**:
- ✅ 文件路径正确：`src/i18n/mcpToolsTranslations.js`
- ✅ export语法正确
- ✅ 对象格式正确（逗号、引号等）
- ✅ 没有中文标点符号（如中文逗号、冒号）

---

## 📊 翻译覆盖率

### 当前已翻译
- **搜索相关**: 6个工具 ✅
- **文件操作**: 11个工具 ✅
- **数据库操作**: 4个工具 ✅
- **Git操作**: 15个工具 ✅
- **API和网络**: 3个工具 ✅
- **浏览器自动化**: 7个工具 ✅
- **内存和笔记**: 7个工具 ✅
- **Slack操作**: 4个工具 ✅
- **时间和天气**: 2个工具 ✅
- **Notion操作**: 7个工具 ✅
- **PostgreSQL**: 3个工具 ✅
- **YouTube**: 3个工具 ✅

**总计**: 70+ 工具

### 如何提高覆盖率

1. 查看Agent创建页面的工具列表
2. 记录仍显示英文的工具名称
3. 在翻译文件中添加这些工具
4. 提交PR或更新文档

---

## 🌐 多语言支持（未来扩展）

当前实现是针对中文的，但架构支持扩展到多语言：

### 扩展步骤

1. **创建多语言文件结构**
```
src/i18n/
  ├── mcpToolsTranslations.js (当前)
  ├── mcpToolsTranslations.zh-CN.js (简体中文)
  ├── mcpToolsTranslations.zh-TW.js (繁体中文)
  ├── mcpToolsTranslations.en.js (英文)
  └── mcpToolsTranslations.ja.js (日文)
```

2. **修改翻译函数**
```javascript
import { useLanguage } from '@/hooks/useLanguage'

function getToolTranslatedName(toolName) {
  const { language } = useLanguage()
  const translations = getTranslationsByLanguage(language)
  return translations[toolName]?.name || formatToolName(toolName)
}
```

3. **添加语言切换UI**
在设置页面添加语言选择器

---

## 🎉 总结

### 实现的功能
- ✅ MCP工具名称中文化
- ✅ MCP工具描述中文化
- ✅ 保留英文原文（用于API调用）
- ✅ 智能分类（支持中英文关键词）
- ✅ 易于扩展（添加新翻译很简单）
- ✅ 向后兼容（未翻译的工具自动降级到英文）

### 技术亮点
- **双重保存**：同时保存中文和英文，确保兼容性
- **智能回退**：没有翻译时自动格式化英文名称
- **分类增强**：同时支持中英文关键词匹配
- **易于维护**：所有翻译集中在一个文件中

### 用户体验提升
- 🌟 界面更友好（中文显示）
- 🚀 理解更快速（无需翻译英文）
- 🎯 分类更清晰（中文类别名称）
- ✨ 使用更直观（中文描述）

---

## 📝 下一步优化建议

1. **继续添加翻译**
   - 覆盖更多MCP工具
   - 特别是用户自定义的MCP服务

2. **添加工具分类标签**
   - 在工具旁边显示类别图标
   - 如 🔍 搜索、📁 文件、🗄️ 数据库

3. **搜索功能增强**
   - 支持中英文搜索工具
   - 模糊匹配工具名称和描述

4. **工具详情卡片**
   - 点击工具显示详细信息
   - 包括参数说明、使用示例

5. **多语言支持**
   - 扩展到繁体中文、英文、日文等
   - 根据系统语言自动切换

---

如有问题或建议，欢迎反馈！🚀
