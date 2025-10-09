import { useEffect, useState } from 'react'
import { Download, Languages, Moon, Plus, Settings, Sun, Trash, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationItem } from './ConversationItem'
import { ExportMenu } from '../chat/ExportMenu'

/**
 * 侧边栏组件
 * 显示对话列表和操作按钮
 */
export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onClearAll,
  onClearConversation,
  language,
  theme,
  currentConversation,
  onToggleLanguage,
  onToggleTheme,
  onOpenSettings,
  translate
}) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleDelete = (id, title) => {
    if (confirm(`确定要删除对话"${title}"吗?`)) {
      onDeleteConversation(id)
    }
  }

  const handleClearAll = () => {
    if (confirm(translate('confirms.clearAllConversations', 'Are you sure you want to clear all conversations?'))) {
      onClearAll()
      setShowExportMenu(false)
    }
  }

  const handleClearConversation = () => {
    if (!currentConversation) return
    if (confirm(translate('confirms.clearConversation', 'Are you sure you want to clear this conversation?'))) {
      onClearConversation?.()
      setShowExportMenu(false)
    }
  }

  const toggleExportMenu = () => {
    if (!currentConversation) return
    setShowExportMenu((prev) => !prev)
  }

  useEffect(() => {
    setShowExportMenu(false)
  }, [currentConversation?.id])

  return (
    <aside className="sidebar">
      {/* 头部 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {translate('headings.conversation', 'Conversation')}
        </h2>
      </div>

      {/* 对话列表 */}
      <div className="conversation-list">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === currentConversationId}
            onSelect={() => onSelectConversation(conversation.id)}
            onRename={onRenameConversation}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <div className="sidebar-footer">
        <Button
          className="new-chat-btn"
          variant="secondary"
          size="lg"
          onClick={() => {
            setShowExportMenu(false)
            onNewConversation()
          }}
        >
          <Plus className="w-4 h-4" />
          {translate('buttons.newConversation', 'New conversation')}
        </Button>

        <div className="sidebar-footer-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearConversation}
            title={translate('tooltips.clearConversations', 'Clear conversation')}
            disabled={!currentConversation}
          >
            <Trash className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearAll}
            title={translate('tooltips.clearAllConversations', 'Clear all conversations')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="sidebar-language-button"
            onClick={() => {
              setShowExportMenu(false)
              onToggleLanguage?.()
            }}
            title={translate('tooltips.toggleLanguage', 'Toggle language')}
          >
            <Languages className="w-4 h-4" />
            <span className="sidebar-language-label">
              {language === 'en'
                ? translate('toggles.languageShortChinese', '中文')
                : translate('toggles.languageShortEnglish', 'EN')}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowExportMenu(false)
              onToggleTheme?.()
            }}
            title={translate('tooltips.toggleTheme', 'Toggle theme')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <div className="export-menu-container">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExportMenu}
              title={translate('tooltips.exportConversation', 'Export conversation')}
              disabled={!currentConversation}
            >
              <Download className="w-4 h-4" />
            </Button>
            {showExportMenu && (
              <div className="sidebar-export-menu">
                <ExportMenu
                  conversation={currentConversation}
                  translate={translate}
                  onClose={() => setShowExportMenu(false)}
                />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowExportMenu(false)
              onOpenSettings?.()
            }}
            title={translate('tooltips.openSettings', 'Open settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

