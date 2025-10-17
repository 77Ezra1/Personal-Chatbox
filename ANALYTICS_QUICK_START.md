# 📊 数据分析功能 - 快速开始

**更新日期**: 2025-10-17
**阅读时间**: 2分钟

---

## 🚀 快速体验

### 1️⃣ 启动应用

```bash
# 确保在项目根目录
cd /Users/ezra/Personal-Chatbox

# 启动后端服务器
npm run server

# 新开一个终端，启动前端
npm run dev
```

### 2️⃣ 访问数据分析页面

1. 打开浏览器访问: `http://localhost:5173`
2. 登录您的账号
3. 点击侧边栏的 **"数据分析"** 或 **"Analytics"**

### 3️⃣ 查看统计数据

**统计概览卡片** (页面顶部):
- 💬 总对话数
- ⚡总消息数
- 📈 总Token数
- 💵 预估成本

**使用趋势图** (中间区域):
- 📊 面积图显示消息和对话数量变化
- 🔄 切换7天/30天/90天查看不同时间范围

**模型统计** (底部区域):
- 🥧 饼图 - 模型使用分布
- 📊 柱状图 - TOP 5模型使用量
- 📋 详细列表 - 热门模型排名

---

## 💡 功能亮点

### ✅ 已实现功能

- [x] 📊 **实时数据统计** - Token消耗、对话数、消息数
- [x] 📈 **趋势可视化** - 漂亮的面积图、柱状图、饼图
- [x] 🔄 **多时间范围** - 7天、30天、90天切换
- [x] 💰 **成本估算** - 基于Token的费用预估
- [x] 🤖 **模型分析** - TOP模型使用统计
- [x] 📥 **数据导出** - JSON格式导出完整数据
- [x] 🔄 **手动刷新** - 一键刷新最新数据
- [x] 🎨 **美观界面** - 响应式设计，支持深色模式

---

## 🧪 测试数据

### 如果显示"暂无数据"

这是正常的！因为您还没有开始对话。

**生成测试数据的方法**:

1. **创建几个对话**
   - 在主聊天界面发送一些消息
   - 尝试不同的AI模型

2. **等待几秒钟**
   - 让系统保存数据到数据库

3. **刷新分析页面**
   - 点击"刷新"按钮
   - 或重新进入数据分析页面

---

## 🔧 API测试（可选）

### 使用测试脚本

```bash
# 确保服务器正在运行
npm run server

# 另一个终端运行测试
node test-analytics.js
```

### 测试输出示例

```
🧪 Testing Analytics API Endpoints
============================================================

📋 Test 1: Analytics Overview
📍 Testing: http://localhost:3001/api/analytics/overview
✅ Status: 200
📊 Response: {
  "success": true,
  "data": {
    "conversations": 5,
    "messages": 25,
    "tokens": { ... },
    ...
  }
}

📈 Test 2: Usage Trends (7 days)
...

✅ All tests completed!
```

---

## 📚 详细文档

想了解更多？查看完整文档：

- 📖 **[完整功能指南](docs/ANALYTICS_FEATURE_GUIDE.md)** - 所有功能详解
- 📝 **[功能完善报告](docs/ANALYTICS_ENHANCEMENT_SUMMARY.md)** - 技术实现总结
- 🏠 **[文档索引](docs/DOCUMENTATION_INDEX.md)** - 所有文档导航

---

## ❓ 常见问题

### Q1: 为什么数据都是0？

**A**: 这是正常的！可能的原因：
- 您还没有创建任何对话
- 数据库还没有记录

**解决**: 开始一些对话后再查看

### Q2: 图表不显示？

**A**: 检查以下几点：
- recharts库是否安装: `pnpm list recharts`
- 服务器是否正常运行
- 浏览器控制台是否有错误

**解决**:
```bash
pnpm install recharts
```

### Q3: API返回401错误？

**A**: 这表示未登录或session过期

**解决**: 重新登录应用

### Q4: 如何导出数据？

**A**:
1. 点击页面顶部的"导出"按钮
2. 文件会自动下载到本地
3. 文件名格式: `analytics-export-[时间戳].json`

---

## 🎯 下一步

1. ✅ 体验数据分析功能
2. 📊 查看使用趋势
3. 💰 追踪成本支出
4. 📥 导出数据分析
5. 📖 阅读完整文档了解更多功能

---

## 💬 反馈和建议

遇到问题或有改进建议？

- 📧 提交Issue: https://github.com/77Ezra1/Personal-Chatbox/issues
- 🔧 提交PR: https://github.com/77Ezra1/Personal-Chatbox/pulls

---

**祝您使用愉快！** 🎉

---

*Personal Chatbox Team*
*最后更新: 2025-10-17*
