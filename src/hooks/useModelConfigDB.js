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
import {
  getProviderApiKey,
  setProviderApiKey
} from '@/lib/db/providerApiKeys'
import { openDatabase } from '@/lib/db'
import { generateModelId } from '@/lib/db/schema'

import { createLogger } from '../lib/logger'
const logger = createLogger('useModelConfigDB')


/**
 * 模型配置管理Hook（使用IndexedDB）
 */
export function useModelConfigDB() {
  const [models, setModels] = useState([])
  const [currentProvider, setCurrentProviderState] = useState('openai')
  const [currentModel, setCurrentModelState] = useState('')
  const [currentApiKey, setCurrentApiKey] = useState('')
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
      
      // 加载当前服务商的API Key
      const apiKey = await getProviderApiKey(provider)
      setCurrentApiKey(apiKey)
    } catch (error) {
      logger.error('[useModelConfigDB] Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadModels()
  }, [loadModels])

  // 当服务商变化时,加载对应的API Key
  useEffect(() => {
    const loadApiKey = async () => {
      const apiKey = await getProviderApiKey(currentProvider)
      setCurrentApiKey(apiKey)
    }
    loadApiKey()
  }, [currentProvider])

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
        apiKey: currentApiKey, // 使用服务商级别的API Key
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        supportsDeepThinking: model.supportsDeepThinking,
        thinkingMode: model.thinkingMode || 'optional'  // 新增
      }
    }
    
    return {
      provider: currentProvider,
      model: currentModel,
      apiKey: currentApiKey, // 使用服务商级别的API Key
      temperature: 0.7,
      maxTokens: 1024,
      supportsDeepThinking: false,
      thinkingMode: 'optional'  // 新增
    }
  }, [models, currentProvider, currentModel, currentApiKey])

  // 切换服务商
  const setProvider = useCallback(async (provider) => {
    try {
      await dbSetCurrentProvider(provider)
      setCurrentProviderState(provider)
      
      // 加载新服务商的API Key
      const apiKey = await getProviderApiKey(provider)
      setCurrentApiKey(apiKey)
      
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
      logger.error('[useModelConfigDB] Failed to set provider:', error)
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
      logger.error('[useModelConfigDB] Failed to set model:', error)
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
        logger.log('[useModelConfigDB] Model already exists:', modelId)
        return
      }
      
      // 创建新模型（不再存储apiKey）
      await saveModel({
        provider,
        providerLabel: providerConfig.label,
        modelName: modelName.trim(),
        apiKey: '', // 不再在模型级别存储API Key
        isActive: false
      })
      
      // 重新加载模型列表
      await loadModels()
    } catch (error) {
      logger.error('[useModelConfigDB] Failed to add custom model:', error)
      throw error
    }
  }, [loadModels])

  // 更新模型配置
  const updateConfig = useCallback(async (updates) => {
    try {
      const modelName = updates.model?.trim() || currentModel
      if (!modelName) return
      
      const modelId = generateModelId(currentProvider, modelName)
      
      // 如果更新了API Key，保存到服务商级别
      if (updates.apiKey !== undefined) {
        await setProviderApiKey(currentProvider, updates.apiKey)
        setCurrentApiKey(updates.apiKey)
        
        // 如果是DeepSeek，同步配置到后端
        if (currentProvider === 'deepseek') {
          try {
            const response = await fetch('/api/config/service/deepseek', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                enabled: true,
                apiKey: updates.apiKey,
                model: modelName
              }),
            });
            
            if (response.ok) {
              logger.log('[useModelConfigDB] DeepSeek config synced to backend');
            } else {
              logger.error('[useModelConfigDB] Failed to sync DeepSeek config to backend');
            }
          } catch (error) {
            logger.error('[useModelConfigDB] Error syncing DeepSeek config:', error);
          }
        }
      }
      
      // 检查模型是否存在
      let model = await getModelById(modelId)
      
      if (!model) {
        // 如果模型不存在，创建新模型
        const providerConfig = PROVIDERS[currentProvider]
        await saveModel({
          provider: currentProvider,
          providerLabel: providerConfig.label,
          modelName,
          apiKey: '', // 不再在模型级别存储API Key
          temperature: updates.temperature ?? 0.7,
          maxTokens: updates.maxTokens ?? 1024,
          supportsDeepThinking: updates.supportsDeepThinking ?? false,
          thinkingMode: updates.thinkingMode ?? 'optional',  // 新增
          isActive: true
        })
      } else {
        // 更新现有模型（不更新apiKey字段）
        await updateModel(modelId, {
          temperature: updates.temperature !== undefined ? updates.temperature : model.temperature,
          maxTokens: updates.maxTokens !== undefined ? updates.maxTokens : model.maxTokens,
          supportsDeepThinking: updates.supportsDeepThinking !== undefined ? updates.supportsDeepThinking : model.supportsDeepThinking,
          thinkingMode: updates.thinkingMode !== undefined ? updates.thinkingMode : model.thinkingMode  // 新增
        })
      }
      
      // 如果模型名称变了，更新当前模型
      if (updates.model && updates.model !== currentModel) {
        await setModel(modelName)
      }
      
      // 重新加载模型列表
      await loadModels()
    } catch (error) {
      logger.error('[useModelConfigDB] Failed to update config:', error)
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
      logger.error('[useModelConfigDB] Failed to remove custom model:', error)
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

