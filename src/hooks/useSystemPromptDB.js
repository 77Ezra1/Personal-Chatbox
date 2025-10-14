/**
 * System Prompt Hook with IndexedDB
 * 使用IndexedDB的系统提示词管理Hook
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getSystemPromptConfig,
  setSystemPromptMode,
  setGlobalPrompt as dbSetGlobalPrompt,
  updateSystemPromptConfig
} from '@/lib/db/systemPrompts'
import {
  getAllModelPrompts,
  setModelPrompt,
  batchSetModelPrompts,
  deleteModelPrompt
} from '@/lib/db/modelPrompts'
import { openDatabase } from '@/lib/db'

import { createLogger } from '../lib/logger'
const logger = createLogger('useSystemPromptDB')


/**
 * 系统提示词管理Hook（使用IndexedDB）
 */
export function useSystemPromptDB() {
  const [systemPrompt, setSystemPrompt] = useState({
    mode: 'none',
    prompt: '',
    prompts: {}
  })
  const [loading, setLoading] = useState(true)

  // 加载系统提示词配置
  const loadSystemPrompt = useCallback(async () => {
    try {
      setLoading(true)
      
      // 初始化数据库
      await openDatabase()
      
      // 获取系统提示词配置
      const config = await getSystemPromptConfig()
      
      // 获取所有模型提示词
      const modelPrompts = await getAllModelPrompts()
      const promptsMap = {}
      modelPrompts.forEach(mp => {
        promptsMap[mp.modelId] = mp.prompt
      })
      
      setSystemPrompt({
        mode: config.mode,
        prompt: config.globalPrompt,
        prompts: promptsMap
      })
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to load system prompt:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadSystemPrompt()
  }, [loadSystemPrompt])

  // 设置模式
  const setMode = useCallback(async (mode) => {
    try {
      await setSystemPromptMode(mode)
      setSystemPrompt(prev => ({ ...prev, mode }))
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to set mode:', error)
      throw error
    }
  }, [])

  // 设置全局提示词
  const setGlobalPrompt = useCallback(async (prompt) => {
    try {
      await dbSetGlobalPrompt(prompt)
      setSystemPrompt(prev => ({ ...prev, prompt }))
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to set global prompt:', error)
      throw error
    }
  }, [])

  // 设置单个模型提示词
  const setModelPromptSingle = useCallback(async (modelId, prompt) => {
    try {
      await setModelPrompt(modelId, prompt)
      setSystemPrompt(prev => ({
        ...prev,
        prompts: {
          ...prev.prompts,
          [modelId]: prompt
        }
      }))
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to set model prompt:', error)
      throw error
    }
  }, [])

  // 批量设置模型提示词
  const setModelPrompts = useCallback(async (modelIds, prompt, newPrompts) => {
    try {
      // 如果提供了newPrompts，直接使用（用于删除操作）
      if (newPrompts !== undefined) {
        setSystemPrompt(prev => ({
          ...prev,
          prompts: newPrompts
        }))
        return
      }
      
      // 否则批量设置
      await batchSetModelPrompts(modelIds, prompt)
      
      const updatedPrompts = { ...systemPrompt.prompts }
      modelIds.forEach(modelId => {
        updatedPrompts[modelId] = prompt
      })
      
      setSystemPrompt(prev => ({
        ...prev,
        prompts: updatedPrompts
      }))
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to batch set model prompts:', error)
      throw error
    }
  }, [systemPrompt.prompts])

  // 删除模型提示词
  const removeModelPrompt = useCallback(async (modelId) => {
    try {
      await deleteModelPrompt(modelId)
      
      const newPrompts = { ...systemPrompt.prompts }
      delete newPrompts[modelId]
      
      setSystemPrompt(prev => ({
        ...prev,
        prompts: newPrompts
      }))
    } catch (error) {
      logger.error('[useSystemPromptDB] Failed to remove model prompt:', error)
      throw error
    }
  }, [systemPrompt.prompts])

  // 获取指定模型的提示词
  const getModelPrompt = useCallback((modelId) => {
    return systemPrompt.prompts[modelId] || ''
  }, [systemPrompt.prompts])

  // 获取当前有效的提示词（用于传递给AI）
  const getEffectivePrompt = useCallback((provider, model) => {
    const modelId = `${provider}:${model}`
    
    if (systemPrompt.mode === 'global') {
      return systemPrompt.prompt
    } else if (systemPrompt.mode === 'per-model') {
      return getModelPrompt(modelId)
    }
    return ''
  }, [systemPrompt.mode, systemPrompt.prompt, getModelPrompt])

  return {
    systemPrompt,
    mode: systemPrompt.mode,
    globalPrompt: systemPrompt.prompt,
    modelPrompts: systemPrompt.prompts,
    loading,
    setMode,
    setGlobalPrompt,
    setModelPrompt: setModelPromptSingle,
    setModelPrompts,
    removeModelPrompt,
    getModelPrompt,
    getEffectivePrompt,
    reload: loadSystemPrompt
  }
}

