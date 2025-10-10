/**
 * IndexedDB Schema Definition
 * 数据库结构定义
 */

export const DB_NAME = 'ai-life-system-db'
export const DB_VERSION = 2

/**
 * 对象存储（表）定义
 */
export const STORES = {
  MODELS: 'models',
  SYSTEM_PROMPTS: 'system_prompts',
  MODEL_PROMPTS: 'model_prompts',
  CONVERSATIONS: 'conversations',
  APP_SETTINGS: 'app_settings',
  PROVIDER_API_KEYS: 'provider_api_keys'
}

/**
 * 初始化数据库schema
 * @param {IDBDatabase} db 
 */
export function initSchema(db) {
  // 1. models表 - 存储用户添加的模型配置
  if (!db.objectStoreNames.contains(STORES.MODELS)) {
    const modelsStore = db.createObjectStore(STORES.MODELS, { keyPath: 'id' })
    modelsStore.createIndex('provider', 'provider', { unique: false })
    modelsStore.createIndex('provider_active', ['provider', 'isActive'], { unique: false })
    modelsStore.createIndex('createdAt', 'createdAt', { unique: false })
  }

  // 2. system_prompts表 - 存储系统提示词配置
  if (!db.objectStoreNames.contains(STORES.SYSTEM_PROMPTS)) {
    db.createObjectStore(STORES.SYSTEM_PROMPTS, { keyPath: 'id' })
  }

  // 3. model_prompts表 - 存储模型提示词关联
  if (!db.objectStoreNames.contains(STORES.MODEL_PROMPTS)) {
    const modelPromptsStore = db.createObjectStore(STORES.MODEL_PROMPTS, { keyPath: 'id' })
    modelPromptsStore.createIndex('modelId', 'modelId', { unique: true })
  }

  // 4. conversations表 - 存储对话记录
  if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
    const conversationsStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' })
    conversationsStore.createIndex('createdAt', 'createdAt', { unique: false })
  }

  // 5. app_settings表 - 存储应用设置
  if (!db.objectStoreNames.contains(STORES.APP_SETTINGS)) {
    db.createObjectStore(STORES.APP_SETTINGS, { keyPath: 'key' })
  }

  // 6. provider_api_keys表 - 存储服务商API Key
  if (!db.objectStoreNames.contains(STORES.PROVIDER_API_KEYS)) {
    db.createObjectStore(STORES.PROVIDER_API_KEYS, { keyPath: 'provider' })
  }
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string}
 */
export function generateId(prefix = '') {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * 生成模型ID
 * @param {string} provider 服务商
 * @param {string} modelName 模型名称
 * @returns {string}
 */
export function generateModelId(provider, modelName) {
  return `${provider}:${modelName}`
}

/**
 * 解析模型ID
 * @param {string} modelId 模型ID
 * @returns {{provider: string, modelName: string}}
 */
export function parseModelId(modelId) {
  const [provider, ...rest] = modelId.split(':')
  return {
    provider,
    modelName: rest.join(':')
  }
}

