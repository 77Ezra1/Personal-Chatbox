import { Languages, Moon, Plus, Settings, Sun, Trash, Trash2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationItem } from './ConversationItem'
import { useAuth } from '@/contexts/AuthContext'

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
  onShowConfirm,
  translate
}) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    onShowConfirm?.({
      title: language === 'zh' ? '确认登出' : 'Confirm Logout',
      message: language === 'zh' ? '确定要退出登录吗?' : 'Are you sure you want to logout?',
      variant: 'default',
      onConfirm: () => logout()
    })
  }
  const handleDelete = (id, title) => {
    const messageTemplate = translate(
      'confirms.deleteConversation',
      'Are you sure you want to delete the conversation "{title}"?'
    )
    const confirmationMessage = messageTemplate.replace('{title}', title ?? '')
    
    onShowConfirm?.({
      title: translate('confirms.deleteConversationTitle', 'Delete Conversation'),
      message: confirmationMessage,
      variant: 'danger',
      onConfirm: () => onDeleteConversation(id)
    })
  }

  const handleClearAll = () => {
    onShowConfirm?.({
      title: translate('confirms.clearAllConversationsTitle', 'Clear All Conversations'),
      message: translate('confirms.clearAllConversations', 'Are you sure you want to clear all conversations?'),
      variant: 'danger',
      onConfirm: () => onClearAll()
    })
  }

  const handleClearConversation = () => {
    if (!currentConversation) return
    
    onShowConfirm?.({
      title: translate('confirms.clearConversationTitle', 'Clear Conversation'),
      message: translate('confirms.clearConversation', 'Are you sure you want to clear this conversation?'),
      variant: 'danger',
      onConfirm: () => onClearConversation?.()
    })
  }

  return (
    <aside className="sidebar">
      {/* 头部 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {translate('headings.conversation', 'Conversation')}
        </h2>
        <Button
          className="new-chat-btn-header"
          variant="secondary"
          size="sm"
          onClick={() => {
            onNewConversation()
          }}
        >
          <Plus className="w-4 h-4" />
          {translate('buttons.newConversation', 'New conversation')}
        </Button>
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
        {/* 用户信息区域 */}
        {user && (
          <div className="sidebar-user-info">
            <div className="user-info-content">
              <User className="w-4 h-4" />
              <div className="user-details">
                <div className="user-name">{user.username || user.email}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title={language === 'zh' ? '登出' : 'Logout'}
              className="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}

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

