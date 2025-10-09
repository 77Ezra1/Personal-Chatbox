import { Trash, Languages, Moon, Sun, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 聊天区域头部组件
 * 显示对话标题和操作按钮
 */
export function ChatHeader({
  title,
  language,
  theme,
  onClear,
  onToggleLanguage,
  onToggleTheme,
  onOpenSettings,
  translate
}) {
  const handleClear = () => {
    if (confirm('确定要清空当前对话吗?')) {
      onClear()
    }
  }

  return (
    <header className="chat-header">
      <h1 className="chat-title">{title}</h1>
      
      <div className="chat-header-actions">
        {/* 清空对话 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          title={translate('tooltips.clearConversations', 'Clear conversation')}
        >
          <Trash className="w-4 h-4" />
        </Button>

        {/* 语言切换 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLanguage}
          title={translate('tooltips.toggleLanguage', 'Toggle language')}
        >
          <Languages className="w-4 h-4" />
          <span className="ml-1 text-xs">
            {language === 'en' 
              ? translate('toggles.languageShortChinese', '中文')
              : translate('toggles.languageShortEnglish', 'EN')
            }
          </span>
        </Button>

        {/* 主题切换 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          title={translate('tooltips.toggleTheme', 'Toggle theme')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* 设置 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          title={translate('tooltips.openSettings', 'Open settings')}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}

