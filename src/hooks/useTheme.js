import { useState, useCallback, useEffect } from 'react'
import { THEME_KEY } from '../lib/constants'

/**
 * 主题管理 Hook
 * 管理应用的主题设置 (light/dark)
 */
export function useTheme() {
  // 从 localStorage 加载主题设置
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })

  // 持久化主题设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme)
      
      // 更新 document 的 class
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  }
}

