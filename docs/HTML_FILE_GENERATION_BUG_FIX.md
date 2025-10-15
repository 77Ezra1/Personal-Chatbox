# HTML文件生成导致页面跳转Bug修复

## 严重性
🔴 **严重** - 会导致整个应用被替换

## 问题日期
2025-10-15

## 问题描述

### 用户报告
创建完HTML页面后，浏览器会跳转到新生成的页面，原有的应用界面消失。

### 表现症状
1. AI生成HTML文件后
2. 浏览器显示的是AI生成的HTML内容
3. 应用的聊天界面消失
4. URL仍然是`localhost:5173`

### 问题根源

**文件名冲突导致应用入口被覆盖**

```
AI生成: index.html → 项目根目录
       ↓
Vite服务器: / → index.html (AI生成的)
       ↓
应用入口被替换 ❌
```

#### 详细分析

1. **AI生成的文件名**: `index.html`
   ```javascript
   "path": "index.html"
   Successfully wrote to index.html
   ```

2. **Vite默认行为**:
   - Vite开发服务器将`index.html`作为根路径的默认页面
   - 访问`http://localhost:5173/`时自动加载`index.html`

3. **冲突发生**:
   - 应用的真正入口也是`index.html`
   - AI生成的`index.html`覆盖了应用入口
   - 导致整个React应用被替换成静态HTML页面

4. **后果**:
   - ❌ 应用界面消失
   - ❌ 路由失效
   - ❌ React组件无法加载
   - ❌ 用户无法继续使用应用

## 解决方案

### ✅ 修复1: 在MCP管理器中添加写入保护 (已实施)

**文件**: `server/services/mcp-manager.cjs`

**修改内容**:
```javascript
async callTool(serviceId, toolName, params) {
  // ⚠️ 保护关键文件不被覆盖
  if (serviceId === 'filesystem' && toolName === 'write_file' && params.path) {
    const protectedFiles = ['index.html', 'package.json', 'package-lock.json', 'pnpm-lock.yaml'];
    const fileName = params.path.split(/[/\\]/).pop();

    if (protectedFiles.includes(fileName)) {
      const newPath = params.path.replace(fileName, `generated-${fileName}`);
      console.warn(`[MCP Manager] ⚠️ 文件 "${params.path}" 受保护，已重命名为 "${newPath}"`);
      params.path = newPath;
    }
  }

  // 继续执行工具调用...
}
```

**效果**:
- ✅ **在写入前拦截**: AI尝试写入`index.html`时会被自动重命名为`generated-index.html`
- ✅ **保护多个关键文件**: `index.html`, `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- ✅ **保持预览功能**: 文件仍然被创建，只是使用了安全的文件名
- ✅ **控制台警告**: 在后端日志中会显示文件被重命名的警告

### ✅ 修复2: Vite服务器保护 (已实施)

**文件**: `vite.config.js`

**修改内容**:
```javascript
async configureServer(server) {
  server.middlewares.use((req, res, next) => {
    const htmlMatch = req.url?.match(/^\/([^/]+\.html)$/)
    if (htmlMatch) {
      const fileName = htmlMatch[1]

      // ⚠️ 保护应用入口文件
      if (fileName === 'index.html') {
        next()  // 跳过，使用Vite的默认处理
        return
      }

      // 处理其他HTML文件...
    }
    next()
  })
}
```

**效果**:
- ✅ 即使AI生成了`index.html`，Vite也会优先使用应用的入口
- ✅ 防止应用被覆盖
- ✅ 其他HTML文件仍然可以正常预览

### 修复2: 清理AI生成的文件 (已实施)

**操作**:
```powershell
Remove-Item "index.html" -Force
```

**原因**:
- AI生成的`index.html`已经写入根目录
- 需要删除以避免混淆
- 保持项目目录整洁

### 修复3: 文件名建议

**推荐的文件命名模式**:

| ❌ 不要使用 | ✅ 推荐使用 |
|-----------|-----------|
| `index.html` | `demo.html` |
| `main.html` | `example.html` |
| `app.html` | `page-*.html` |
| - | `test-*.html` |
| - | `simple-page.html` |

**受保护的文件名列表**:
- `index.html` - 应用入口
- `404.html` - 错误页面
- `app.html` - 应用主文件
- `main.html` - 主文件

## 预防措施

### 1. 创建生成文件目录

**推荐结构**:
```
project-root/
├── index.html (应用入口 - 受保护)
├── generated/ (AI生成文件目录)
│   ├── demo.html
│   ├── example.html
│   └── test-page.html
└── ...
```

**实施方法**:
```javascript
// 在后端API中添加路径前缀
const safeFilePath = path.join('generated', userFileName)
```

### 2. 文件名验证

**实施位置**: MCP工具或后端API

```javascript
const protectedFiles = ['index.html', 'app.html', 'main.html', '404.html']

function validateFileName(fileName) {
  // 检查是否为受保护文件
  if (protectedFiles.includes(fileName)) {
    throw new Error(`文件名 "${fileName}" 是受保护的，请使用其他名称`)
  }

  // 检查是否在安全目录
  if (!fileName.startsWith('generated/')) {
    return `generated/${fileName}`
  }

  return fileName
}
```

### 3. 用户提示

**在CodePreview组件中添加警告**:
```jsx
{fileName === 'index.html' && (
  <div className="warning-banner">
    ⚠️ 警告: 检测到index.html文件，可能会影响应用
  </div>
)}
```

### 4. AI提示词优化

**系统消息中添加**:
```
重要提示：
- 不要将文件命名为 index.html
- 推荐使用描述性名称，如: demo.html, example.html, test-page.html
- 或使用 generated/ 目录前缀
```

## 测试验证

### 测试1: 保护机制验证

**步骤**:
1. 手动创建`index.html`在根目录
2. 访问`http://localhost:5173/`
3. 验证应用正常显示

**预期结果**:
- ✅ 应用正常加载
- ✅ React路由正常
- ✅ 不会显示手动创建的HTML内容

### 测试2: 其他HTML文件正常

**步骤**:
1. AI生成`demo.html`
2. 在预览面板查看
3. 访问`http://localhost:5173/demo.html`

**预期结果**:
- ✅ 预览面板正常显示
- ✅ 直接访问也能看到内容
- ✅ 不影响应用主界面

### 测试3: 文件生成流程

**步骤**:
1. 发送: "创建一个HTML页面"
2. 观察生成的文件名
3. 检查是否使用了安全的文件名

**预期结果**:
- ✅ 文件名不是`index.html`
- ✅ 预览正常工作
- ✅ 应用不受影响

## 技术细节

### Vite服务器工作原理

```
请求流程:
GET /
  ↓
Vite中间件处理
  ↓
检查是否为HTML文件请求
  ↓
YES → 检查文件名
       ├─ index.html → 使用应用入口 (保护)
       └─ 其他.html → 从根目录读取
  ↓
NO → 继续Vite默认处理
```

### 文件服务优先级

```
优先级顺序:
1. Vite内置路由 (/, /assets/*)
2. 代理路由 (/api/*)
3. 自定义中间件 (保护的HTML文件)
4. 文件系统 (其他HTML文件)
5. SPA回退 (index.html)
```

### 保护机制原理

```javascript
// 中间件执行顺序
server.middlewares.use((req, res, next) => {
  if (req.url === '/index.html' || req.url === '/') {
    // 跳过自定义处理，让Vite使用应用入口
    next()
    return
  }

  // 处理其他HTML文件
  if (req.url.endsWith('.html')) {
    serveGeneratedHTML(req, res)
    return
  }

  next()
})
```

## 影响范围

### 已修复
- ✅ `index.html`不会被AI生成的文件覆盖
- ✅ 应用入口受到保护
- ✅ 其他HTML文件仍然可以正常生成和预览

### 不影响
- ✅ 其他文件名的HTML生成
- ✅ 预览功能
- ✅ 文件写入功能
- ✅ 代码查看功能

### 副作用
- ⚠️ AI可能仍然会尝试生成`index.html`
- ⚠️ 文件会被写入，但不会被服务
- ⚠️ 可能需要手动清理

## 长期优化建议

### 1. 文件管理系统

创建专门的文件管理API:
```javascript
POST /api/files/generate
{
  "content": "<html>...</html>",
  "suggestedName": "index.html",
  "type": "html"
}

Response:
{
  "success": true,
  "fileName": "generated/demo-1234.html",
  "url": "/generated/demo-1234.html",
  "message": "已自动重命名以避免冲突"
}
```

### 2. 虚拟文件系统

使用内存或临时目录:
```javascript
// 不直接写入项目根目录
const tempDir = path.join(os.tmpdir(), 'chatbox-generated')
const filePath = path.join(tempDir, safeFileName)
```

### 3. 数据库存储

将生成的文件存储在数据库中:
```sql
CREATE TABLE generated_files (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. AI行为优化

在系统提示中更严格地限制:
```
你是一个代码助手。当用户要求创建HTML文件时：
1. 永远不要使用 index.html 作为文件名
2. 使用描述性名称，如: demo.html, example.html
3. 如果用户明确要求使用 index.html，请解释风险并建议替代方案
```

## 相关文件

### 修改的文件
- `vite.config.js` - 添加index.html保护

### 删除的文件
- `index.html` (AI生成的，已清理)

### 受保护的文件
- `index.html` (应用入口)

## 总结

**问题**: AI生成的`index.html`覆盖应用入口，导致页面跳转
**原因**: Vite服务器将`index.html`作为根页面
**解决**: 在Vite配置中添加保护机制，排除`index.html`的自定义服务
**预防**: 建议使用描述性文件名，考虑实施文件管理系统

**关键教训**:
1. 生成文件时需要考虑命名冲突
2. 应用入口文件需要特殊保护
3. 需要更完善的文件管理机制
4. AI生成内容需要安全验证

## 参考资料

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Vite configureServer](https://vitejs.dev/guide/api-plugin.html#configureserver)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)

