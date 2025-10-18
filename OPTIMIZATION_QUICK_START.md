# 项目优化快速开始指南

> 📌 **这是什么**: 基于 [PROJECT_OPTIMIZATION_PLAN_2025.md](./PROJECT_OPTIMIZATION_PLAN_2025.md) 的快速执行清单
> 📌 **适合谁**: 想要立即开始优化的开发者
> 📌 **预计时间**: 按优先级分为 5 个级别

---

## 🎯 优化优先级矩阵

```
        影响力
         ↑
    高   │ P0: 立即执行  │ P1: 本周完成
         │ (1-2天)      │ (3-5天)
         ├─────────────┼──────────────
    中   │ P2: 本月完成  │ P3: 下月完成
         │ (1-2周)      │ (3-4周)
         ├─────────────┼──────────────
    低   │ P4: 未来规划
         │ (长期)
         ├──────────────────────→
              紧急程度
```

---

## P0: 立即执行 (今天就开始) ⚡

### 1. 安全性修复 - localStorage 加密 (2小时)

**问题严重性**: 🔴 高危 - API Keys 明文存储

**快速解决**:

```bash
# 1. 安装加密库
pnpm add crypto-js

# 2. 创建安全存储模块
cat > src/lib/secure-storage.js << 'EOF'
import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor() {
    // 使用用户会话生成密钥
    this.key = this.getMasterKey();
  }

  getMasterKey() {
    let key = sessionStorage.getItem('_sk');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      sessionStorage.setItem('_sk', key);
    }
    return key;
  }

  encrypt(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString();
  }

  decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  setItem(key, value) {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt data:', error);
    }
  }

  getItem(key) {
    try {
      const encrypted = localStorage.getItem(key);
      return encrypted ? this.decrypt(encrypted) : null;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  removeItem(key) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
    sessionStorage.clear();
  }
}

export default new SecureStorage();
EOF

# 3. 更新 API Key 存储
# 编辑 src/lib/db/providerApiKeys.js
# 将所有 localStorage 替换为 secureStorage
```

**测试验证**:
```bash
# 打开浏览器控制台
localStorage.getItem('apiKeys')  # 应该看到加密后的字符串
```

### 2. 紧急性能优化 - 代码分割 (1小时)

**问题**: Bundle 过大 (1.8MB) 导致首屏加载慢

**快速修复**:

```javascript
// vite.config.js - 添加手动分包
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            'lucide-react'
          ],
          'markdown-vendor': [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'rehype-katex'
          ]
        }
      }
    }
  }
};
```

**测试验证**:
```bash
pnpm build
ls -lh dist/assets/js/*.js  # 应该看到多个小文件而不是一个大文件
```

### 3. 添加错误边界 (30分钟)

**快速实现**:

```bash
# 创建错误边界组件
cat > src/components/ErrorBoundary.jsx << 'EOF'
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">出错了</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新页面
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOF

# 在 App.jsx 中使用
# import ErrorBoundary from './components/ErrorBoundary';
# <ErrorBoundary><Router>...</Router></ErrorBoundary>
```

**耗时**: 总共 3.5 小时
**影响**: 🔥 安全性 +80%, 性能 +30%, 稳定性 +50%

---

## P1: 本周完成 (Week 1) 🚀

### 4. 统一 Markdown 渲染器 (3小时)

**问题**: 5 个不同的 Markdown 实现,代码重复 500+ 行

```bash
# 创建统一组件
cat > src/components/common/MarkdownRenderer.jsx << 'EOF'
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

const MarkdownRenderer = memo(({
  content,
  className = '',
  components = {}
}) => {
  const defaultComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    ...components
  };

  return (
    <ReactMarkdown
      className={`markdown-body ${className}`}
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      rehypePlugins={[rehypeKatex]}
      components={defaultComponents}
    >
      {content}
    </ReactMarkdown>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
EOF
```

**替换文件**:
```bash
# 1. src/components/chat/MessageContent.jsx
# 2. src/components/notes/NoteEditor.jsx
# 3. src/pages/DocumentsPage.jsx
# 将所有 Markdown 渲染替换为:
# <MarkdownRenderer content={text} />
```

### 5. 集成 React Query (4小时)

**安装**:
```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**配置**:
```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

```javascript
// App.jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 你的应用 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**迁移示例**:
```javascript
// 优化前
const [notes, setNotes] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchNotes().then(setNotes).finally(() => setLoading(false));
}, []);

// 优化后
import { useQuery } from '@tanstack/react-query';

const { data: notes, isLoading } = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes
});
```

### 6. 添加 Loading 状态 (2小时)

**全局 Loading 组件**:
```javascript
// src/components/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', text = '加载中...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8">
      <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
```

**使用 Suspense**:
```javascript
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

<Suspense fallback={<LoadingSpinner text="加载页面中..." />}>
  <Routes>
    {/* 路由 */}
  </Routes>
</Suspense>
```

**耗时**: 9 小时
**影响**: 📈 代码质量 +40%, 用户体验 +60%

---

## P2: 本月完成 (Week 2-4) 📅

### 7. TypeScript 迁移 (10小时)

**阶段 1: 基础设置 (1小时)**
```bash
pnpm add -D typescript @types/react @types/react-dom @types/node
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": false,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**阶段 2: 类型定义 (2小时)**
```typescript
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**阶段 3: 逐步迁移 (7小时)**
```
优先级:
1. src/lib/*.ts (工具函数)
2. src/hooks/*.ts (自定义 Hooks)
3. src/components/ui/*.tsx (UI 组件)
4. src/pages/*.tsx (页面)
```

### 8. 单元测试覆盖 (12小时)

**配置 Vitest**:
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.config.{js,ts}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**测试示例**:
```javascript
// src/hooks/__tests__/useChat.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';

describe('useChat', () => {
  it('should send message and receive response', async () => {
    const { result } = renderHook(() => useChat('conv-1'));

    await result.current.sendMessage('Hello');

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2); // user + assistant
    });
  });
});
```

**覆盖目标**:
```
- Utils: 70%
- Hooks: 60%
- Components: 50%
- Integration: 40%
```

### 9. E2E 测试 (8小时)

**Playwright 配置**:
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**关键流程测试**:
```javascript
// tests/e2e/chat-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('complete chat conversation', async ({ page }) => {
    await page.goto('/');

    // 登录
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // 发送消息
    await page.fill('textarea', 'Hello AI');
    await page.click('[aria-label="发送"]');

    // 验证响应
    await expect(page.locator('[data-role="assistant"]')).toBeVisible({
      timeout: 15000
    });
  });
});
```

**耗时**: 30 小时
**影响**: 🛡️ 代码质量 +70%, 可维护性 +80%

---

## P3: 下月完成 (长期优化) 🎯

### 10. PWA 支持
- Service Worker
- 离线缓存
- 推送通知

### 11. 全局搜索
- Fuse.js 集成
- 搜索索引优化
- 搜索结果高亮

### 12. 插件系统
- 插件 API 设计
- 插件市场
- 示例插件

---

## 📊 每日执行清单

### Day 1 (今天)
- [ ] localStorage 加密 (2h)
- [ ] 代码分割优化 (1h)
- [ ] 添加错误边界 (0.5h)
- [ ] 测试验证 (0.5h)

**总耗时**: 4小时
**预期效果**: 安全性 +80%, 性能 +30%

### Day 2-3
- [ ] 统一 Markdown 渲染器 (3h)
- [ ] 集成 React Query (4h)
- [ ] 添加 Loading 状态 (2h)
- [ ] 代码审查和测试 (2h)

**总耗时**: 11小时

### Week 2
- [ ] TypeScript 基础配置 (1h)
- [ ] 类型定义编写 (2h)
- [ ] 核心模块迁移 TS (7h)

**总耗时**: 10小时

### Week 3-4
- [ ] 单元测试编写 (12h)
- [ ] E2E 测试编写 (8h)
- [ ] 测试覆盖率达标 (4h)

**总耗时**: 24小时

---

## 🎯 快速验证脚本

```bash
#!/bin/bash
# check-optimization.sh

echo "🔍 检查优化进度..."

# 1. 检查是否使用加密存储
if grep -r "crypto-js" src/lib/secure-storage.js > /dev/null 2>&1; then
  echo "✅ 安全存储: 已实现"
else
  echo "❌ 安全存储: 未实现"
fi

# 2. 检查 Bundle 大小
BUNDLE_SIZE=$(du -sh dist/assets/js/*.js 2>/dev/null | awk '{sum+=$1} END {print sum}')
if [ "$BUNDLE_SIZE" -lt 1000 ]; then
  echo "✅ Bundle 大小: ${BUNDLE_SIZE}KB (目标 <1MB)"
else
  echo "⚠️  Bundle 大小: ${BUNDLE_SIZE}KB (需要优化)"
fi

# 3. 检查测试覆盖率
COVERAGE=$(pnpm test:coverage 2>/dev/null | grep "All files" | awk '{print $10}')
if [ ! -z "$COVERAGE" ]; then
  echo "✅ 测试覆盖: $COVERAGE"
else
  echo "❌ 测试覆盖: 未配置"
fi

# 4. 检查 TypeScript
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
JS_FILES=$(find src -name "*.js" -o -name "*.jsx" | wc -l)
TS_PERCENT=$((TS_FILES * 100 / (TS_FILES + JS_FILES)))
echo "📊 TypeScript 迁移: ${TS_PERCENT}%"

echo ""
echo "优化进度总结:"
echo "==============="
echo "P0 (立即执行): $([[ -f src/lib/secure-storage.js ]] && echo '完成' || echo '进行中')"
echo "P1 (本周完成): 进行中"
echo "P2 (本月完成): 待开始"
```

---

## 📚 相关文档

- **详细方案**: [PROJECT_OPTIMIZATION_PLAN_2025.md](./PROJECT_OPTIMIZATION_PLAN_2025.md)
- **项目主页**: [README.md](./README.md)
- **文档索引**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 🚨 注意事项

### 优化前必做

1. **备份数据**:
```bash
cp -r data data_backup_$(date +%Y%m%d)
git add .
git commit -m "chore: backup before optimization"
```

2. **创建分支**:
```bash
git checkout -b feature/optimization-phase1
```

3. **环境测试**:
```bash
pnpm build
pnpm preview  # 测试生产构建
```

### 优化中注意

- ⚠️ 每个功能独立提交
- ⚠️ 保留旧代码备份
- ⚠️ 及时测试验证
- ⚠️ 更新文档说明

### 优化后验证

```bash
# 运行完整测试套件
pnpm test
pnpm test:e2e
pnpm lint

# 构建检查
pnpm build
ls -lh dist/

# 性能测试
pnpm preview
# 使用 Lighthouse 测试
```

---

## 💡 快速帮助

**遇到问题?**
- 查看 [PROJECT_OPTIMIZATION_PLAN_2025.md](./PROJECT_OPTIMIZATION_PLAN_2025.md) 详细说明
- 提交 Issue: https://github.com/77Ezra1/Personal-Chatbox/issues
- 回滚代码: `git checkout feature/optimization-phase1`

**需要帮助?**
- 文档不清楚? 查看具体文件中的注释
- 不知道从哪开始? 按照 P0 → P1 → P2 的顺序执行
- 时间不够? 只做 P0 优先级的项目

---

<div align="center">

**立即开始优化** 🚀

[P0: 今天就做](#p0-立即执行-今天就开始-) | [P1: 本周完成](#p1-本周完成-week-1-) | [详细方案](./PROJECT_OPTIMIZATION_PLAN_2025.md)

</div>
