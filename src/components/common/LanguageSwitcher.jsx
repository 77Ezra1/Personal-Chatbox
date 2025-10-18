import { Languages } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import './LanguageSwitcher.css'

/**
 * 语言切换组件
 * 支持中英文切换
 */
export function LanguageSwitcher({ variant = 'default', size = 'default', className = '' }) {
  const { language, setLanguage, translate } = useTranslation()

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸'
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '简体中文',
      flag: '🇨🇳'
    }
  ]

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`language-switcher ${className}`}
          title={translate('tooltips.toggleLanguage', 'Toggle language')}
        >
          <Languages size={18} />
          <span className="language-code">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="language-menu">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'active' : ''}
          >
            <span className="language-flag">{lang.flag}</span>
            <div className="language-info">
              <div className="language-name">{lang.nativeName}</div>
              <div className="language-subtitle">{lang.name}</div>
            </div>
            {language === lang.code && (
              <span className="check-icon">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 简单的语言切换按钮（只切换，不显示菜单）
 */
export function LanguageToggle({ variant = 'ghost', size = 'icon', className = '' }) {
  const { language, toggleLanguage, translate } = useTranslation()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className={`language-toggle ${className}`}
      title={translate('tooltips.toggleLanguage', 'Toggle language')}
    >
      <Languages size={18} />
      <span className="language-label">
        {language === 'en'
          ? translate('toggles.languageShortEnglish', 'EN')
          : translate('toggles.languageShortChinese', '中文')
        }
      </span>
    </Button>
  )
}
