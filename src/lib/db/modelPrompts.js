/**
 * Model Prompts Table Operations
 * 模型提示词关联表操作
 */

import { STORES, generateId } from './schema'
import { get, getAll, put, remove, getByIndex, batch } from './index'

/**
 * 创建模型提示词记录
 * @param {Object} data 数据
 * @returns {Object}
 */
function createModelPromptRecord(data) {
  const now = Date.now()
  return {
    id: data.id || generateId('mp'),
    modelId: data.modelId,
    prompt: data.prompt || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  }
}

/**
 * 获取所有模型提示词
 * @returns {Promise<Array>}
 */
export async function getAllModelPrompts() {
  try {
    return await getAll(STORES.MODEL_PROMPTS)
  } catch (error) {
    console.error('[DB] Failed to get all model prompts:', error)
    return []
  }
}

/**
 * 根据模型ID获取提示词
 * @param {string} modelId 模型ID
 * @returns {Promise<Object|null>}
 */
export async function getModelPrompt(modelId) {
  try {
    const prompts = await getByIndex(STORES.MODEL_PROMPTS, 'modelId', modelId)
    return prompts[0] || null
  } catch (error) {
    console.error('[DB] Failed to get model prompt:', error)
    return null
  }
}

/**
 * 设置模型提示词
 * @param {string} modelId 模型ID
 * @param {string} prompt 提示词内容
 * @returns {Promise<void>}
 */
export async function setModelPrompt(modelId, prompt) {
  try {
    // 检查是否已存在
    const existing = await getModelPrompt(modelId)
    
    if (existing) {
      // 更新现有记录
      existing.prompt = prompt
      existing.updatedAt = Date.now()
      await put(STORES.MODEL_PROMPTS, existing)
      console.log('[DB] Model prompt updated:', modelId)
    } else {
      // 创建新记录
      const record = createModelPromptRecord({ modelId, prompt })
      await put(STORES.MODEL_PROMPTS, record)
      console.log('[DB] Model prompt created:', modelId)
    }
  } catch (error) {
    console.error('[DB] Failed to set model prompt:', error)
    throw error
  }
}

/**
 * 批量设置模型提示词
 * @param {Array<string>} modelIds 模型ID数组
 * @param {string} prompt 提示词内容
 * @returns {Promise<void>}
 */
export async function batchSetModelPrompts(modelIds, prompt) {
  try {
    const records = []
    
    for (const modelId of modelIds) {
      // 检查是否已存在
      const existing = await getModelPrompt(modelId)
      
      if (existing) {
        existing.prompt = prompt
        existing.updatedAt = Date.now()
        records.push(existing)
      } else {
        records.push(createModelPromptRecord({ modelId, prompt }))
      }
    }
    
    // 批量保存
    for (const record of records) {
      await put(STORES.MODEL_PROMPTS, record)
    }
    
    console.log('[DB] Batch model prompts set:', modelIds.length)
  } catch (error) {
    console.error('[DB] Failed to batch set model prompts:', error)
    throw error
  }
}

/**
 * 删除模型提示词
 * @param {string} modelId 模型ID
 * @returns {Promise<void>}
 */
export async function deleteModelPrompt(modelId) {
  try {
    const existing = await getModelPrompt(modelId)
    if (existing) {
      await remove(STORES.MODEL_PROMPTS, existing.id)
      console.log('[DB] Model prompt deleted:', modelId)
    }
  } catch (error) {
    console.error('[DB] Failed to delete model prompt:', error)
    throw error
  }
}

/**
 * 批量删除模型提示词
 * @param {Array<string>} modelIds 模型ID数组
 * @returns {Promise<void>}
 */
export async function batchDeleteModelPrompts(modelIds) {
  try {
    for (const modelId of modelIds) {
      await deleteModelPrompt(modelId)
    }
    console.log('[DB] Batch model prompts deleted:', modelIds.length)
  } catch (error) {
    console.error('[DB] Failed to batch delete model prompts:', error)
    throw error
  }
}

/**
 * 清除所有模型提示词
 * @returns {Promise<void>}
 */
export async function clearAllModelPrompts() {
  try {
    const prompts = await getAllModelPrompts()
    const ids = prompts.map(p => p.id)
    await batch(STORES.MODEL_PROMPTS, ids, 'delete')
    console.log('[DB] All model prompts cleared')
  } catch (error) {
    console.error('[DB] Failed to clear all model prompts:', error)
    throw error
  }
}

/**
 * 获取已配置提示词的模型列表
 * @returns {Promise<Array<{modelId: string, prompt: string}>>}
 */
export async function getConfiguredModels() {
  try {
    const prompts = await getAllModelPrompts()
    return prompts.map(p => ({
      modelId: p.modelId,
      prompt: p.prompt
    }))
  } catch (error) {
    console.error('[DB] Failed to get configured models:', error)
    return []
  }
}

/**
 * 检查模型是否已配置提示词
 * @param {string} modelId 模型ID
 * @returns {Promise<boolean>}
 */
export async function hasModelPrompt(modelId) {
  try {
    const prompt = await getModelPrompt(modelId)
    return !!prompt
  } catch (error) {
    console.error('[DB] Failed to check model prompt:', error)
    return false
  }
}

/**
 * 获取模型提示词统计
 * @returns {Promise<Object>}
 */
export async function getModelPromptsStats() {
  try {
    const prompts = await getAllModelPrompts()
    return {
      total: prompts.length,
      modelIds: prompts.map(p => p.modelId)
    }
  } catch (error) {
    console.error('[DB] Failed to get model prompts stats:', error)
    return { total: 0, modelIds: [] }
  }
}

