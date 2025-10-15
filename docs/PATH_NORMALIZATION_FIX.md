# HTML文件路径规范化修复

## 问题日期
2025-10-15

## 🔴 问题描述

### 用户报告
写网页时报错 500，导致功能无法使用。

### 根本原因
**MCP管理器中的路径规范化代码未生效，因为后端服务器没有重启！**

从日志发现：
```javascript
// ❌ AI仍然使用绝对路径
"path": "D:\\Personal-Chatbox\\simple_page.html"

// ✅ 应该被规范化为相对路径
"path": "simple_page.html"
```

## 🔍 诊断过程

### 1. 初步检查
```bash
# 检查后端日志
Get-Content backend.log -Tail 50

# 发现：没有 "📝 HTML文件路径已规范化" 日志
# 说明：修复代码未执行
```

### 2. 代码验证
```javascript
// 文件：server/services/mcp-manager.cjs
// 代码是正确的！
else if (fileName.endsWith('.html')) {
  params.path = fileName;  // ✅ 规范化为相对路径
  console.log(`[MCP Manager] 📝 HTML文件路径已规范化: "${fileName}"`);
}
```

### 3. 问题定位
**服务器缓存了旧代码，没有加载最新的修复！**

原因：
- 之前修改了 `mcp-manager.cjs` 但没有重启后端
- Node.js 缓存了旧的模块代码
- 导致路径规范化逻辑未生效

## ✅ 解决方案

### 修复步骤

#### 1. 强制重启后端服务器
```powershell
# 停止所有 Node.js 进程
taskkill /F /IM node.exe

# 等待进程完全退出
Start-Sleep -Seconds 3

# 启动后端服务器
cd D:\Personal-Chatbox
node server/index.cjs
```

#### 2. 验证修复生效
```bash
# 检查服务状态
curl http://localhost:3001/api/mcp/services

# 检查日志中的规范化消息
Get-Content backend.log | Select-String "HTML文件路径已规范化"
```

#### 3. 测试HTML文件生成
1. 刷新浏览器（`Ctrl+Shift+R`）
2. 发送测试消息："帮我写一个简单的HTML页"
3. 观察日志输出：
   ```
   [MCP Manager] 📝 HTML文件路径已规范化: "example.html"
   Successfully wrote to example.html
   ```

## 🛡️ 防护机制

### 完整的三层保护

#### 第1层：文件名保护
```javascript
const protectedFiles = ['index.html', 'package.json', 'package-lock.json', 'pnpm-lock.yaml'];
if (protectedFiles.includes(fileName)) {
  params.path = `generated-${fileName}`;
  console.warn(`[MCP Manager] ⚠️ 文件 "${fileName}" 受保护`);
}
```

#### 第2层：路径规范化
```javascript
else if (fileName.endsWith('.html')) {
  params.path = fileName;  // 只保留文件名，移除绝对路径
  console.log(`[MCP Manager] 📝 HTML文件路径已规范化: "${fileName}"`);
}
```

#### 第3层：Vite读取保护
```javascript
// vite.config.js
if (fileName === 'index.html') {
  next();  // 跳过自定义处理，使用应用入口
  return;
}
```

## 📊 修复效果对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| **路径格式** | `D:\Personal-Chatbox\simple_page.html` | `simple_page.html` ✅ |
| **文件可访问性** | ❌ Vite无法服务绝对路径 | ✅ 正常访问 |
| **预览功能** | ❌ 显示"暂无预览内容" | ✅ 正常显示预览 |
| **index.html保护** | ✅ 生效 | ✅ 持续生效 |
| **日志输出** | 无规范化日志 | ✅ 显示规范化日志 |

## 🎯 关键经验教训

### 1. **代码修改后必须重启服务器**
```bash
# ⚠️ 修改 .cjs 文件后
# ❌ 不会自动重载
# ✅ 必须手动重启
```

### 2. **验证修复的正确方法**
```bash
# 不仅要检查代码
# 还要检查日志输出
# 确认代码确实执行了
```

### 3. **Node.js模块缓存问题**
- Node.js会缓存 `require()` 的模块
- `.cjs` 文件修改后不会自动更新
- 需要重启进程才能加载新代码

### 4. **调试技巧**
```javascript
// ✅ 在关键位置添加日志
console.log(`[MCP Manager] 📝 HTML文件路径已规范化: "${fileName}"`);

// ✅ 通过日志确认代码执行
// ❌ 不要只看代码，要看运行时行为
```

## 🧪 测试清单

- [x] 后端服务器成功启动
- [x] MCP文件系统服务加载成功
- [x] 路径规范化代码生效（日志输出）
- [x] HTML文件生成成功
- [x] 文件使用相对路径保存
- [x] Vite可以正常访问生成的HTML
- [x] index.html保护机制正常工作
- [x] 预览功能正常显示

## 📝 相关文件

- `server/services/mcp-manager.cjs` - MCP管理器（路径规范化逻辑）
- `vite.config.js` - Vite配置（读取保护）
- `src/components/chat/CodePreview.jsx` - 预览组件
- `docs/HTML_FILE_GENERATION_BUG_FIX.md` - 之前的index.html覆盖问题修复文档

## 💡 最佳实践

1. **修改后端代码后立即重启**
   ```bash
   taskkill /F /IM node.exe
   node server/index.cjs
   ```

2. **添加调试日志**
   ```javascript
   console.log('[Component] 关键操作: 参数值')
   ```

3. **验证修复生效**
   - 检查日志输出
   - 测试实际功能
   - 确认行为符合预期

4. **文档记录**
   - 记录问题原因
   - 记录解决方案
   - 记录预防措施

---

## ✅ 状态

**已修复** - 2025-10-15

路径规范化功能已正常工作，HTML文件生成功能恢复正常。

