# 笔记 AI 功能故障排查指南

## 🔍 问题现象

笔记页面中的 AI 功能无法使用：
- ✨ AI 改写按钮无响应
- 💬 右侧 AI 助手无法回答问题

## 🎯 根本原因

测试显示 API 端点返回 **401 Unauthorized** 错误，这说明：
- ✅ 后端服务运行正常
- ✅ 路由注册正确
- ✅ 前端代码正确
- ❌ **认证失败** - 用户未登录或登录已过期

## 🔧 解决方案

### 方法 1：重新登录（推荐）

1. 退出当前账号
2. 重新登录
3. 再次尝试使用笔记 AI 功能

### 方法 2：清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. Application → Cookies → localhost:5173
3. 删除所有 cookies
4. 刷新页面并重新登录

### 方法 3：检查登录状态

**打开浏览器开发者工具（F12）→ Console**，运行：

```javascript
fetch('/api/analytics/overview', {credentials: 'include'})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**结果判断**：
- ✅ 返回数据对象 → 已登录，问题可能在别处
- ❌ 返回 `{error: "Unauthorized"}` → 未登录或已过期

---

## 🧪 功能测试步骤

登录后，按以下步骤测试：

### 1. 测试 AI 改写

1. 打开任意笔记
2. 选中一段文本（至少10个字符）
3. 点击工具栏中的 "✨ AI 改写"
4. 选择任意风格（专业化/口语化/简洁版/详细版）
5. 等待改写完成

**预期结果**：
- 显示 "AI 改写中..." 提示
- 文本被改写后的内容替换
- 显示 "改写完成" 成功提示

### 2. 测试 AI 助手

1. 打开任意笔记
2. 点击右上角 "AI助手" 按钮
3. 在弹出面板中输入问题，例如："总结一下这篇笔记"
4. 点击发送

**预期结果**：
- AI 回复出现在对话框中
- 可以继续多轮对话

---

## 🐛 常见错误信息

### Error 401: Unauthorized
**原因**: 未登录或登录已过期
**解决**: 重新登录

### Error 404: Not Found
**原因**: API 路由未正确注册
**解决**: 重启后端服务

### Error 500: Internal Server Error
**原因**: 后端服务异常
**解决**: 查看后端日志 `logs/backend-analytics-source.log`

### "选中的文本太短，至少需要 10 个字符"
**原因**: 改写功能要求文本长度 ≥ 10 字符
**解决**: 选中更长的文本

---

## 🔍 调试信息收集

如果问题仍未解决，请收集以下信息：

### 1. 浏览器控制台错误
打开 F12 → Console 标签，截图所有红色错误信息

### 2. 网络请求详情
1. 打开 F12 → Network 标签
2. 筛选 "Fetch/XHR"
3. 尝试使用 AI 功能
4. 找到 `/api/ai/notes/rewrite` 或 `/api/ai/notes/qa` 请求
5. 查看：
   - Status Code（状态码）
   - Response（响应内容）
   - Headers → Cookie（是否包含 connect.sid）

### 3. 后端日志
```bash
tail -50 logs/backend-analytics-source.log
```

---

## ✅ API 端点状态

| 端点 | 路径 | 状态 | 说明 |
|------|------|------|------|
| AI 改写 | `/api/ai/notes/rewrite` | ✅ 已注册 | 需要登录 |
| AI 问答 | `/api/ai/notes/qa` | ✅ 已注册 | 需要登录 |
| AI 摘要 | `/api/ai/notes/summary` | ✅ 已注册 | 需要登录 |
| AI 大纲 | `/api/ai/notes/outline` | ✅ 已注册 | 需要登录 |
| 任务提取 | `/api/ai/notes/tasks` | ✅ 已注册 | 需要登录 |
| 标签建议 | `/api/ai/notes/suggest-tags` | ✅ 已注册 | 需要登录 |
| 文本扩展 | `/api/ai/notes/expand` | ✅ 已注册 | 需要登录 |

**测试命令**：
```bash
chmod +x test-notes-ai.sh
./test-notes-ai.sh
```

---

## 📋 后续优化建议

### 用户体验改进
- [ ] 登录过期时显示友好提示，引导用户重新登录
- [ ] AI 请求失败时显示具体错误原因
- [ ] 添加 AI 功能使用次数和 token 消耗提示

### 性能优化
- [ ] AI 改写添加请求取消功能（避免重复点击）
- [ ] 缓存常见问题的 AI 回答
- [ ] 支持批量文本改写

---

## 🆘 仍然无法解决？

请提供以下信息以便诊断：

1. **浏览器控制台截图**（F12 → Console）
2. **网络请求截图**（F12 → Network → Fetch/XHR）
3. **后端日志**（`logs/backend-analytics-source.log` 最后50行）
4. **操作步骤**：详细描述您如何触发错误

---

**更新时间**: 2025-10-21 05:22
**文档版本**: 1.0
