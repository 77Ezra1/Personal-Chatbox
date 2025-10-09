import { useState, useCallback, useMemo, useEffect } from 'react'
import { LANGUAGE_KEY, TRANSLATIONS, getTranslationValue } from '../lib/constants'

/**
 * 国际化 Hook
 * 管理应用的语言设置和翻译
 */
export function useTranslation() {
  // 从 localStorage 加载语言设置
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem(LANGUAGE_KEY)
    return stored === 'zh' ? 'zh' : 'en'
  })

  // 持久化语言设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_KEY, language)
    }
  }, [language])

  // 切换语言
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'en' ? 'zh' : 'en'))
  }, [])

  // 翻译函数
  const translate = useCallback(
    (key, fallback = '') => {
      return getTranslationValue(language, key) ?? fallback
    },
    [language]
  )

  // 获取当前语言的所有翻译
  const translations = useMemo(() => TRANSLATIONS[language], [language])

  return {
    language,
    setLanguage,
    toggleLanguage,
    translate,
    translations
  }
}

