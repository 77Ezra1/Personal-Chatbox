/**
 * Data Migration from localStorage to IndexedDB
 * 数据迁移：从localStorage迁移到IndexedDB
 */

import { 
  CUSTOM_MODELS_KEY, 
  MODEL_CONFIG_KEY,
  SYSTEM_PROMPT_KEY,
  THEME_KEY,
  LANGUAGE_KEY,
  DEEP_THINKING_KEY,
  PROVIDERS
} from '../constants'

import { 
  batchSaveModels,
  getAllModels,
  setActiveModel
} from './models'

import {
  setSystemPromptMode,
  setGlobalPrompt
} from './systemPrompts'

import {
  batchSetModelPrompts
} from './modelPrompts'

import {
  batchSaveConversations,
  getAllConversations
} from './conversations'

import {

import { createLogger } from '../../lib/logger'
const logger = createLogger('needsMigration')

  batchSetSettings,
  SETTING_KEYS
} from './appSettings'

const MIGRATION_FLAG_KEY = 'indexeddb_migrated'
const BACKUP_KEY = 'localStorage_backup'

/**
 * 检查是否需要迁移
 * @returns {boolean}
 */
export function needsMigration() {
  // 如果已经迁移过，不需要再次迁移
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return false
  }

  // 检查是否有旧数据
  const hasOldData = 
    localStorage.getItem(CUSTOM_MODELS_KEY) ||
    localStorage.getItem(MODEL_CONFIG_KEY) ||
    localStorage.getItem(SYSTEM_PROMPT_KEY) ||
    localStorage.getItem('conversations')

  return !!hasOldData
}

/**
 * 执行数据迁移
 * @returns {Promise<Object>}
 */
export async function migrateData() {
  logger.log('[Migration] Starting data migration from localStorage to IndexedDB...')
  
  const result = {
    success: false,
    migrated: {
      models: 0,
      systemPrompts: false,
      modelPrompts: 0,
      conversations: 0,
      settings: 0
    },
    errors: []
  }

  try {
    // 1. 迁移模型配置
    await migrateModels(result)

    // 2. 迁移系统提示词
    await migrateSystemPrompts(result)

    // 3. 迁移对话记录
    await migrateConversations(result)

    // 4. 迁移应用设置
    await migrateAppSettings(result)

    // 5. 备份localStorage数据
    backupLocalStorage()

    // 6. 标记迁移完成
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')

    result.success = true
    logger.log('[Migration] Migration completed successfully:', result)
  } catch (error) {
    logger.error('[Migration] Migration failed:', error)
    result.errors.push(error.message)
  }

  return result
}

/**
 * 迁移模型配置
 * @param {Object} result 结果对象
 */
async function migrateModels(result) {
  try {
    // 读取自定义模型
    const customModelsStr = localStorage.getItem(CUSTOM_MODELS_KEY)
    const customModels = customModelsStr ? JSON.parse(customModelsStr) : {}

    // 读取模型配置
    const modelConfigStr = localStorage.getItem(MODEL_CONFIG_KEY)
    const modelConfig = modelConfigStr ? JSON.parse(modelConfigStr) : {}

    const modelsToMigrate = []
    let currentProvider = modelConfig.lastProvider || 'openai'
    let currentModel = null

    // 遍历所有服务商的自定义模型
    for (const [provider, modelList] of Object.entries(customModels)) {
      if (!Array.isArray(modelList)) continue

      const providerConfig = PROVIDERS[provider]
      if (!providerConfig) continue

      for (const modelName of modelList) {
        // 获取该模型的配置
        const providerData = modelConfig.providers?.[provider]
        const modelData = providerData?.models?.[modelName]

        const isActive = 
          provider === currentProvider && 
          providerData?.activeModel === modelName

        if (isActive) {
          currentModel = modelName
        }

        modelsToMigrate.push({
          provider,
          providerLabel: providerConfig.label,
          modelName,
          apiKey: modelData?.apiKey || '',
          temperature: modelData?.temperature ?? 0.7,
          maxTokens: modelData?.maxTokens ?? 1024,
          supportsDeepThinking: modelData?.supportsDeepThinking ?? false,
          isActive
        })
      }
    }

    // 批量保存模型
    if (modelsToMigrate.length > 0) {
      await batchSaveModels(modelsToMigrate)
      result.migrated.models = modelsToMigrate.length
      logger.log('[Migration] Migrated models:', modelsToMigrate.length)
    }

    // 保存当前选中的服务商和模型
    if (currentProvider) {
      await batchSetSettings({
        [SETTING_KEYS.CURRENT_PROVIDER]: currentProvider,
        [SETTING_KEYS.CURRENT_MODEL]: currentModel || ''
      })
    }
  } catch (error) {
    logger.error('[Migration] Failed to migrate models:', error)
    result.errors.push(`Models migration error: ${error.message}`)
  }
}

/**
 * 迁移系统提示词
 * @param {Object} result 结果对象
 */
async function migrateSystemPrompts(result) {
  try {
    const systemPromptStr = localStorage.getItem(SYSTEM_PROMPT_KEY)
    if (!systemPromptStr) return

    const systemPrompt = JSON.parse(systemPromptStr)

    // 设置模式
    if (systemPrompt.mode) {
      await setSystemPromptMode(systemPrompt.mode)
      result.migrated.systemPrompts = true
    }

    // 设置全局提示词
    if (systemPrompt.mode === 'global' && systemPrompt.prompt) {
      await setGlobalPrompt(systemPrompt.prompt)
    }

    // 设置指定模型提示词
    if (systemPrompt.mode === 'per-model' && systemPrompt.prompts) {
      const modelIds = Object.keys(systemPrompt.prompts)
      
      for (const modelId of modelIds) {
        const prompt = systemPrompt.prompts[modelId]
        if (prompt) {
          await batchSetModelPrompts([modelId], prompt)
          result.migrated.modelPrompts++
        }
      }
    }

    logger.log('[Migration] Migrated system prompts')
  } catch (error) {
    logger.error('[Migration] Failed to migrate system prompts:', error)
    result.errors.push(`System prompts migration error: ${error.message}`)
  }
}

/**
 * 迁移对话记录
 * @param {Object} result 结果对象
 */
async function migrateConversations(result) {
  try {
    const conversationsStr = localStorage.getItem('conversations')
    if (!conversationsStr) return

    const conversations = JSON.parse(conversationsStr)
    if (!Array.isArray(conversations) || conversations.length === 0) return

    await batchSaveConversations(conversations)
    result.migrated.conversations = conversations.length
    logger.log('[Migration] Migrated conversations:', conversations.length)
  } catch (error) {
    logger.error('[Migration] Failed to migrate conversations:', error)
    result.errors.push(`Conversations migration error: ${error.message}`)
  }
}

/**
 * 迁移应用设置
 * @param {Object} result 结果对象
 */
async function migrateAppSettings(result) {
  try {
    const settings = {}

    // 主题
    const theme = localStorage.getItem(THEME_KEY)
    if (theme) {
      settings[SETTING_KEYS.THEME] = theme
    }

    // 语言
    const language = localStorage.getItem(LANGUAGE_KEY)
    if (language) {
      settings[SETTING_KEYS.LANGUAGE] = language
    }

    // 深度思考
    const deepThinking = localStorage.getItem(DEEP_THINKING_KEY)
    if (deepThinking) {
      settings[SETTING_KEYS.DEEP_THINKING] = deepThinking === 'true'
    }

    if (Object.keys(settings).length > 0) {
      await batchSetSettings(settings)
      result.migrated.settings = Object.keys(settings).length
      logger.log('[Migration] Migrated app settings:', Object.keys(settings).length)
    }
  } catch (error) {
    logger.error('[Migration] Failed to migrate app settings:', error)
    result.errors.push(`App settings migration error: ${error.message}`)
  }
}

/**
 * 备份localStorage数据
 */
function backupLocalStorage() {
  try {
    const backup = {}
    const keys = [
      CUSTOM_MODELS_KEY,
      MODEL_CONFIG_KEY,
      SYSTEM_PROMPT_KEY,
      'conversations',
      THEME_KEY,
      LANGUAGE_KEY,
      DEEP_THINKING_KEY
    ]

    for (const key of keys) {
      const value = localStorage.getItem(key)
      if (value) {
        backup[key] = value
      }
    }

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    logger.log('[Migration] localStorage data backed up')
  } catch (error) {
    logger.error('[Migration] Failed to backup localStorage:', error)
  }
}

/**
 * 清除旧的localStorage数据
 */
export function clearOldLocalStorage() {
  try {
    const keysToRemove = [
      CUSTOM_MODELS_KEY,
      MODEL_CONFIG_KEY,
      SYSTEM_PROMPT_KEY,
      'conversations',
      THEME_KEY,
      LANGUAGE_KEY,
      DEEP_THINKING_KEY
    ]

    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }

    logger.log('[Migration] Old localStorage data cleared')
  } catch (error) {
    logger.error('[Migration] Failed to clear old localStorage:', error)
  }
}

/**
 * 恢复备份数据
 */
export function restoreBackup() {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY)
    if (!backupStr) {
      logger.warn('[Migration] No backup found')
      return false
    }

    const backup = JSON.parse(backupStr)
    
    for (const [key, value] of Object.entries(backup)) {
      localStorage.setItem(key, value)
    }

    // 清除迁移标记，允许重新迁移
    localStorage.removeItem(MIGRATION_FLAG_KEY)

    logger.log('[Migration] Backup restored')
    return true
  } catch (error) {
    logger.error('[Migration] Failed to restore backup:', error)
    return false
  }
}

/**
 * 重置迁移状态（用于测试）
 */
export function resetMigration() {
  localStorage.removeItem(MIGRATION_FLAG_KEY)
  logger.log('[Migration] Migration state reset')
}

/**
 * 检查IndexedDB中是否有数据
 * @returns {Promise<boolean>}
 */
export async function hasIndexedDBData() {
  try {
    const models = await getAllModels()
    const conversations = await getAllConversations()
    return models.length > 0 || conversations.length > 0
  } catch (error) {
    logger.error('[Migration] Failed to check IndexedDB data:', error)
    return false
  }
}

