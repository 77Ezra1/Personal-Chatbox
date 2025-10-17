/**
 * Sentry 初始化模块（已禁用）
 * Sentry依赖已移除，此文件提供空实现以保持兼容性
 */

const isDev = import.meta.env.DEV

/**
 * 初始化 Sentry（空实现）
 */
export function initSentry() {
  if (isDev) {
    console.log('[Sentry] Disabled - dependency removed')
  }
}

/**
 * 设置用户上下文（空实现）
 */
export function setSentryUser(user) {
  // No-op
}

/**
 * 手动捕获错误（降级到console.error）
 */
export function captureError(error, context = {}) {
  if (isDev) {
    console.error('[Error Capture]', error, context)
  }
}

/**
 * 手动捕获消息（降级到console）
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (isDev) {
    console.log(`[Message Capture] [${level}]:`, message, context)
  }
}

/**
 * 添加面包屑（空实现）
 */
export function addBreadcrumb(breadcrumb) {
  // No-op
}

/**
 * 简单的 ErrorBoundary 替代组件
 */
import { Component } from 'react'

export class SentryErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (fallback) {
        return fallback({
          error: this.state.error,
          resetError: () => this.setState({ hasError: false, error: null })
        })
      }
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 性能监控（空实现）
 */
export function startTransaction(name, op = 'custom') {
  return null
}

export function startSpan(transaction, name, op = 'custom') {
  return null
}
