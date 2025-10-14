/**
 * System Prompts Table Operations
 * 系统提示词表操作
 */

import { STORES } from './schema'
import { get, put } from './index'

import { createLogger } from '../../lib/logger'
const logger = createLogger('SystemPrompts')


const DEFAULT_PROMPT_ID = 'default'

/**
 * 创建系统提示词记录
 * @param {Object} data 数据
 * @returns {Object}
 */
function createSystemPromptRecord(data) {
  const now = Date.now()
  return {
    id: DEFAULT_PROMPT_ID,
    mode: data.mode || 'none', // 'none' | 'global' | 'per-model'
    globalPrompt: data.globalPrompt || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  }
}

/**
 * 获取系统提示词配置
 * @returns {Promise<Object>}
 */
export async function getSystemPromptConfig() {
  try {
    let config = await get(STORES.SYSTEM_PROMPTS, DEFAULT_PROMPT_ID)
    
    // 如果不存在，创建默认配置
    if (!config) {
      config = createSystemPromptRecord({})
      await put(STORES.SYSTEM_PROMPTS, config)
      logger.log('[DB] Created default system prompt config')
    }
    
    return config
  } catch (error) {
    logger.error('[DB] Failed to get system prompt config:', error)
    // 返回默认配置
    return createSystemPromptRecord({})
  }
}

/**
 * 设置系统提示词模式
 * @param {string} mode 模式 ('none' | 'global' | 'per-model')
 * @returns {Promise<void>}
 */
export async function setSystemPromptMode(mode) {
  try {
    const config = await getSystemPromptConfig()
    config.mode = mode
    config.updatedAt = Date.now()
    
    await put(STORES.SYSTEM_PROMPTS, config)
    logger.log('[DB] System prompt mode updated:', mode)
  } catch (error) {
    logger.error('[DB] Failed to set system prompt mode:', error)
    throw error
  }
}

/**
 * 设置全局提示词
 * @param {string} prompt 提示词内容
 * @returns {Promise<void>}
 */
export async function setGlobalPrompt(prompt) {
  try {
    const config = await getSystemPromptConfig()
    config.globalPrompt = prompt
    config.updatedAt = Date.now()
    
    await put(STORES.SYSTEM_PROMPTS, config)
    logger.log('[DB] Global prompt updated')
  } catch (error) {
    logger.error('[DB] Failed to set global prompt:', error)
    throw error
  }
}

/**
 * 更新系统提示词配置
 * @param {Object} updates 更新的字段
 * @returns {Promise<void>}
 */
export async function updateSystemPromptConfig(updates) {
  try {
    const config = await getSystemPromptConfig()
    const updated = {
      ...config,
      ...updates,
      id: DEFAULT_PROMPT_ID, // 确保ID不变
      updatedAt: Date.now()
    }
    
    await put(STORES.SYSTEM_PROMPTS, updated)
    logger.log('[DB] System prompt config updated')
  } catch (error) {
    logger.error('[DB] Failed to update system prompt config:', error)
    throw error
  }
}

/**
 * 重置系统提示词配置
 * @returns {Promise<void>}
 */
export async function resetSystemPromptConfig() {
  try {
    const config = createSystemPromptRecord({})
    await put(STORES.SYSTEM_PROMPTS, config)
    logger.log('[DB] System prompt config reset')
  } catch (error) {
    logger.error('[DB] Failed to reset system prompt config:', error)
    throw error
  }
}

