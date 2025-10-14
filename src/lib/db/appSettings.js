/**
 * App Settings Table Operations
 * 应用设置表操作
 */

import { STORES } from './schema'
import { get, getAll, put, remove } from './index'

import { createLogger } from '../../lib/logger'
const logger = createLogger('SETTING_KEYS')


/**
 * 预定义的设置键
 */
export const SETTING_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  DEEP_THINKING: 'deepThinking',
  CURRENT_PROVIDER: 'currentProvider',
  CURRENT_MODEL: 'currentModel'
}

/**
 * 创建设置记录
 * @param {string} key 键
 * @param {any} value 值
 * @returns {Object}
 */
function createSettingRecord(key, value) {
  return {
    key,
    value,
    updatedAt: Date.now()
  }
}

/**
 * 获取设置值
 * @param {string} key 键
 * @param {any} defaultValue 默认值
 * @returns {Promise<any>}
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const record = await get(STORES.APP_SETTINGS, key)
    return record ? record.value : defaultValue
  } catch (error) {
    logger.error('[DB] Failed to get setting:', key, error)
    return defaultValue
  }
}

/**
 * 设置值
 * @param {string} key 键
 * @param {any} value 值
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  try {
    const record = createSettingRecord(key, value)
    await put(STORES.APP_SETTINGS, record)
    logger.log('[DB] Setting saved:', key)
  } catch (error) {
    logger.error('[DB] Failed to set setting:', key, error)
    throw error
  }
}

/**
 * 删除设置
 * @param {string} key 键
 * @returns {Promise<void>}
 */
export async function deleteSetting(key) {
  try {
    await remove(STORES.APP_SETTINGS, key)
    logger.log('[DB] Setting deleted:', key)
  } catch (error) {
    logger.error('[DB] Failed to delete setting:', key, error)
    throw error
  }
}

/**
 * 获取所有设置
 * @returns {Promise<Object>}
 */
export async function getAllSettings() {
  try {
    const records = await getAll(STORES.APP_SETTINGS)
    const settings = {}
    records.forEach(record => {
      settings[record.key] = record.value
    })
    return settings
  } catch (error) {
    logger.error('[DB] Failed to get all settings:', error)
    return {}
  }
}

/**
 * 批量设置
 * @param {Object} settings 设置对象
 * @returns {Promise<void>}
 */
export async function batchSetSettings(settings) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await setSetting(key, value)
    }
    logger.log('[DB] Batch settings saved:', Object.keys(settings).length)
  } catch (error) {
    logger.error('[DB] Failed to batch set settings:', error)
    throw error
  }
}

// 便捷方法

/**
 * 获取主题设置
 * @returns {Promise<string>}
 */
export async function getTheme() {
  return getSetting(SETTING_KEYS.THEME, 'light')
}

/**
 * 设置主题
 * @param {string} theme 主题
 * @returns {Promise<void>}
 */
export async function setTheme(theme) {
  return setSetting(SETTING_KEYS.THEME, theme)
}

/**
 * 获取语言设置
 * @returns {Promise<string>}
 */
export async function getLanguage() {
  return getSetting(SETTING_KEYS.LANGUAGE, 'zh')
}

/**
 * 设置语言
 * @param {string} language 语言
 * @returns {Promise<void>}
 */
export async function setLanguage(language) {
  return setSetting(SETTING_KEYS.LANGUAGE, language)
}

/**
 * 获取深度思考设置
 * @returns {Promise<boolean>}
 */
export async function getDeepThinking() {
  return getSetting(SETTING_KEYS.DEEP_THINKING, false)
}

/**
 * 设置深度思考
 * @param {boolean} enabled 是否启用
 * @returns {Promise<void>}
 */
export async function setDeepThinking(enabled) {
  return setSetting(SETTING_KEYS.DEEP_THINKING, enabled)
}

/**
 * 获取当前服务商
 * @returns {Promise<string>}
 */
export async function getCurrentProvider() {
  return getSetting(SETTING_KEYS.CURRENT_PROVIDER, 'openai')
}

/**
 * 设置当前服务商
 * @param {string} provider 服务商
 * @returns {Promise<void>}
 */
export async function setCurrentProvider(provider) {
  return setSetting(SETTING_KEYS.CURRENT_PROVIDER, provider)
}

/**
 * 获取当前模型
 * @returns {Promise<string>}
 */
export async function getCurrentModel() {
  return getSetting(SETTING_KEYS.CURRENT_MODEL, '')
}

/**
 * 设置当前模型
 * @param {string} model 模型
 * @returns {Promise<void>}
 */
export async function setCurrentModel(model) {
  return setSetting(SETTING_KEYS.CURRENT_MODEL, model)
}

