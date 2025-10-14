import { createLogger } from '../lib/logger'
const logger = createLogger('SecureStorage')

/**
 * 安全存储工具 - 使用 Web Crypto API 加密敏感数据
 * 用于 API 密钥等敏感信息的加密存储
 */

const SALT = 'personal-chatbox-v1' // 生产环境应使用随机 salt
const ITERATIONS = 100000

/**
 * 从密码派生加密密钥
 */
async function deriveKey(password) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
export async function encryptData(data, password) {
  const key = await deriveKey(password)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(JSON.stringify(data))
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  
  // 转换为 base64
  const encryptedArray = new Uint8Array(encrypted)
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
  const ivBase64 = btoa(String.fromCharCode(...iv))
  
  return {
    data: encryptedBase64,
    iv: ivBase64
  }
}

/**
 * 解密数据
 */
export async function decryptData(encryptedData, ivBase64, password) {
  const key = await deriveKey(password)
  
  // 从 base64 转换回
  const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )
  
  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(decrypted))
}

/**
 * 安全存储管理器
 */
export class SecureStorage {
  constructor(storageKey = 'secure_data') {
    this.storageKey = storageKey
  }
  
  /**
   * 保存加密数据
   */
  async save(data, password) {
    try {
      const encrypted = await encryptData(data, password)
      localStorage.setItem(this.storageKey, JSON.stringify(encrypted))
      return true
    } catch (error) {
      logger.error('Failed to save encrypted data:', error)
      return false
    }
  }
  
  /**
   * 读取并解密数据
   */
  async load(password) {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null
      
      const encrypted = JSON.parse(stored)
      return await decryptData(encrypted.data, encrypted.iv, password)
    } catch (error) {
      logger.error('Failed to load encrypted data:', error)
      return null
    }
  }
  
  /**
   * 删除数据
   */
  remove() {
    localStorage.removeItem(this.storageKey)
  }
}

// 导出默认实例
export const secureStorage = new SecureStorage()
