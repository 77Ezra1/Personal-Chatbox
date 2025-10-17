/**
 * 性能监控工具（简化版）
 * web-vitals 依赖已移除，使用原生 Performance API
 */

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

  logger.debug(`Performance Metric: ${name}`, metric)

  // 生产环境可以发送到后端（如果需要）
  if (!isDev) {
    // 暂时注释掉，因为 /api/analytics 路由已禁用
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    //   keepalive: true
    // }).catch(err => logger.error('Failed to send vitals:', err))
  }
}

/**
 * 初始化性能监控（简化版）
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return

  logger.log('Performance monitoring initialized (native API)')

  // 使用原生 PerformanceObserver 监控关键指标
  if ('PerformanceObserver' in window) {
    try {
      // 监控 Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        sendToAnalytics({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          id: `v1-${Date.now()}-${Math.random()}`,
          rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor'
        })
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // 监控 First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          sendToAnalytics({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            id: `v1-${Date.now()}-${Math.random()}`,
            rating: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor'
          })
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })

      // 监控 Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        sendToAnalytics({
          name: 'CLS',
          value: clsValue,
          id: `v1-${Date.now()}-${Math.random()}`,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })

    } catch (err) {
      logger.error('Failed to setup PerformanceObserver:', err)
    }
  }

  // 页面加载完成后记录基本指标
  if (document.readyState === 'complete') {
    logBasicMetrics()
  } else {
    window.addEventListener('load', logBasicMetrics)
  }
}

/**
 * 记录基本性能指标
 */
function logBasicMetrics() {
  if (!performance || !performance.timing) return

  const timing = performance.timing
  const metrics = {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    request: timing.responseStart - timing.requestStart,
    response: timing.responseEnd - timing.responseStart,
    dom: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
    load: timing.loadEventEnd - timing.loadEventStart,
    total: timing.loadEventEnd - timing.navigationStart
  }

  logger.debug('Page Load Metrics:', metrics)
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

  if (!navigation) return null

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
