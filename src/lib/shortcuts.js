/**
 * 快捷键配置管理器
 * 支持用户自定义快捷键，并适配不同操作系统 (Mac/Windows/Linux)
 */

import { createLogger } from './logger'

const logger = createLogger('Shortcuts')

// 检测操作系统
export const OS = {
  MAC: 'mac',
  WINDOWS: 'windows',
  LINUX: 'linux',
  UNKNOWN: 'unknown'
}

/**
 * 检测当前操作系统
 */
export function detectOS() {
  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return OS.MAC
  } else if (platform.includes('win') || userAgent.includes('windows')) {
    return OS.WINDOWS
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return OS.LINUX
  }

  return OS.UNKNOWN
}

/**
 * 获取当前操作系统
 */
export const currentOS = detectOS()

/**
 * 快捷键修饰符映射
 */
export const MODIFIERS = {
  CTRL: 'ctrl',
  ALT: 'alt',
  SHIFT: 'shift',
  META: 'meta', // Command (Mac) / Windows (Windows)
}

/**
 * 根据操作系统获取修饰符显示名称
 */
export function getModifierDisplayName(modifier, os = currentOS) {
  const displayNames = {
    [MODIFIERS.CTRL]: {
      [OS.MAC]: '⌃',
      [OS.WINDOWS]: 'Ctrl',
      [OS.LINUX]: 'Ctrl',
      [OS.UNKNOWN]: 'Ctrl'
    },
    [MODIFIERS.ALT]: {
      [OS.MAC]: '⌥',
      [OS.WINDOWS]: 'Alt',
      [OS.LINUX]: 'Alt',
      [OS.UNKNOWN]: 'Alt'
    },
    [MODIFIERS.SHIFT]: {
      [OS.MAC]: '⇧',
      [OS.WINDOWS]: 'Shift',
      [OS.LINUX]: 'Shift',
      [OS.UNKNOWN]: 'Shift'
    },
    [MODIFIERS.META]: {
      [OS.MAC]: '⌘',
      [OS.WINDOWS]: 'Win',
      [OS.LINUX]: 'Super',
      [OS.UNKNOWN]: 'Meta'
    }
  }

  return displayNames[modifier]?.[os] || modifier
}

/**
 * 默认快捷键配置
 */
export const DEFAULT_SHORTCUTS = {
  // 全局快捷键
  openCommandPalette: {
    id: 'openCommandPalette',
    name: '打开指令面板',
    description: '快速访问所有指令',
    defaultKey: 'k',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'global'
  },

  // 对话快捷键
  newConversation: {
    id: 'newConversation',
    name: '新建对话',
    description: '创建新的对话',
    defaultKey: 'n',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'conversation'
  },

  clearConversation: {
    id: 'clearConversation',
    name: '清空对话',
    description: '清空当前对话的所有消息',
    defaultKey: 'l',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL, MODIFIERS.SHIFT],
    category: 'conversation'
  },

  // 编辑快捷键
  focusInput: {
    id: 'focusInput',
    name: '聚焦输入框',
    description: '快速定位到输入框',
    defaultKey: '/',
    defaultModifiers: [],
    category: 'editing'
  },

  toggleDevMode: {
    id: 'toggleDevMode',
    name: '切换编程模式',
    description: '开启/关闭编程模式',
    defaultKey: 'e',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'editing'
  },

  // 导航快捷键
  previousConversation: {
    id: 'previousConversation',
    name: '上一个对话',
    description: '切换到上一个对话',
    defaultKey: '[',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'navigation'
  },

  nextConversation: {
    id: 'nextConversation',
    name: '下一个对话',
    description: '切换到下一个对话',
    defaultKey: ']',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'navigation'
  },

  toggleSidebar: {
    id: 'toggleSidebar',
    name: '切换侧边栏',
    description: '显示/隐藏侧边栏',
    defaultKey: 'b',
    defaultModifiers: [currentOS === OS.MAC ? MODIFIERS.META : MODIFIERS.CTRL],
    category: 'navigation'
  }
}

/**
 * 快捷键配置分类
 */
export const SHORTCUT_CATEGORIES = {
  global: { id: 'global', name: '全局', icon: '🌐' },
  conversation: { id: 'conversation', name: '对话', icon: '💬' },
  editing: { id: 'editing', name: '编辑', icon: '✏️' },
  navigation: { id: 'navigation', name: '导航', icon: '🧭' }
}

/**
 * 快捷键管理器类
 */
class ShortcutManager {
  constructor() {
    this.shortcuts = this.loadShortcuts()
    this.listeners = new Map()
    this.globalListener = null
  }

  /**
   * 从 localStorage 加载快捷键配置
   */
  loadShortcuts() {
    try {
      const stored = localStorage.getItem('customShortcuts')
      if (stored) {
        const custom = JSON.parse(stored)
        // 合并默认配置和自定义配置
        const merged = {}
        for (const [id, defaultConfig] of Object.entries(DEFAULT_SHORTCUTS)) {
          merged[id] = {
            ...defaultConfig,
            key: custom[id]?.key ?? defaultConfig.defaultKey,
            modifiers: custom[id]?.modifiers ?? defaultConfig.defaultModifiers,
            enabled: custom[id]?.enabled ?? true
          }
        }
        logger.log('Loaded custom shortcuts:', merged)
        return merged
      }
    } catch (error) {
      logger.error('Failed to load shortcuts:', error)
    }

    // 使用默认配置
    const defaults = {}
    for (const [id, config] of Object.entries(DEFAULT_SHORTCUTS)) {
      defaults[id] = {
        ...config,
        key: config.defaultKey,
        modifiers: config.defaultModifiers,
        enabled: true
      }
    }
    return defaults
  }

  /**
   * 保存快捷键配置到 localStorage
   */
  saveShortcuts() {
    try {
      const toSave = {}
      for (const [id, config] of Object.entries(this.shortcuts)) {
        toSave[id] = {
          key: config.key,
          modifiers: config.modifiers,
          enabled: config.enabled
        }
      }
      localStorage.setItem('customShortcuts', JSON.stringify(toSave))
      logger.log('Saved shortcuts to localStorage')
    } catch (error) {
      logger.error('Failed to save shortcuts:', error)
    }
  }

  /**
   * 获取快捷键配置
   */
  getShortcut(id) {
    return this.shortcuts[id]
  }

  /**
   * 获取所有快捷键配置
   */
  getAllShortcuts() {
    return this.shortcuts
  }

  /**
   * 更新快捷键配置
   */
  updateShortcut(id, key, modifiers) {
    if (!this.shortcuts[id]) {
      logger.warn(`Shortcut ${id} not found`)
      return false
    }

    // 检查冲突
    const conflict = this.findConflict(id, key, modifiers)
    if (conflict) {
      logger.warn(`Shortcut conflict with ${conflict.id}`)
      return { success: false, conflict }
    }

    this.shortcuts[id] = {
      ...this.shortcuts[id],
      key,
      modifiers
    }

    this.saveShortcuts()
    logger.log(`Updated shortcut ${id}:`, { key, modifiers })
    return { success: true }
  }

  /**
   * 重置快捷键为默认值
   */
  resetShortcut(id) {
    const defaultConfig = DEFAULT_SHORTCUTS[id]
    if (!defaultConfig) {
      logger.warn(`Default shortcut ${id} not found`)
      return false
    }

    this.shortcuts[id] = {
      ...defaultConfig,
      key: defaultConfig.defaultKey,
      modifiers: defaultConfig.defaultModifiers,
      enabled: true
    }

    this.saveShortcuts()
    logger.log(`Reset shortcut ${id} to default`)
    return true
  }

  /**
   * 重置所有快捷键为默认值
   */
  resetAllShortcuts() {
    for (const id of Object.keys(this.shortcuts)) {
      this.resetShortcut(id)
    }
    logger.log('Reset all shortcuts to default')
  }

  /**
   * 启用/禁用快捷键
   */
  toggleShortcut(id, enabled) {
    if (!this.shortcuts[id]) {
      logger.warn(`Shortcut ${id} not found`)
      return false
    }

    this.shortcuts[id].enabled = enabled
    this.saveShortcuts()
    logger.log(`Toggled shortcut ${id}:`, enabled)
    return true
  }

  /**
   * 检查快捷键冲突
   */
  findConflict(excludeId, key, modifiers) {
    for (const [id, config] of Object.entries(this.shortcuts)) {
      if (id === excludeId || !config.enabled) continue

      if (
        config.key === key &&
        config.modifiers.length === modifiers.length &&
        config.modifiers.every((m) => modifiers.includes(m))
      ) {
        return config
      }
    }
    return null
  }

  /**
   * 检查事件是否匹配快捷键
   */
  matchesShortcut(event, shortcutId) {
    const config = this.shortcuts[shortcutId]
    if (!config || !config.enabled) return false

    const key = event.key.toLowerCase()
    const hasCtrl = event.ctrlKey
    const hasAlt = event.altKey
    const hasShift = event.shiftKey
    const hasMeta = event.metaKey

    // 检查按键
    if (key !== config.key.toLowerCase()) return false

    // 检查修饰符
    const requiredCtrl = config.modifiers.includes(MODIFIERS.CTRL)
    const requiredAlt = config.modifiers.includes(MODIFIERS.ALT)
    const requiredShift = config.modifiers.includes(MODIFIERS.SHIFT)
    const requiredMeta = config.modifiers.includes(MODIFIERS.META)

    return (
      hasCtrl === requiredCtrl &&
      hasAlt === requiredAlt &&
      hasShift === requiredShift &&
      hasMeta === requiredMeta
    )
  }

  /**
   * 注册快捷键监听器
   */
  registerListener(shortcutId, callback) {
    if (!this.listeners.has(shortcutId)) {
      this.listeners.set(shortcutId, [])
    }
    this.listeners.get(shortcutId).push(callback)
    logger.log(`Registered listener for ${shortcutId}`)
  }

  /**
   * 注销快捷键监听器
   */
  unregisterListener(shortcutId, callback) {
    if (!this.listeners.has(shortcutId)) return

    const listeners = this.listeners.get(shortcutId)
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
      logger.log(`Unregistered listener for ${shortcutId}`)
    }
  }

  /**
   * 启动全局快捷键监听
   */
  startGlobalListener() {
    if (this.globalListener) {
      logger.warn('Global listener already started')
      return
    }

    this.globalListener = (event) => {
      for (const [id, callbacks] of this.listeners.entries()) {
        if (this.matchesShortcut(event, id)) {
          event.preventDefault()
          logger.log(`Shortcut triggered: ${id}`)
          callbacks.forEach((cb) => cb(event))
        }
      }
    }

    window.addEventListener('keydown', this.globalListener)
    logger.log('Global shortcut listener started')
  }

  /**
   * 停止全局快捷键监听
   */
  stopGlobalListener() {
    if (this.globalListener) {
      window.removeEventListener('keydown', this.globalListener)
      this.globalListener = null
      logger.log('Global shortcut listener stopped')
    }
  }

  /**
   * 格式化快捷键为显示文本
   */
  formatShortcut(shortcutId, os = currentOS) {
    const config = this.shortcuts[shortcutId]
    if (!config) return ''

    const parts = []

    // 添加修饰符
    for (const modifier of config.modifiers) {
      parts.push(getModifierDisplayName(modifier, os))
    }

    // 添加按键
    parts.push(config.key.toUpperCase())

    // 根据操作系统使用不同的连接符
    const separator = os === OS.MAC ? '' : '+'
    return parts.join(separator)
  }
}

// 导出单例
export const shortcutManager = new ShortcutManager()

/**
 * React Hook: 使用快捷键
 */
export function useShortcut(shortcutId, callback, deps = []) {
  const { useEffect } = require('react')

  useEffect(() => {
    if (!callback) return

    shortcutManager.registerListener(shortcutId, callback)

    return () => {
      shortcutManager.unregisterListener(shortcutId, callback)
    }
  }, [shortcutId, ...deps])
}

/**
 * 从事件中提取快捷键信息
 */
export function extractShortcutFromEvent(event) {
  const key = event.key.toLowerCase()
  const modifiers = []

  if (event.ctrlKey) modifiers.push(MODIFIERS.CTRL)
  if (event.altKey) modifiers.push(MODIFIERS.ALT)
  if (event.shiftKey) modifiers.push(MODIFIERS.SHIFT)
  if (event.metaKey) modifiers.push(MODIFIERS.META)

  return { key, modifiers }
}

/**
 * 验证快捷键是否有效
 */
export function isValidShortcut(key, modifiers) {
  // 必须有按键
  if (!key || key.length === 0) return false

  // 特殊键必须配合修饰符使用
  const specialKeys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12']
  if (!specialKeys.includes(key.toLowerCase()) && modifiers.length === 0) {
    return false
  }

  // 禁止的组合键 (系统保留)
  const forbidden = [
    { key: 'w', modifiers: [MODIFIERS.CTRL] }, // 关闭窗口
    { key: 'w', modifiers: [MODIFIERS.META] }, // 关闭窗口 (Mac)
    { key: 't', modifiers: [MODIFIERS.CTRL] }, // 新标签页
    { key: 't', modifiers: [MODIFIERS.META] }, // 新标签页 (Mac)
    { key: 'n', modifiers: [MODIFIERS.CTRL] }, // 新窗口
    { key: 'n', modifiers: [MODIFIERS.META] }, // 新窗口 (Mac)
  ]

  for (const f of forbidden) {
    if (
      f.key === key &&
      f.modifiers.length === modifiers.length &&
      f.modifiers.every((m) => modifiers.includes(m))
    ) {
      return false
    }
  }

  return true
}

