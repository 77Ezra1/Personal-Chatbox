/**
 * 懒加载组件配置
 * 使用React.lazy实现代码分割，提升首屏加载性能
 */

import { lazy } from 'react'

/**
 * 设置组件懒加载
 * 带有加载延迟和错误重试机制
 */
const lazyWithRetry = (componentImport, retries = 3, interval = 1000) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attemptNumber) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (attemptNumber >= retries) {
              reject(error)
              return
            }

            console.warn(
              `Failed to load component (attempt ${attemptNumber}/${retries}). Retrying...`,
              error
            )

            setTimeout(() => {
              attemptImport(attemptNumber + 1)
            }, interval)
          })
      }

      attemptImport(1)
    })
  })
}

// ========== 聊天相关组件 ==========
export const ChatInterface = lazyWithRetry(() =>
  import('../components/chat/ChatInterface')
)

export const MessageList = lazyWithRetry(() =>
  import('../components/chat/MessageList')
)

export const ChatInput = lazyWithRetry(() =>
  import('../components/chat/ChatInput')
)

export const AttachmentPreview = lazyWithRetry(() =>
  import('../components/chat/AttachmentPreview')
)

// ========== 配置相关组件 ==========
export const ConfigPanel = lazyWithRetry(() =>
  import('../components/config/ConfigPanel')
)

export const SystemPromptConfig = lazyWithRetry(() =>
  import('../components/config/SystemPromptConfig')
)

export const TokenInfoDialog = lazyWithRetry(() =>
  import('../components/config/TokenInfoDialog')
)

// ========== MCP服务组件 ==========
export const MCPServiceList = lazyWithRetry(() =>
  import('../components/mcp/MCPServiceList')
)

export const MCPServiceConfig = lazyWithRetry(() =>
  import('../components/mcp/MCPServiceConfig')
)

// ========== 页面组件 ==========
export const SettingsPage = lazyWithRetry(() =>
  import('../components/settings/SettingsPage')
)

export const AnalyticsPage = lazyWithRetry(() =>
  import('../pages/AnalyticsPage')
)

export const KnowledgeBasePage = lazyWithRetry(() =>
  import('../pages/KnowledgeBasePage')
)

export const PersonasPage = lazyWithRetry(() =>
  import('../pages/PersonasPage')
)

export const WorkflowsPage = lazyWithRetry(() =>
  import('../pages/WorkflowsPage')
)

export const TemplateMarketplacePage = lazyWithRetry(() =>
  import('../pages/TemplateMarketplacePage')
)

export const DocumentsPage = lazyWithRetry(() =>
  import('../pages/DocumentsPage')
)

// ========== UI组件（重量级） ==========
export const CodeEditor = lazyWithRetry(() =>
  import('../components/ui/CodeEditor')
)

export const MarkdownRenderer = lazyWithRetry(() =>
  import('../components/ui/MarkdownRenderer')
)

export const ChartComponent = lazyWithRetry(() =>
  import('../components/ui/ChartComponent')
)

/**
 * 预加载组件
 * 在用户可能需要之前提前加载组件
 */
export const preloadComponent = (component) => {
  if (component && component.preload) {
    component.preload()
  }
}

/**
 * 预加载关键组件
 * 在应用空闲时预加载
 */
export const preloadCriticalComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(ConfigPanel)
      preloadComponent(MCPServiceList)
    }, { timeout: 2000 })
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      preloadComponent(ConfigPanel)
      preloadComponent(MCPServiceList)
    }, 1000)
  }
}

/**
 * 组件加载状态包装器
 */
export const componentLoadingState = {
  loaded: new Set(),
  loading: new Set(),

  markLoaded(componentName) {
    this.loading.delete(componentName)
    this.loaded.add(componentName)
  },

  markLoading(componentName) {
    this.loading.add(componentName)
  },

  isLoaded(componentName) {
    return this.loaded.has(componentName)
  },

  isLoading(componentName) {
    return this.loading.has(componentName)
  }
}
