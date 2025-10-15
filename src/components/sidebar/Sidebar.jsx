import { useState, useMemo } from 'react'
import { BarChart3, Languages, Moon, Plus, Settings, Sun, Trash, Trash2, LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationItem } from './ConversationItem'
import { SearchBar } from './SearchBar'
import { AdvancedFilter } from './AdvancedFilter'
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
  onOpenAnalytics,
  onShowConfirm,
  translate
}) {
  const { user, logout } = useAuth()

  // 侧边栏折叠状态
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    sort: 'date',
    order: 'desc'
  })
  const [isSearching, setIsSearching] = useState(false)

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

  // 本地搜索和过滤对话
  const filteredConversations = useMemo(() => {
    let result = [...conversations]

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(conv => {
        // 搜索标题
        if (conv.title?.toLowerCase().includes(query)) {
          return true
        }
        // 搜索消息内容
        return conv.messages?.some(msg =>
          msg.content?.toLowerCase().includes(query)
        )
      })
    }

    // 日期过滤
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(conv => {
        const convDate = new Date(conv.createdAt)
        return convDate >= fromDate
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setDate(toDate.getDate() + 1) // 包含当天
      result = result.filter(conv => {
        const convDate = new Date(conv.createdAt)
        return convDate < toDate
      })
    }

    // 排序
    result.sort((a, b) => {
      if (filters.sort === 'date') {
        const dateA = new Date(a.createdAt || a.updatedAt)
        const dateB = new Date(b.createdAt || b.updatedAt)
        return filters.order === 'asc' ? dateA - dateB : dateB - dateA
      } else if (filters.sort === 'messages') {
        const countA = a.messages?.length || 0
        const countB = b.messages?.length || 0
        return filters.order === 'asc' ? countA - countB : countB - countA
      }
      return 0
    })

    return result
  }, [conversations, searchQuery, filters])

  // 处理搜索
  const handleSearch = (query) => {
    setSearchQuery(query)
    setIsSearching(false)
  }

  // 处理过滤器应用
  const handleApplyFilters = () => {
    setIsSearching(false)
  }

  // 重置过滤器
  const handleResetFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      sort: 'date',
      order: 'desc'
    })
    setSearchQuery('')
  }

  // 检查是否有激活的过滤器
  const hasActiveFilters = filters.dateFrom || filters.dateTo

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 折叠/展开按钮 */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      {!isCollapsed && (
        <>
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

      {/* 搜索栏 */}
      <div className="px-3 py-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          isSearching={isSearching}
          onFilterClick={() => setShowFilterPanel(true)}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* 对话列表 */}
      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery || hasActiveFilters
                ? translate('messages.noSearchResults', '没有找到匹配的对话')
                : translate('messages.noConversations', '暂无对话')}
            </p>
            {(searchQuery || hasActiveFilters) && (
              <Button
                variant="link"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2"
              >
                {translate('buttons.clearFilters', '清除筛选')}
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversationId}
              onSelect={() => onSelectConversation(conversation.id)}
              onRename={onRenameConversation}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 高级过滤面板 */}
      <AdvancedFilter
        open={showFilterPanel}
        onOpenChange={setShowFilterPanel}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

        </>
      )}

      {!isCollapsed && (
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
              onOpenAnalytics?.()
            }}
            title="数据分析"
          >
            <BarChart3 className="w-4 h-4" />
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
      )}
    </aside>
  )
}

