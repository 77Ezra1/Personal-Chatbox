import { useEffect, useCallback } from 'react'

/**
 * 快捷键管理 Hook
 * 提供全局快捷键支持
 */
export function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback(
    (event) => {
      // 如果在输入框中,只处理特定快捷键
      const isInput = event.target.tagName === 'INPUT' || 
                     event.target.tagName === 'TEXTAREA' ||
                     event.target.isContentEditable

      for (const shortcut of shortcuts) {
        const { key, ctrl, alt, shift, handler, allowInInput = false } = shortcut

        // 如果在输入框中且不允许,跳过
        if (isInput && !allowInInput) {
          continue
        }

        // 检查修饰键
        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const altMatch = alt ? event.altKey : !event.altKey
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey

        // 检查按键
        const keyMatch = event.key.toLowerCase() === key.toLowerCase()

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault()
          handler(event)
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * 格式化快捷键显示
 * @param {Object} shortcut - 快捷键配置
 * @returns {string} 格式化的快捷键字符串
 */
export function formatShortcut(shortcut) {
  const { key, ctrl, alt, shift, meta } = shortcut
  const parts = []

  // 检测操作系统
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (ctrl || meta) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  
  // 特殊按键映射
  const keyMap = {
    'enter': isMac ? '↵' : 'Enter',
    'escape': 'Esc',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    '/': '/'
  }

  parts.push(keyMap[key.toLowerCase()] || key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}

/**
 * 预定义的快捷键配置
 */
export const DEFAULT_SHORTCUTS = {
  NEW_CONVERSATION: {
    key: 'n',
    ctrl: true,
    description: '新建对话'
  },
  SEARCH: {
    key: 'k',
    ctrl: true,
    description: '搜索对话'
  },
  SETTINGS: {
    key: ',',
    ctrl: true,
    description: '打开设置'
  },
  SEND_MESSAGE: {
    key: 'enter',
    ctrl: true,
    allowInInput: true,
    description: '发送消息'
  },
  CLOSE_DIALOG: {
    key: 'escape',
    description: '关闭弹窗'
  },
  SHOW_SHORTCUTS: {
    key: '/',
    ctrl: true,
    description: '显示快捷键列表'
  },
  TOGGLE_THEME: {
    key: 'd',
    ctrl: true,
    description: '切换主题'
  },
  EXPORT: {
    key: 'e',
    ctrl: true,
    description: '导出对话'
  }
}

