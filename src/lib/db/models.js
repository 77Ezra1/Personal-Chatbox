/**
 * Models Table Operations
 * 模型配置表操作
 */

import { STORES, generateModelId, parseModelId } from './schema'
import { get, getAll, put, remove, getByIndex } from './index'

/**
 * 创建模型记录
 * @param {Object} modelData 模型数据
 * @returns {Object}
 */
function createModelRecord(modelData) {
  const now = Date.now()
  return {
    id: modelData.id || generateModelId(modelData.provider, modelData.modelName),
    provider: modelData.provider,
    providerLabel: modelData.providerLabel,
    modelName: modelData.modelName,
    apiKey: modelData.apiKey || '',
    temperature: modelData.temperature ?? 0.7,
    maxTokens: modelData.maxTokens ?? 1024,
    supportsDeepThinking: modelData.supportsDeepThinking ?? false,
    isActive: modelData.isActive ?? false,
    createdAt: modelData.createdAt || now,
    updatedAt: now
  }
}

/**
 * 获取所有模型
 * @returns {Promise<Array>}
 */
export async function getAllModels() {
  try {
    const models = await getAll(STORES.MODELS)
    return models.sort((a, b) => a.createdAt - b.createdAt)
  } catch (error) {
    console.error('[DB] Failed to get all models:', error)
    return []
  }
}

/**
 * 根据ID获取模型
 * @param {string} modelId 模型ID
 * @returns {Promise<Object|null>}
 */
export async function getModelById(modelId) {
  try {
    return await get(STORES.MODELS, modelId)
  } catch (error) {
    console.error('[DB] Failed to get model by id:', error)
    return null
  }
}

/**
 * 根据服务商获取模型列表
 * @param {string} provider 服务商ID
 * @returns {Promise<Array>}
 */
export async function getModelsByProvider(provider) {
  try {
    const models = await getByIndex(STORES.MODELS, 'provider', provider)
    return models.sort((a, b) => a.createdAt - b.createdAt)
  } catch (error) {
    console.error('[DB] Failed to get models by provider:', error)
    return []
  }
}

/**
 * 获取当前激活的模型
 * @param {string} provider 服务商ID（可选）
 * @returns {Promise<Object|null>}
 */
export async function getActiveModel(provider = null) {
  try {
    const models = await getAllModels()
    const activeModels = models.filter(m => m.isActive)
    
    if (provider) {
      return activeModels.find(m => m.provider === provider) || null
    }
    
    return activeModels[0] || null
  } catch (error) {
    console.error('[DB] Failed to get active model:', error)
    return null
  }
}

/**
 * 添加或更新模型
 * @param {Object} modelData 模型数据
 * @returns {Promise<string>}
 */
export async function saveModel(modelData) {
  try {
    const record = createModelRecord(modelData)
    await put(STORES.MODELS, record)
    console.log('[DB] Model saved:', record.id)
    return record.id
  } catch (error) {
    console.error('[DB] Failed to save model:', error)
    throw error
  }
}

/**
 * 更新模型配置
 * @param {string} modelId 模型ID
 * @param {Object} updates 更新的字段
 * @returns {Promise<void>}
 */
export async function updateModel(modelId, updates) {
  try {
    const existing = await getModelById(modelId)
    if (!existing) {
      throw new Error(`Model not found: ${modelId}`)
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // 确保ID不被修改
      createdAt: existing.createdAt, // 保留创建时间
      updatedAt: Date.now()
    }

    await put(STORES.MODELS, updated)
    console.log('[DB] Model updated:', modelId)
  } catch (error) {
    console.error('[DB] Failed to update model:', error)
    throw error
  }
}

/**
 * 设置激活模型
 * @param {string} modelId 模型ID
 * @returns {Promise<void>}
 */
export async function setActiveModel(modelId) {
  try {
    const model = await getModelById(modelId)
    if (!model) {
      throw new Error(`Model not found: ${modelId}`)
    }

    // 取消同一服务商下其他模型的激活状态
    const providerModels = await getModelsByProvider(model.provider)
    for (const m of providerModels) {
      if (m.id !== modelId && m.isActive) {
        await updateModel(m.id, { isActive: false })
      }
    }

    // 激活当前模型
    await updateModel(modelId, { isActive: true })
    console.log('[DB] Active model set:', modelId)
  } catch (error) {
    console.error('[DB] Failed to set active model:', error)
    throw error
  }
}

/**
 * 删除模型
 * @param {string} modelId 模型ID
 * @returns {Promise<void>}
 */
export async function deleteModel(modelId) {
  try {
    await remove(STORES.MODELS, modelId)
    console.log('[DB] Model deleted:', modelId)
  } catch (error) {
    console.error('[DB] Failed to delete model:', error)
    throw error
  }
}

/**
 * 批量添加模型
 * @param {Array} modelsData 模型数据数组
 * @returns {Promise<void>}
 */
export async function batchSaveModels(modelsData) {
  try {
    const records = modelsData.map(data => createModelRecord(data))
    
    for (const record of records) {
      await put(STORES.MODELS, record)
    }
    
    console.log('[DB] Batch models saved:', records.length)
  } catch (error) {
    console.error('[DB] Failed to batch save models:', error)
    throw error
  }
}

/**
 * 检查模型是否存在
 * @param {string} provider 服务商
 * @param {string} modelName 模型名称
 * @returns {Promise<boolean>}
 */
export async function modelExists(provider, modelName) {
  try {
    const modelId = generateModelId(provider, modelName)
    const model = await getModelById(modelId)
    return !!model
  } catch (error) {
    console.error('[DB] Failed to check model existence:', error)
    return false
  }
}

/**
 * 获取模型统计信息
 * @returns {Promise<Object>}
 */
export async function getModelsStats() {
  try {
    const models = await getAllModels()
    const stats = {
      total: models.length,
      byProvider: {}
    }

    models.forEach(model => {
      if (!stats.byProvider[model.provider]) {
        stats.byProvider[model.provider] = {
          count: 0,
          models: []
        }
      }
      stats.byProvider[model.provider].count++
      stats.byProvider[model.provider].models.push(model.modelName)
    })

    return stats
  } catch (error) {
    console.error('[DB] Failed to get models stats:', error)
    return { total: 0, byProvider: {} }
  }
}

