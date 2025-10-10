/**
 * Provider API Keys Table Operations
 * 服务商API Key表操作
 */

import { STORES } from './schema'
import { get, put, remove, getAll } from './index'

/**
 * 获取服务商的API Key
 * @param {string} provider 服务商ID
 * @returns {Promise<string>}
 */
export async function getProviderApiKey(provider) {
  try {
    const record = await get(STORES.PROVIDER_API_KEYS, provider)
    return record?.apiKey || ''
  } catch (error) {
    console.error('[DB] Failed to get provider API key:', error)
    return ''
  }
}

/**
 * 设置服务商的API Key
 * @param {string} provider 服务商ID
 * @param {string} apiKey API Key
 * @returns {Promise<void>}
 */
export async function setProviderApiKey(provider, apiKey) {
  try {
    const now = Date.now()
    const record = {
      provider,
      apiKey: apiKey || '',
      updatedAt: now
    }
    await put(STORES.PROVIDER_API_KEYS, record)
    console.log('[DB] Provider API key saved:', provider)
  } catch (error) {
    console.error('[DB] Failed to set provider API key:', error)
    throw error
  }
}

/**
 * 删除服务商的API Key
 * @param {string} provider 服务商ID
 * @returns {Promise<void>}
 */
export async function deleteProviderApiKey(provider) {
  try {
    await remove(STORES.PROVIDER_API_KEYS, provider)
    console.log('[DB] Provider API key deleted:', provider)
  } catch (error) {
    console.error('[DB] Failed to delete provider API key:', error)
    throw error
  }
}

/**
 * 获取所有服务商的API Key
 * @returns {Promise<Object>}
 */
export async function getAllProviderApiKeys() {
  try {
    const records = await getAll(STORES.PROVIDER_API_KEYS)
    const result = {}
    records.forEach(record => {
      result[record.provider] = record.apiKey
    })
    return result
  } catch (error) {
    console.error('[DB] Failed to get all provider API keys:', error)
    return {}
  }
}

