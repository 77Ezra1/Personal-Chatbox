#!/bin/bash

# Personal Chatbox - 第一阶段优化自动化脚本
# 用途：自动完成高优先级优化准备工作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查是否在项目根目录
check_project_root() {
    if [ ! -f "package.json" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_header "安装优化依赖"
    
    # 安全存储
    print_info "安装安全存储依赖..."
    pnpm add buffer
    
    # Sentry 错误追踪
    print_info "安装 Sentry..."
    pnpm add @sentry/react @sentry/vite-plugin
    
    # 测试依赖
    print_info "安装测试框架..."
    pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/react-hooks msw
    
    # 性能监控
    print_info "安装性能监控..."
    pnpm add web-vitals
    
    # E2E 测试（可选）
    read -p "是否安装 Playwright E2E 测试？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "安装 Playwright..."
        pnpm add -D @playwright/test
        pnpm exec playwright install
    fi
    
    print_success "所有依赖安装完成"
}

# 创建必要的目录结构
create_directories() {
    print_header "创建目录结构"
    
    mkdir -p src/__tests__/lib
    mkdir -p src/__tests__/hooks
    mkdir -p src/__tests__/components/chat
    mkdir -p tests/e2e
    mkdir -p scripts
    
    print_success "目录结构创建完成"
}

# 创建安全存储模块
create_secure_storage() {
    print_header "创建安全存储模块"
    
    cat > src/lib/secure-storage.js << 'EOF'
/**
 * 安全存储工具 - 使用 Web Crypto API 加密敏感数据
 * 用于 API 密钥等敏感信息的加密存储
 */

const SALT = 'personal-chatbox-v1' // 生产环境应使用随机 salt
const ITERATIONS = 100000

/**
 * 从密码派生加密密钥
 */
async function deriveKey(password) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
export async function encryptData(data, password) {
  const key = await deriveKey(password)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(JSON.stringify(data))
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  
  // 转换为 base64
  const encryptedArray = new Uint8Array(encrypted)
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
  const ivBase64 = btoa(String.fromCharCode(...iv))
  
  return {
    data: encryptedBase64,
    iv: ivBase64
  }
}

/**
 * 解密数据
 */
export async function decryptData(encryptedData, ivBase64, password) {
  const key = await deriveKey(password)
  
  // 从 base64 转换回
  const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )
  
  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(decrypted))
}

/**
 * 安全存储管理器
 */
export class SecureStorage {
  constructor(storageKey = 'secure_data') {
    this.storageKey = storageKey
  }
  
  /**
   * 保存加密数据
   */
  async save(data, password) {
    try {
      const encrypted = await encryptData(data, password)
      localStorage.setItem(this.storageKey, JSON.stringify(encrypted))
      return true
    } catch (error) {
      console.error('Failed to save encrypted data:', error)
      return false
    }
  }
  
  /**
   * 读取并解密数据
   */
  async load(password) {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null
      
      const encrypted = JSON.parse(stored)
      return await decryptData(encrypted.data, encrypted.iv, password)
    } catch (error) {
      console.error('Failed to load encrypted data:', error)
      return null
    }
  }
  
  /**
   * 删除数据
   */
  remove() {
    localStorage.removeItem(this.storageKey)
  }
}

// 导出默认实例
export const secureStorage = new SecureStorage()
EOF
    
    print_success "安全存储模块创建完成"
}

# 创建性能监控模块
create_performance_module() {
    print_header "创建性能监控模块"
    
    cat > src/lib/performance.js << 'EOF'
/**
 * 性能监控工具 - Web Vitals 集成
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'
import { createLogger } from './logger'

const logger = createLogger('Performance')
const isDev = import.meta.env.DEV

/**
 * 发送性能数据到分析服务
 */
function sendToAnalytics({ name, value, id, rating }) {
  const metric = {
    name,
    value: Math.round(value),
    rating,
    id,
    timestamp: Date.now()
  }
  
  logger.debug(`Web Vital: ${name}`, metric)
  
  // 生产环境发送到后端
  if (!isDev) {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true // 确保在页面卸载时也能发送
    }).catch(err => logger.error('Failed to send vitals:', err))
  }
}

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return
  
  logger.log('Initializing performance monitoring...')
  
  onCLS(sendToAnalytics)  // Cumulative Layout Shift
  onFID(sendToAnalytics)  // First Input Delay
  onFCP(sendToAnalytics)  // First Contentful Paint
  onLCP(sendToAnalytics)  // Largest Contentful Paint
  onTTFB(sendToAnalytics) // Time to First Byte
}

/**
 * 自定义性能标记
 */
export function markPerformance(name) {
  if (typeof performance === 'undefined') return
  
  try {
    performance.mark(name)
  } catch (err) {
    logger.error('Failed to mark performance:', err)
  }
}

/**
 * 测量性能指标
 */
export function measurePerformance(name, startMark, endMark) {
  if (typeof performance === 'undefined') return null
  
  try {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    
    logger.debug(`Performance measure: ${name}`, {
      duration: Math.round(measure.duration)
    })
    
    return measure.duration
  } catch (err) {
    logger.error('Performance measure failed:', err)
    return null
  }
}

/**
 * 获取性能报告
 */
export function getPerformanceReport() {
  if (typeof performance === 'undefined') return null
  
  const navigation = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')
  
  return {
    navigation: {
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart)
    },
    paint: {
      firstPaint: Math.round(paint.find(p => p.name === 'first-paint')?.startTime || 0),
      firstContentfulPaint: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0)
    }
  }
}
EOF
    
    print_success "性能监控模块创建完成"
}

# 创建示例测试文件
create_sample_tests() {
    print_header "创建示例测试"
    
    # Logger 测试
    cat > src/__tests__/lib/logger.test.js << 'EOF'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLogger } from '@/lib/logger'

describe('Logger', () => {
  let consoleSpy
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation()
  })
  
  it('should create logger with context', () => {
    const logger = createLogger('TestContext')
    expect(logger.context).toBe('TestContext')
  })
  
  it('should format log messages correctly', () => {
    const logger = createLogger('Test')
    logger.log('test message')
    
    expect(consoleSpy).toHaveBeenCalled()
    const call = consoleSpy.mock.calls[0][0]
    expect(call).toContain('[Test]')
  })
})
EOF
    
    print_success "示例测试创建完成"
}

# 更新 package.json 脚本
update_package_scripts() {
    print_header "更新 package.json 脚本"
    
    print_info "请手动添加以下脚本到 package.json:"
    echo ""
    cat << 'EOF'
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
EOF
    echo ""
    print_warning "请手动编辑 package.json 添加上述脚本"
}

# 创建配置文件
create_config_files() {
    print_header "创建配置文件"
    
    # Vitest 配置（如果不存在）
    if [ ! -f "vitest.config.js" ]; then
        cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
EOF
        print_success "vitest.config.js 创建完成"
    else
        print_info "vitest.config.js 已存在，跳过"
    fi
    
    # Playwright 配置
    if command -v pnpm exec playwright --version &> /dev/null; then
        cat > playwright.config.js << 'EOF'
import { defineConfig, devices } from '@playwright/test'

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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
EOF
        print_success "playwright.config.js 创建完成"
    fi
}

# 生成优化报告
generate_report() {
    print_header "生成优化报告"
    
    cat > OPTIMIZATION_STATUS.md << 'EOF'
# 优化状态报告

## 第一阶段：准备完成 ✅

### 已安装依赖
- ✅ buffer - 安全存储
- ✅ @sentry/react - 错误追踪
- ✅ @testing-library/react - 测试框架
- ✅ web-vitals - 性能监控
- ✅ @playwright/test - E2E 测试（可选）

### 已创建模块
- ✅ src/lib/secure-storage.js - API 密钥加密存储
- ✅ src/lib/performance.js - 性能监控
- ✅ src/__tests__/ - 测试目录结构

### 待完成任务

#### 1. 替换 console 为 logger
```bash
# 查找所有使用 console 的文件
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec grep -l "console\." {} \;

# 手动替换为 logger
```

#### 2. 配置 Sentry
1. 注册 Sentry 账号: https://sentry.io
2. 创建项目并获取 DSN
3. 添加到 .env 文件:
   ```
   VITE_SENTRY_DSN=your_dsn_here
   ```
4. 在 src/main.jsx 中初始化 Sentry

#### 3. 使用安全存储
1. 在 API 密钥配置组件中集成 secure-storage.js
2. 首次使用时提示用户设置加密密码
3. 迁移现有明文密钥到加密存储

#### 4. 编写测试
- 为核心功能编写单元测试
- 创建 E2E 测试场景
- 目标：80% 测试覆盖率

#### 5. 性能监控
1. 在 src/main.jsx 中调用 initPerformanceMonitoring()
2. 创建后端 API 接收性能数据: POST /api/analytics/vitals
3. 在关键操作中使用 markPerformance 和 measurePerformance

### 下一步
查看详细优化指南: PROJECT_OPTIMIZATION_PLAN_V2.md
EOF
    
    print_success "优化报告已生成: OPTIMIZATION_STATUS.md"
}

# 主函数
main() {
    clear
    echo -e "${GREEN}"
    cat << 'EOF'
╔═══════════════════════════════════════════╗
║   Personal Chatbox 优化脚本 v1.0        ║
║   第一阶段：代码质量与安全                ║
╚═══════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_project_root
    
    echo "此脚本将自动完成以下操作："
    echo "  1. 安装必要依赖（Sentry、测试框架、性能监控）"
    echo "  2. 创建目录结构"
    echo "  3. 创建安全存储模块"
    echo "  4. 创建性能监控模块"
    echo "  5. 创建示例测试"
    echo "  6. 生成配置文件"
    echo "  7. 生成优化报告"
    echo ""
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "操作已取消"
        exit 0
    fi
    
    install_dependencies
    create_directories
    create_secure_storage
    create_performance_module
    create_sample_tests
    create_config_files
    update_package_scripts
    generate_report
    
    print_header "完成！"
    print_success "第一阶段优化准备工作已完成"
    echo ""
    print_info "下一步："
    echo "  1. 查看 OPTIMIZATION_STATUS.md 了解待办事项"
    echo "  2. 查看 PROJECT_OPTIMIZATION_PLAN_V2.md 了解完整计划"
    echo "  3. 手动完成 console 替换和 Sentry 配置"
    echo "  4. 开始编写测试用例"
    echo ""
    print_info "运行测试："
    echo "  pnpm test          # 运行单元测试"
    echo "  pnpm test:coverage # 查看测试覆盖率"
    echo "  pnpm test:e2e      # 运行 E2E 测试（如果已安装）"
    echo ""
}

# 运行主函数
main
