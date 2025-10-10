/**
 * Model Config Hook with IndexedDB
 * 使用IndexedDB的模型配置管理Hook
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { PROVIDERS } from '@/lib/constants'
import {
  getAllModels,
  getModelById,
  saveModel,
  updateModel,
  deleteModel,
  getModelsByProvider,
  setActiveModel as dbSetActiveModel,
  getActiveModel
} from '@/lib/db/models'
import {
  getCurrentProvider,
  getCurrentModel,
  setCurrentProvider as dbSetCurrentProvider,
  setCurrentModel as dbSetCurrentModel
} from '@/lib/db/appSettings'
import { openDatabase } from '@/lib/db'
import { generateModelId } from '@/lib/db/schema'

/**
 * 模型配置管理Hook（使用IndexedDB）
 */
export function useModelConfigDB() {
  const [models, setModels] = useState([])
  const [currentProvider, setCurrentProviderState] = useState('openai')
  const [currentModel, setCurrentModelState] = useState('')
  const [loading, setLoading] = useState(true)

  // 加载所有模型
  const loadModels = useCallback(async () => {
    try {
      setLoading(true)
      
      // 初始化数据库
      await openDatabase()
      
      // 获取所有模型
      const allModels = await getAllModels()
      setModels(allModels)
      
      // 获取当前选中的服务商和模型
      const provider = await getCurrentProvider()
      const model = await getCurrentModel()
      
      setCurrentProviderState(provider)
      setCurrentModelState(model)
    } catch (error) {
      console.error('[useModelConfigDB] Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadModels()
  }, [loadModels])

  // 当前服务商的模型列表
  const currentProviderModels = useMemo(() => {
    return models
      .filter(m => m.provider === currentProvider)
      .map(m => m.modelName)
  }, [models, currentProvider])

  // 按服务商分组的模型
  const customModels = useMemo(() => {
    const grouped = {}
    models.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = []
      }
      grouped[model.provider].push(model.modelName)
    })
    return grouped
  }, [models])

  // 当前模型配置
  const modelConfig = useMemo(() => {
    const modelId = generateModelId(currentProvider, currentModel)
    const model = models.find(m => m.id === modelId)
    
    if (model) {
      return {
        provider: model.provider,
        model: model.modelName,
        apiKey: model.apiKey,
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        supportsDeepThinking: model.supportsDeepThinking
      }
    }
    
    return {
      provider: currentProvider,
      model: currentModel,
      apiKey: '',
      temperature: 0.7,
      maxTokens: 1024,
      supportsDeepThinking: false
    }
  }, [models, currentProvider, currentModel])

  // 切换服务商
  const setProvider = useCallback(async (provider) => {
    try {
      await dbSetCurrentProvider(provider)
      setCurrentProviderState(provider)
      
      // 获取该服务商的激活模型
      const activeModel = await getActiveModel(provider)
      if (activeModel) {
        setCurrentModelState(activeModel.modelName)
        await dbSetCurrentModel(activeModel.modelName)
      } else {
        // 如果没有激活模型，选择第一个
        const providerModels = await getModelsByProvider(provider)
        if (providerModels.length > 0) {
          setCurrentModelState(providerModels[0].modelName)
          await dbSetCurrentModel(providerModels[0].modelName)
        } else {
          setCurrentModelState('')
          await dbSetCurrentModel('')
        }
      }
    } catch (error) {
      console.error('[useModelConfigDB] Failed to set provider:', error)
      throw error
    }
  }, [])

  // 切换模型
  const setModel = useCallback(async (modelName) => {
    try {
      const trimmedModel = modelName.trim()
      
      await dbSetCurrentModel(trimmedModel)
      setCurrentModelState(trimmedModel)
      
      // 设置为激活模型
      const modelId = generateModelId(currentProvider, trimmedModel)
      const model = await getModelById(modelId)
      
      if (model) {
        await dbSetActiveModel(modelId)
      }
    } catch (error) {
      console.error('[useModelConfigDB] Failed to set model:', error)
      throw error
    }
  }, [currentProvider])

  // 添加自定义模型
  const addCustomModel = useCallback(async (provider, modelName) => {
    try {
      if (!provider || !modelName.trim()) return
      
      const providerConfig = PROVIDERS[provider]
      if (!providerConfig) return
      
      const modelId = generateModelId(provider, modelName)
      
      // 检查是否已存在
      const existing = await getModelById(modelId)
      if (existing) {
        console.log('[useModelConfigDB] Model already exists:', modelId)
        return
      }
      
      // 创建新模型
      await saveModel({
        provider,
        providerLabel: providerConfig.label,
        modelName: modelName.trim(),
        isActive: false
      })
      
      // 重新加载模型列表
      await loadModels()
    } catch (error) {
      console.error('[useModelConfigDB] Failed to add custom model:', error)
      throw error
    }
  }, [loadModels])

  // 更新模型配置
  const updateConfig = useCallback(async (updates) => {
    try {
      const modelName = updates.model?.trim() || currentModel
      if (!modelName) return
      
      const modelId = generateModelId(currentProvider, modelName)
      
      // 检查模型是否存在
      let model = await getModelById(modelId)
      
      if (!model) {
        // 如果模型不存在，创建新模型
        const providerConfig = PROVIDERS[currentProvider]
        await saveModel({
          provider: currentProvider,
          providerLabel: providerConfig.label,
          modelName,
          apiKey: updates.apiKey || '',
          temperature: updates.temperature ?? 0.7,
          maxTokens: updates.maxTokens ?? 1024,
          supportsDeepThinking: updates.supportsDeepThinking ?? false,
          isActive: true
        })
      } else {
        // 更新现有模型
        await updateModel(modelId, {
          apiKey: updates.apiKey !== undefined ? updates.apiKey : model.apiKey,
          temperature: updates.temperature !== undefined ? updates.temperature : model.temperature,
          maxTokens: updates.maxTokens !== undefined ? updates.maxTokens : model.maxTokens,
          supportsDeepThinking: updates.supportsDeepThinking !== undefined ? updates.supportsDeepThinking : model.supportsDeepThinking
        })
      }
      
      // 如果模型名称变了，更新当前模型
      if (updates.model && updates.model !== currentModel) {
        await setModel(modelName)
      }
      
      // 重新加载模型列表
      await loadModels()
    } catch (error) {
      console.error('[useModelConfigDB] Failed to update config:', error)
      throw error
    }
  }, [currentProvider, currentModel, loadModels, setModel])

  // 删除自定义模型
  const removeCustomModel = useCallback(async (provider, modelName) => {
    try {
      const modelId = generateModelId(provider, modelName)
      await deleteModel(modelId)
      
      // 如果删除的是当前模型，切换到其他模型
      if (provider === currentProvider && modelName === currentModel) {
        const providerModels = await getModelsByProvider(provider)
        if (providerModels.length > 0) {
          await setModel(providerModels[0].modelName)
        } else {
          setCurrentModelState('')
          await dbSetCurrentModel('')
        }
      }
      
      // 重新加载模型列表
      await loadModels()
    } catch (error) {
      console.error('[useModelConfigDB] Failed to remove custom model:', error)
      throw error
    }
  }, [currentProvider, currentModel, loadModels, setModel])

  // 获取服务商的模型列表
  const getProviderModels = useCallback((provider) => {
    return models
      .filter(m => m.provider === provider)
      .map(m => m.modelName)
  }, [models])

  return {
    modelConfig,
    currentProvider,
    currentModel,
    currentProviderModels,
    customModels,
    models,
    loading,
    setProvider,
    setModel,
    updateConfig,
    addCustomModel,
    removeCustomModel,
    getProviderModels,
    reload: loadModels
  }
}

