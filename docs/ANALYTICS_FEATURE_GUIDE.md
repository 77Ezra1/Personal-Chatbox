# 数据分析功能完整指南

**作者**: Ezra
**更新日期**: 2025-10-17
**版本**: v1.0.0

---

## 📊 功能概述

数据分析仪表板提供了全面的AI对话使用情况统计和可视化功能，帮助您了解：
- 对话和消息的使用趋势
- 不同AI模型的使用分布
- Token消耗和成本估算
- 详细的使用数据导出

---

## ✨ 核心功能

### 1. 统计概览卡片

四个核心指标卡片：
- **总对话数** - 显示所有对话的总数，包含今日消息数
- **总消息数** - 显示所有消息的总数
- **总Token数** - 显示Prompt和Completion的Token消耗
- **预估成本** - 基于Token使用量的成本估算（USD）

### 2. 使用趋势图表

- **面积图** - 显示一段时间内的消息和对话数量变化
- **时间范围** - 支持7天、30天、90天的时间跨度
- **渐变填充** - 使用渐变色彩提升视觉效果
- **交互式Tooltip** - 鼠标悬停查看详细数据

### 3. 模型使用统计

#### 饼图 (Pie Chart)
- 显示TOP 5模型的使用分布
- 百分比标签直观展示占比
- 彩色区分不同模型

#### 柱状图 (Bar Chart)
- TOP 5模型的使用次数对比
- 彩色编码便于识别
- 支持交互式Tooltip

#### 详细列表
- 热门模型排名
- 进度条可视化使用量
- 显示具体使用次数

### 4. 数据导出功能

- **JSON格式** - 完整的结构化数据导出
- **CSV格式** - 表格数据导出（计划中）
- 包含对话和消息的详细信息
- 自动下载到本地

### 5. 实时刷新

- 手动刷新按钮
- 加载动画提示
- 错误处理和重试机制

---

## 🎯 使用方法

### 访问分析页面

1. 登录应用
2. 点击侧边栏的"数据分析"或"Analytics"
3. 等待数据加载完成

### 切换时间范围

1. 页面顶部有时间选择器
2. 点击"最近7天"、"最近30天"或"最近90天"
3. 图表会自动更新为选定时间范围的数据

### 查看详细统计

1. 鼠标悬停在图表上查看具体数值
2. 概览卡片显示累计统计
3. 模型列表显示使用排名

### 导出数据

1. 点击页面顶部的"导出"按钮
2. 选择导出格式（JSON）
3. 文件会自动下载到本地
4. 文件名格式：`analytics-export-[timestamp].json`

### 刷新数据

1. 点击"刷新"按钮
2. 等待数据重新加载
3. 所有图表和统计会更新为最新数据

---

## 🔧 技术实现

### 前端组件

**文件**: `src/pages/AnalyticsPage.jsx`

**依赖**:
- **recharts** ^3.2.1 - 图表库
- **lucide-react** - 图标库
- **React Hooks** - useState, useEffect, useCallback

**主要功能**:
```javascript
- loadAnalyticsData() - 加载所有分析数据
- handleRefresh() - 手动刷新数据
- handleExport() - 导出数据到JSON/CSV
- 响应式图表渲染
- 错误处理和加载状态
```

### 后端API

**文件**: `server/routes/analytics.cjs`

**端点列表**:

#### 1. GET `/api/analytics/overview`
获取统计概览

**响应**:
```json
{
  "success": true,
  "data": {
    "conversations": 123,
    "messages": 456,
    "tokens": {
      "prompt": 12345,
      "completion": 23456,
      "total": 35801
    },
    "cost": {
      "total": "0.0358",
      "prompt": "0.0062",
      "completion": "0.0296",
      "currency": "USD"
    },
    "todayMessages": 12,
    "topModels": [...]
  }
}
```

#### 2. GET `/api/analytics/trends?period=7d`
获取使用趋势数据

**参数**:
- `period`: 7d | 30d | 90d

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-10",
      "message_count": 10,
      "conversation_count": 3,
      "total_tokens": 1000
    },
    ...
  ]
}
```

#### 3. GET `/api/analytics/models`
获取模型使用分布

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "model": "gpt-4",
      "count": 50,
      "total_tokens": 10000,
      "avg_tokens": 200,
      "percentage": "45.5"
    },
    ...
  ]
}
```

#### 4. GET `/api/analytics/tools`
获取工具调用统计

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "name": "web_search",
      "count": 25
    },
    ...
  ]
}
```

#### 5. GET `/api/analytics/heatmap`
获取时间热力图数据

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "day": "周一",
      "hour": 9,
      "count": 15
    },
    ...
  ]
}
```

#### 6. GET `/api/analytics/export?format=json`
导出数据

**参数**:
- `format`: json | csv

**响应**: 下载文件

---

## 📦 数据库结构

### 数据库迁移

**文件**: `server/db/migrations/017-add-model-field.sql`

添加的字段：
```sql
ALTER TABLE messages ADD COLUMN model TEXT;
```

添加的索引：
```sql
CREATE INDEX idx_messages_model ON messages(model);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_conversation_role ON messages(conversation_id, role);
```

### 数据存储

分析数据从以下表中获取：
- `conversations` - 对话基本信息
- `messages` - 消息内容和元数据
- `messages.metadata` - JSON格式存储Token使用量

---

## 🎨 样式和主题

### CSS文件

**文件**: `src/pages/AnalyticsPage.css`

**主要样式**:
- 响应式布局（支持移动端）
- 深色模式支持
- 动画效果（淡入、悬停）
- 图表容器样式

### 配色方案

```javascript
const COLORS = [
  '#3b82f6', // 蓝色
  '#8b5cf6', // 紫色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#ec4899', // 粉色
  '#06b6d4', // 青色
  '#84cc16'  // 黄绿色
]
```

---

## 🔐 安全性

### 认证要求

所有分析API端点都需要认证：
```javascript
router.get('/overview', authMiddleware, async (req, res) => {
  // 只能访问当前用户的数据
  const userId = req.user.id;
  ...
})
```

### 数据隔离

- 每个用户只能查看自己的数据
- SQL查询使用 `user_id` 过滤
- 不会暴露其他用户的信息

---

## 📈 性能优化

### 数据库优化

1. **索引优化**
   - `idx_messages_model` - 模型统计查询
   - `idx_messages_timestamp` - 时间范围查询
   - `idx_messages_conversation_role` - 联合查询

2. **查询优化**
   - 使用 `COUNT(*)` 而不是 `SELECT *`
   - 合理使用 `LIMIT` 限制结果集
   - 预聚合数据减少实时计算

### 前端优化

1. **数据缓存**
   - useState 缓存加载的数据
   - useCallback 防止重复请求

2. **按需加载**
   - 只在访问页面时加载数据
   - 支持手动刷新

3. **图表优化**
   - ResponsiveContainer 自适应大小
   - 限制数据点数量（TOP 5）

---

## 🐛 故障排查

### 问题1: 数据为0

**原因**:
- 数据库中没有消息记录
- 用户还未开始对话

**解决**:
- 开始一些对话后再查看
- 检查数据库连接

### 问题2: 图表不显示

**原因**:
- recharts库未安装
- 数据格式不正确

**解决**:
```bash
pnpm install recharts
```

### 问题3: API 返回401

**原因**:
- 未登录
- Session过期

**解决**:
- 重新登录
- 检查Cookie设置

### 问题4: 模型数据为空

**原因**:
- messages表中model字段为NULL
- 数据库迁移未运行

**解决**:
```bash
# 运行迁移
sqlite3 data/app.db < server/db/migrations/017-add-model-field.sql
```

---

## 🚀 未来计划

### Phase 1: 增强功能
- [ ] 时间热力图可视化
- [ ] 自定义日期范围选择器
- [ ] CSV格式导出
- [ ] 按模型筛选数据

### Phase 2: 高级分析
- [ ] 成本趋势分析
- [ ] Token使用预测
- [ ] 对话主题分类
- [ ] 使用模式识别

### Phase 3: 报表功能
- [ ] 周报/月报自动生成
- [ ] PDF报表导出
- [ ] 邮件报告订阅
- [ ] 数据对比功能

---

## 📚 相关文档

- [README.md](../README.md) - 项目主文档
- [数据库设计](database-design.md) - 数据库架构
- [API文档](reports/BACKEND_ARCHITECTURE.md) - 后端架构
- [完整功能列表](COMPLETE_FEATURES_LIST.md) - 所有功能

---

## 🤝 贡献

欢迎贡献代码和提出建议！

**提交PR**:
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

**报告问题**:
- [GitHub Issues](https://github.com/77Ezra1/Personal-Chatbox/issues)

---

## 📄 许可证

本项目采用 MIT 许可证

---

**维护者**: Personal Chatbox Team
**最后更新**: 2025-10-17
**文档版本**: v1.0.0
