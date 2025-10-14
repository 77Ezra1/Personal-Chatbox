import { useState, useCallback, useEffect } from 'react'
import { SYSTEM_PROMPT_KEY } from '../lib/constants'

import { createLogger } from '../lib/logger'
const logger = createLogger('useSystemPrompt')


/**
 * 系统提示词管理 Hook
 * 支持全局提示词和指定模型提示词
 */
export function useSystemPrompt() {
  // 从 localStorage 加载系统提示词设置
  const [systemPrompt, setSystemPrompt] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        mode: 'none', // 'none' | 'global' | 'per-model'
        prompt: '', // 全局提示词内容
        prompts: {} // 指定模型提示词 { 'provider:model': 'prompt' }
      }
    }
    
    try {
      const stored = window.localStorage.getItem(SYSTEM_PROMPT_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      logger.error('Failed to load system prompt:', error)
    }
    
    return {
      mode: 'none',
      prompt: '',
      prompts: {}
    }
  })

  // 持久化系统提示词设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SYSTEM_PROMPT_KEY, JSON.stringify(systemPrompt))
      } catch (error) {
        logger.error('Failed to save system prompt:', error)
      }
    }
  }, [systemPrompt])

  // 设置模式
  const setMode = useCallback((mode) => {
    setSystemPrompt(prev => ({
      ...prev,
      mode
    }))
  }, [])

  // 设置全局提示词
  const setGlobalPrompt = useCallback((prompt) => {
    setSystemPrompt(prev => ({
      ...prev,
      prompt
    }))
  }, [])

  // 设置指定模型提示词
  const setModelPrompt = useCallback((provider, model, prompt) => {
    const key = `${provider}:${model}`
    setSystemPrompt(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [key]: prompt
      }
    }))
  }, [])

  // 批量设置指定模型提示词
  const setModelPrompts = useCallback((modelKeys, prompt, newPrompts) => {
    setSystemPrompt(prev => {
      // 如果提供了newPrompts，直接使用（用于删除操作）
      if (newPrompts !== undefined) {
        return {
          ...prev,
          prompts: newPrompts
        }
      }
      
      // 否则批量设置
      const updatedPrompts = { ...prev.prompts }
      modelKeys.forEach(key => {
        updatedPrompts[key] = prompt
      })
      return {
        ...prev,
        prompts: updatedPrompts
      }
    })
  }, [])

  // 删除指定模型提示词
  const removeModelPrompt = useCallback((provider, model) => {
    const key = `${provider}:${model}`
    setSystemPrompt(prev => {
      const newPrompts = { ...prev.prompts }
      delete newPrompts[key]
      return {
        ...prev,
        prompts: newPrompts
      }
    })
  }, [])

  // 获取指定模型的提示词
  const getModelPrompt = useCallback((provider, model) => {
    const key = `${provider}:${model}`
    return systemPrompt.prompts[key] || ''
  }, [systemPrompt.prompts])

  // 获取当前有效的提示词（用于传递给AI）
  const getEffectivePrompt = useCallback((provider, model) => {
    if (systemPrompt.mode === 'global') {
      return systemPrompt.prompt
    } else if (systemPrompt.mode === 'per-model') {
      return getModelPrompt(provider, model)
    }
    return ''
  }, [systemPrompt.mode, systemPrompt.prompt, getModelPrompt])

  return {
    systemPrompt,
    mode: systemPrompt.mode,
    globalPrompt: systemPrompt.prompt,
    modelPrompts: systemPrompt.prompts,
    setMode,
    setGlobalPrompt,
    setModelPrompt,
    setModelPrompts,
    removeModelPrompt,
    getModelPrompt,
    getEffectivePrompt
  }
}

