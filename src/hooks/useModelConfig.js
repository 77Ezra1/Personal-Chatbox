import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  CUSTOM_MODELS_KEY, 
  MODEL_CONFIG_KEY,
  PROVIDERS,
  getDefaultModel
} from '../lib/constants'
import {
  loadStoredCustomModels,
  loadStoredModelState,
  buildModelConfigFromState,
  applyModelSettings
} from '../lib/modelConfig'
import { cloneState } from '../lib/utils'

/**
 * 模型配置管理 Hook
 * 管理提供商、模型选择和配置
 */
export function useModelConfig() {
  // 加载自定义模型
  const [customModels, setCustomModels] = useState(() => loadStoredCustomModels())

  // 加载模型状态
  const [modelState, setModelState] = useState(() => {
    const { initialProvider, initialModel, savedProviders } = loadStoredModelState(customModels)
    return {
      currentProvider: initialProvider,
      currentModel: initialModel,
      providers: savedProviders
    }
  })

  // 持久化自定义模型
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels))
    }
  }, [customModels])

  // 持久化模型配置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        MODEL_CONFIG_KEY,
        JSON.stringify({
          lastProvider: modelState.currentProvider,
          providers: modelState.providers
        })
      )
    }
  }, [modelState])

  // 当前模型配置
  const modelConfig = useMemo(() => {
    return buildModelConfigFromState(
      cloneState(modelState.providers),
      modelState.currentProvider,
      modelState.currentModel,
      customModels
    )
  }, [modelState, customModels])

  // 获取提供商的模型列表
  const getProviderModels = useCallback((provider) => {
    const defaults = PROVIDERS[provider]?.models ?? []
    const customs = customModels[provider] ?? []
    return [...defaults, ...customs]
  }, [customModels])

  // 当前提供商的模型列表
  const currentProviderModels = useMemo(() => {
    return getProviderModels(modelState.currentProvider)
  }, [modelState.currentProvider, getProviderModels])

  // 切换提供商
  const setProvider = useCallback((provider) => {
    setModelState(prev => {
      const nextProviders = cloneState(prev.providers)
      const defaultModel = getDefaultModel(provider, customModels)
      
      return {
        ...prev,
        currentProvider: provider,
        currentModel: nextProviders[provider]?.activeModel || defaultModel,
        providers: nextProviders
      }
    })
  }, [customModels])

  // 切换模型
  const setModel = useCallback((model) => {
    setModelState(prev => ({
      ...prev,
      currentModel: model
    }))
  }, [])

  // 更新模型配置
  const updateConfig = useCallback((updates) => {
    setModelState(prev => {
      const nextProviders = cloneState(prev.providers)
      applyModelSettings(
        nextProviders,
        prev.currentProvider,
        prev.currentModel,
        customModels,
        updates
      )
      return {
        ...prev,
        providers: nextProviders
      }
    })
  }, [customModels])

  // 添加自定义模型
  const addCustomModel = useCallback((provider, modelName) => {
    if (!provider || !modelName) return
    
    setCustomModels(prev => {
      const providerModels = prev[provider] ?? []
      if (providerModels.includes(modelName)) return prev
      
      return {
        ...prev,
        [provider]: [...providerModels, modelName]
      }
    })
  }, [])

  // 移除自定义模型
  const removeCustomModel = useCallback((provider, modelName) => {
    if (!provider || !modelName) return
    
    setCustomModels(prev => {
      const providerModels = prev[provider] ?? []
      return {
        ...prev,
        [provider]: providerModels.filter(m => m !== modelName)
      }
    })
  }, [])

  return {
    // 当前状态
    modelConfig,
    currentProvider: modelState.currentProvider,
    currentModel: modelState.currentModel,
    
    // 模型列表
    currentProviderModels,
    customModels,
    
    // 操作方法
    setProvider,
    setModel,
    updateConfig,
    addCustomModel,
    removeCustomModel,
    getProviderModels
  }
}

