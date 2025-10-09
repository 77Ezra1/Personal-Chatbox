import { useState, useCallback, useEffect, useMemo } from 'react'
import { DEEP_THINKING_KEY } from '../lib/constants'

/**
 * 深度思考模式管理 Hook
 * 管理深度思考模式的开关状态
 */
export function useDeepThinking(modelConfig) {
  // 从 localStorage 加载深度思考模式设置
  const [isDeepThinking, setIsDeepThinking] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem(DEEP_THINKING_KEY)
    return stored === 'true'
  })

  // 持久化深度思考模式设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEEP_THINKING_KEY, String(isDeepThinking))
    }
  }, [isDeepThinking])

  // 检查当前模型是否支持深度思考
  const isDeepThinkingAvailable = useMemo(
    () => modelConfig?.supportsDeepThinking === true,
    [modelConfig]
  )

  // 当模型不支持深度思考时,自动关闭深度思考模式
  useEffect(() => {
    if (!isDeepThinkingAvailable && isDeepThinking) {
      setIsDeepThinking(false)
    }
  }, [isDeepThinkingAvailable, isDeepThinking])

  // 切换深度思考模式
  const toggleDeepThinking = useCallback(() => {
    if (!isDeepThinkingAvailable) {
      console.warn('Deep thinking is not available for current model')
      return
    }
    setIsDeepThinking(prev => !prev)
  }, [isDeepThinkingAvailable])

  return {
    isDeepThinking,
    isDeepThinkingAvailable,
    setIsDeepThinking,
    toggleDeepThinking
  }
}

