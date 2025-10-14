/**
 * Conversations Table Operations
 * 对话记录表操作
 */

import { STORES, generateId } from './schema'
import { get, getAll, put, remove } from './index'

import { createLogger } from '../../lib/logger'
const logger = createLogger('Conversations')


/**
 * 创建对话记录
 * @param {Object} data 数据
 * @returns {Object}
 */
function createConversationRecord(data) {
  const now = Date.now()
  return {
    id: data.id || generateId('conv'),
    title: data.title || 'New Conversation',
    messages: data.messages || [],
    createdAt: data.createdAt || now,
    updatedAt: now
  }
}

/**
 * 获取所有对话
 * @returns {Promise<Array>}
 */
export async function getAllConversations() {
  try {
    const conversations = await getAll(STORES.CONVERSATIONS)
    return conversations.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    logger.error('[DB] Failed to get all conversations:', error)
    return []
  }
}

/**
 * 根据ID获取对话
 * @param {string} conversationId 对话ID
 * @returns {Promise<Object|null>}
 */
export async function getConversationById(conversationId) {
  try {
    return await get(STORES.CONVERSATIONS, conversationId)
  } catch (error) {
    logger.error('[DB] Failed to get conversation by id:', error)
    return null
  }
}

/**
 * 保存对话
 * @param {Object} conversationData 对话数据
 * @returns {Promise<string>}
 */
export async function saveConversation(conversationData) {
  try {
    const record = createConversationRecord(conversationData)
    await put(STORES.CONVERSATIONS, record)
    logger.log('[DB] Conversation saved:', record.id)
    return record.id
  } catch (error) {
    logger.error('[DB] Failed to save conversation:', error)
    throw error
  }
}

/**
 * 更新对话
 * @param {string} conversationId 对话ID
 * @param {Object} updates 更新的字段
 * @returns {Promise<void>}
 */
export async function updateConversation(conversationId, updates) {
  try {
    const existing = await getConversationById(conversationId)
    if (!existing) {
      throw new Error(`Conversation not found: ${conversationId}`)
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now()
    }

    await put(STORES.CONVERSATIONS, updated)
    logger.log('[DB] Conversation updated:', conversationId)
  } catch (error) {
    logger.error('[DB] Failed to update conversation:', error)
    throw error
  }
}

/**
 * 删除对话
 * @param {string} conversationId 对话ID
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId) {
  try {
    await remove(STORES.CONVERSATIONS, conversationId)
    logger.log('[DB] Conversation deleted:', conversationId)
  } catch (error) {
    logger.error('[DB] Failed to delete conversation:', error)
    throw error
  }
}

/**
 * 批量保存对话
 * @param {Array} conversationsData 对话数据数组
 * @returns {Promise<void>}
 */
export async function batchSaveConversations(conversationsData) {
  try {
    for (const data of conversationsData) {
      const record = createConversationRecord(data)
      await put(STORES.CONVERSATIONS, record)
    }
    logger.log('[DB] Batch conversations saved:', conversationsData.length)
  } catch (error) {
    logger.error('[DB] Failed to batch save conversations:', error)
    throw error
  }
}

