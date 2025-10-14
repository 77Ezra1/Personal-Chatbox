/**
 * 性能监控工具 - Web Vitals 集成
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'
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
  onINP(sendToAnalytics)  // Interaction to Next Paint (替代 FID)
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
