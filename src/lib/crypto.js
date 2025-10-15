/**
 * 加密工具
 * 提供API密钥和敏感数据的加密/解密功能
 */

/**
 * 生成加密密钥
 * 使用Web Crypto API生成AES-GCM密钥
 */
async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 从密码派生密钥
 * 使用PBKDF2算法从用户密码派生加密密钥
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
async function encrypt(data, key) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  )

  // 组合IV和加密数据
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)

  // 转换为Base64
  return arrayBufferToBase64(result)
}

/**
 * 解密数据
 */
async function decrypt(encryptedData, key) {
  const data = base64ToArrayBuffer(encryptedData)

  // 提取IV和加密数据
  const iv = data.slice(0, 12)
  const encrypted = data.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encrypted
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * ArrayBuffer转Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Base64转ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * 生成随机盐值
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * 密钥管理类
 */
class KeyManager {
  constructor() {
    this.key = null
    this.initialized = false
  }

  /**
   * 初始化（从设备指纹派生密钥）
   */
  async initialize() {
    if (this.initialized) return

    try {
      // 尝试从localStorage获取盐值
      let salt = localStorage.getItem('app_salt')
      if (!salt) {
        // 生成新的盐值
        const saltArray = generateSalt()
        salt = arrayBufferToBase64(saltArray)
        localStorage.setItem('app_salt', salt)
      }

      // 使用设备指纹作为密码（简单实现，生产环境应使用更安全的方式）
      const deviceFingerprint = await this.getDeviceFingerprint()
      const saltArray = base64ToArrayBuffer(salt)

      this.key = await deriveKey(deviceFingerprint, saltArray)
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize key manager:', error)
      throw error
    }
  }

  /**
   * 获取设备指纹
   */
  async getDeviceFingerprint() {
    // 简单的设备指纹实现
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage
    ]

    const fingerprint = components.join('|')

    // 使用SHA-256哈希
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprint)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 加密API密钥
   */
  async encryptApiKey(apiKey) {
    if (!this.initialized) await this.initialize()
    return await encrypt(apiKey, this.key)
  }

  /**
   * 解密API密钥
   */
  async decryptApiKey(encryptedApiKey) {
    if (!this.initialized) await this.initialize()
    return await decrypt(encryptedApiKey, this.key)
  }
}

// 创建全局密钥管理器实例
const keyManager = new KeyManager()

/**
 * 安全存储API密钥
 */
export async function securelyStoreApiKey(provider, apiKey) {
  try {
    const encrypted = await keyManager.encryptApiKey(apiKey)
    localStorage.setItem(`secure_api_key_${provider}`, encrypted)
    return true
  } catch (error) {
    console.error('Failed to securely store API key:', error)
    return false
  }
}

/**
 * 安全读取API密钥
 */
export async function securelyRetrieveApiKey(provider) {
  try {
    const encrypted = localStorage.getItem(`secure_api_key_${provider}`)
    if (!encrypted) return null
    return await keyManager.decryptApiKey(encrypted)
  } catch (error) {
    console.error('Failed to retrieve API key:', error)
    return null
  }
}

/**
 * 删除API密钥
 */
export function deleteApiKey(provider) {
  localStorage.removeItem(`secure_api_key_${provider}`)
}

/**
 * 检查是否有存储的API密钥
 */
export function hasStoredApiKey(provider) {
  return localStorage.getItem(`secure_api_key_${provider}`) !== null
}

/**
 * 清除所有存储的API密钥
 */
export function clearAllApiKeys() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('secure_api_key_')) {
      localStorage.removeItem(key)
    }
  })
}

export default {
  encrypt,
  decrypt,
  generateKey,
  deriveKey,
  generateSalt,
  KeyManager,
  securelyStoreApiKey,
  securelyRetrieveApiKey,
  deleteApiKey,
  hasStoredApiKey,
  clearAllApiKeys
}
