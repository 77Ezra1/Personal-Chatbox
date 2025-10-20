# 富文本工具栏功能指南

## 功能概述

笔记编辑器现已支持富文本工具栏，选中文本时自动显示，提供以下功能：

### ✨ AI 改写功能
选中文本后，可使用 AI 对文本进行风格改写：
- **💼 专业化**: 将文本改写为更正式、专业的风格
- **💬 口语化**: 将文本改写为更口语、易懂的风格
- **✂️ 简洁版**: 将文本精简，去除冗余内容
- **📝 详细版**: 将文本扩展，增加细节说明

### 🎨 文本格式化
- **B** - 加粗
- **I** - 斜体
- **S** - 删除线
- **</>** - 代码

### 📋 列表和引用
- 无序列表
- 有序列表
- 引用块

### 📐 标题样式
- 正文
- 标题 1-4

### 📋 复制功能
快速复制选中的文本到剪贴板

---

## 使用方法

### 1. 打开笔记页面
访问: http://localhost:5173/notes

### 2. 创建或打开笔记
点击"新建笔记"或从列表中选择现有笔记

### 3. 选中文本
在编辑器中**用鼠标拖拽选中**任意文本

### 4. 工具栏自动显示
工具栏会自动出现在选中文本的上方

### 5. 使用功能
- **AI 改写**: 点击"✨ AI 改写"，选择风格（专业化/口语化/简洁版/详细版）
- **格式化**: 点击对应按钮（B/I/S等）
- **标题**: 点击"T ▼"，选择标题级别
- **复制**: 点击复制图标

---

## 技术实现

### 前端组件
- **TipTapToolbar.jsx**: 富文本工具栏组件
  - 使用原生选区监听（`editor.on('selectionUpdate')`）
  - 无需 BubbleMenu 外部依赖
  - 自动定位到选中文本上方

### 后端 API
- **POST /api/ai/notes/rewrite**
  - 请求体: `{ text: string, style: 'professional'|'casual'|'concise'|'detailed' }`
  - 响应: `{ success: true, text: string, style: string }`

### 样式
- **RichTextToolbar.css**: 工具栏样式
  - 渐变动画效果
  - 下拉菜单动画
  - 响应式设计

---

## 测试清单

### ✅ 基础功能测试
- [ ] 选中文本后工具栏自动显示
- [ ] 取消选中后工具栏自动隐藏
- [ ] 工具栏定位在选中文本上方居中

### ✅ AI 改写测试
- [ ] 点击"✨ AI 改写"显示下拉菜单
- [ ] 测试"专业化"风格改写
- [ ] 测试"口语化"风格改写
- [ ] 测试"简洁版"风格改写
- [ ] 测试"详细版"风格改写
- [ ] 改写完成后文本正确替换
- [ ] 显示改写进度提示

### ✅ 格式化测试
- [ ] 加粗功能（Ctrl+B）
- [ ] 斜体功能（Ctrl+I）
- [ ] 删除线功能
- [ ] 代码格式功能
- [ ] 无序列表功能
- [ ] 有序列表功能
- [ ] 引用功能

### ✅ 标题测试
- [ ] 点击"T ▼"显示标题菜单
- [ ] 切换为标题 1
- [ ] 切换为标题 2
- [ ] 切换为标题 3
- [ ] 切换为标题 4
- [ ] 切换回正文

### ✅ 其他功能测试
- [ ] 复制功能正常
- [ ] 点击工具栏外部关闭下拉菜单
- [ ] AI 改写时禁用操作
- [ ] 错误提示正确显示

---

## 常见问题

### Q: 工具栏不显示？
**A:** 请确保：
1. 浏览器已刷新（Cmd+Shift+R / Ctrl+Shift+F5）
2. 前端服务正在运行（http://localhost:5173）
3. 已经选中了文本（而不只是点击）

### Q: AI 改写失败？
**A:** 检查：
1. 后端服务是否运行（http://localhost:3001）
2. 是否已登录（需要 cookie 认证）
3. 选中的文本长度是否大于 10 个字符
4. 浏览器控制台是否有错误信息

### Q: 格式化按钮点击无反应？
**A:**
1. 确认文本仍处于选中状态
2. 查看按钮是否已激活（蓝色高亮）
3. 尝试重新选中文本

---

## 开发信息

### 文件位置
```
src/components/notes/
├── TipTapToolbar.jsx          # 工具栏组件（主要实现）
├── RichTextToolbar.css        # 工具栏样式
├── MarkdownLikeEditor.jsx     # 编辑器组件（集成工具栏）
└── AIAssistantPanel.jsx       # AI 助手面板（右侧，独立功能）

server/routes/
└── ai-notes.cjs               # AI 笔记相关 API

server/services/
└── notesAIService.cjs         # AI 笔记服务
```

### 关键代码
```javascript
// 选区监听
editor.on('selectionUpdate', handleSelectionChange);

// 获取选区位置
const { view } = editor;
const start = view.coordsAtPos(from);
const end = view.coordsAtPos(to);

// AI 改写 API 调用
fetch('/api/ai/notes/rewrite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ text: selectedText, style })
})
```

---

## 更新日志

### 2025-10-21
- ✅ 创建 TipTapToolbar 组件
- ✅ 实现原生选区监听（无 BubbleMenu 依赖）
- ✅ 集成 AI 改写功能（4种风格）
- ✅ 添加格式化按钮（B/I/S/代码）
- ✅ 添加列表和引用功能
- ✅ 添加标题样式选择
- ✅ 添加复制功能
- ✅ 修复 API 字段匹配问题（text vs rewrittenText）
- ✅ HMR 热更新支持

---

## 下一步优化建议

### 功能增强
- [ ] 添加颜色选择器（文字颜色/背景色）
- [ ] 添加链接插入功能
- [ ] 添加表格插入功能
- [ ] 支持快捷键提示

### 性能优化
- [ ] 工具栏位置防抖（避免频繁重定位）
- [ ] AI 改写请求取消（切换选区时）

### 用户体验
- [ ] 添加工具栏主题切换（亮色/暗色）
- [ ] 添加工具栏位置调整（上方/下方）
- [ ] 改写历史记录（撤销改写）

---

**祝使用愉快！** 🎉

如有问题，请检查浏览器控制台日志或查看服务器日志：
- 前端: `logs/frontend-toolbar-v2.log`
- 后端: `logs/backend-conv-fix.log`
