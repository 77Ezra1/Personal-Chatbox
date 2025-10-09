import { Languages, Moon, Plus, Settings, Sun, Trash, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationItem } from './ConversationItem'

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
  language,
  theme,
  currentConversation,
  onToggleLanguage,
  onToggleTheme,
  onOpenSettings,
  translate
}) {
  const handleDelete = (id, title) => {
    if (confirm(`确定要删除对话"${title}"吗?`)) {
      onDeleteConversation(id)
    }
  }

  const handleClearAll = () => {
    if (confirm(translate('confirms.clearAllConversations', 'Are you sure you want to clear all conversations?'))) {
      onClearAll()
    }
  }

  const handleClearConversation = () => {
    if (!currentConversation) return
    if (confirm(translate('confirms.clearConversation', 'Are you sure you want to clear this conversation?'))) {
      onClearConversation?.()
    }
  }

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
            onNewConversation()
          }}
        >
          <Plus className="w-4 h-4" />
          {translate('buttons.newConversation', 'New conversation')}
        </Button>

        <div className="sidebar-footer-actions">
          <Button
            variant="ghost"
            size="sm"
            className="sidebar-clear-all-button"
            onClick={handleClearAll}
            title={translate('tooltips.clearAllConversations', 'Clear all conversations')}
          >
            <Trash2 className="w-4 h-4" />
            <span>{translate('tooltips.clearAllConversations', 'Clear all conversations')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="sidebar-language-button"
            onClick={() => {
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
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

