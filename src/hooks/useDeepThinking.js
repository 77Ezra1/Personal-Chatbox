import { useState, useCallback, useEffect, useMemo } from 'react'
import { DEEP_THINKING_KEY, THINKING_MODE } from '../lib/constants'
import { 
  isThinkingButtonDisabled, 
  shouldEnableThinking 
} from '../lib/modelThinkingDetector'

/**
 * 深度思考模式管理 Hook
 * 管理深度思考模式的开关状态，支持不同的思考模式
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

  // 获取模型的思考模式
  const thinkingMode = useMemo(() => {
    return modelConfig?.thinkingMode || THINKING_MODE.DISABLED
  }, [modelConfig])

  // 检查当前模型是否支持深度思考（向后兼容）
  const isDeepThinkingAvailable = useMemo(() => {
    // 新逻辑：基于 thinkingMode
    if (modelConfig?.thinkingMode) {
      return thinkingMode !== THINKING_MODE.DISABLED
    }
    // 旧逻辑：基于 supportsDeepThinking（向后兼容）
    return modelConfig?.supportsDeepThinking === true
  }, [modelConfig, thinkingMode])

  // 检查按钮是否应该禁用
  const isButtonDisabled = useMemo(() => {
    return isThinkingButtonDisabled(thinkingMode)
  }, [thinkingMode])

  // 获取实际的深度思考状态（考虑模型类型）
  const effectiveThinkingState = useMemo(() => {
    return shouldEnableThinking(thinkingMode, isDeepThinking)
  }, [thinkingMode, isDeepThinking])

  // 当模型不支持深度思考时,自动关闭深度思考模式
  useEffect(() => {
    if (!isDeepThinkingAvailable && isDeepThinking) {
      setIsDeepThinking(false)
    }
  }, [isDeepThinkingAvailable, isDeepThinking])

  // 对于强制开启或自适应模式，自动设置为开启状态
  useEffect(() => {
    if (thinkingMode === THINKING_MODE.ALWAYS_ON || thinkingMode === THINKING_MODE.ADAPTIVE) {
      if (!isDeepThinking) {
        setIsDeepThinking(true)
      }
    }
  }, [thinkingMode, isDeepThinking])

  // 切换深度思考模式
  const toggleDeepThinking = useCallback(() => {
    // 如果按钮被禁用，不允许切换
    if (isButtonDisabled) {
      console.warn('Deep thinking toggle is disabled for this model type')
      return
    }
    
    if (!isDeepThinkingAvailable) {
      console.warn('Deep thinking is not available for current model')
      return
    }
    
    setIsDeepThinking(prev => !prev)
  }, [isDeepThinkingAvailable, isButtonDisabled])

  return {
    isDeepThinking: effectiveThinkingState,  // 实际的思考状态
    isDeepThinkingAvailable,
    isButtonDisabled,                         // 新增：按钮是否禁用
    thinkingMode,                             // 新增：思考模式
    setIsDeepThinking,
    toggleDeepThinking
  }
}

