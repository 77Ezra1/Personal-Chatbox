import { Trash, Languages, Moon, Sun, Settings, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ExportMenu } from './ExportMenu'

/**
 * 聊天区域头部组件
 * 显示对话标题和操作按钮
 */
export function ChatHeader({
  title,
  language,
  theme,
  conversation,
  onClear,
  onToggleLanguage,
  onToggleTheme,
  onOpenSettings,
  translate
}) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleClear = () => {
    if (confirm(translate('confirms.clearAllConversations', 'Are you sure you want to clear all conversations?'))) {
      onClear()
    }
  }

  const handleExport = () => {
    setShowExportMenu(!showExportMenu)
  }

  return (
    <header className="chat-header">
      <h1 className="chat-title">{title}</h1>
      
      <div className="chat-header-actions">
        {/* 导出对话 */}
        <div className="export-menu-container">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title={translate('tooltips.exportConversation', 'Export conversation')}
          >
            <Download className="w-4 h-4" />
          </Button>
          {showExportMenu && (
            <div className="export-menu-wrapper">
              <ExportMenu
                conversation={conversation}
                translate={translate}
                onClose={() => setShowExportMenu(false)}
              />
            </div>
          )}
        </div>

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

