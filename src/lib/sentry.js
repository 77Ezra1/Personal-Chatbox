/**
 * Sentry 初始化模块
 * 用于生产环境的错误追踪和性能监控
 */

import * as Sentry from '@sentry/react'

const isDev = import.meta.env.DEV

/**
 * 初始化 Sentry
 */
export function initSentry() {
  // 只在生产环境启用
  if (isDev) {
    console.log('[Sentry] Development mode - Sentry disabled')
    return
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN
  
  if (!dsn) {
    console.warn('[Sentry] No DSN provided - Sentry disabled')
    return
  }

  try {
    Sentry.init({
      dsn,
      
      // 集成配置
      integrations: [
        // 浏览器追踪
        Sentry.browserTracingIntegration({
          // 追踪所有路由变化
          tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        }),
        
        // 会话回放（错误时录制）
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // 性能监控采样率
      tracesSampleRate: 0.1, // 10% 的事务进行追踪
      
      // 会话回放采样率
      replaysSessionSampleRate: 0.1, // 10% 的正常会话录制
      replaysOnErrorSampleRate: 1.0,  // 100% 的错误会话录制

      // 环境标识
      environment: import.meta.env.MODE,
      
      // 发布版本
      release: import.meta.env.VITE_APP_VERSION || 'development',

      // 数据过滤 - 移除敏感信息
      beforeSend(event, hint) {
        // 移除敏感的请求头
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['Cookie']
        }

        // 移除敏感的 localStorage 数据
        if (event.contexts?.localStorage) {
          const sensitiveKeys = ['apiKeys', 'api_keys', 'token', 'password']
          Object.keys(event.contexts.localStorage).forEach(key => {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
              event.contexts.localStorage[key] = '[FILTERED]'
            }
          })
        }

        // 在开发环境也可以看到错误（用于调试）
        if (isDev) {
          console.error('[Sentry] Would send error:', event)
          console.error('[Sentry] Original error:', hint.originalException)
        }

        return event
      },

      // 忽略特定错误
      ignoreErrors: [
        // 浏览器扩展错误
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'http://tt.epicplay.com',
        "Can't find variable: ZiteReader",
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        'conduitPage',
        
        // 网络错误（通常是用户网络问题）
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        
        // 取消的请求
        'AbortError',
        'Request aborted',
      ],

      // 忽略特定 URL
      denyUrls: [
        // Chrome 扩展
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        // Firefox 扩展
        /^moz-extension:\/\//i,
        // Safari 扩展
        /^safari-extension:\/\//i,
      ],
    })

    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error)
  }
}

/**
 * 设置用户上下文
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null)
    return
  }

  Sentry.setUser({
    id: user.id,
    username: user.username,
    // 不要发送敏感信息如 email
  })
}

/**
 * 手动捕获错误
 */
export function captureError(error, context = {}) {
  if (isDev) {
    console.error('[Sentry] Would capture error:', error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * 手动捕获消息
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (isDev) {
    console.log(`[Sentry] Would capture message [${level}]:`, message, context)
    return
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * 添加面包屑（用户操作记录）
 */
export function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb)
}

/**
 * 创建 Sentry 的 ErrorBoundary 组件
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/**
 * 性能监控 - 开始事务
 */
export function startTransaction(name, op = 'custom') {
  if (isDev) return null
  
  return Sentry.startTransaction({
    name,
    op,
  })
}

/**
 * 性能监控 - 创建 span
 */
export function startSpan(transaction, name, op = 'custom') {
  if (!transaction) return null
  
  return transaction.startChild({
    op,
    description: name,
  })
}
