import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Languages, Moon, Plus, Settings, Sun, Trash, Trash2, LogOut, User, PanelLeftClose, PanelLeftOpen, Bot, Workflow, Brain, FileText, Store, MessageSquare, BookOpen, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationItem } from './ConversationItem'
import { SearchBar } from './SearchBar'
import { AdvancedFilter } from './AdvancedFilter'
import { LanguageToggle } from '@/components/common/LanguageSwitcher'
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
  const location = useLocation()

  // 侧边栏折叠状态
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 导航菜单项
  const navigationItems = [
    { path: '/', icon: MessageSquare, label: translate('sidebar.chat', 'Chat') },
    { path: '/agents', icon: Bot, label: translate('sidebar.agents', 'AI Agents'), badge: 'New' },
    { path: '/workflows', icon: Workflow, label: translate('sidebar.workflows', 'Workflows'), badge: 'New' },
    { path: '/notes', icon: FileText, label: translate('sidebar.notes', 'Notes'), badge: 'New' },
    { path: '/documents', icon: BookOpen, label: translate('sidebar.documents', 'Documents'), badge: 'New' },
    { path: '/password-vault', icon: Lock, label: translate('sidebar.passwordVault', 'Password Vault'), badge: 'New' },
    { path: '/knowledge', icon: Brain, label: translate('sidebar.knowledge', 'Knowledge'), badge: 'Beta' },
  ]

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
      title: translate('sidebar.logout', 'Logout'),
      message: translate('sidebar.logoutConfirm', 'Are you sure you want to logout?'),
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
      {/* 折叠状态的展开按钮 */}
      {isCollapsed && (
        <button
          className="sidebar-toggle-btn-collapsed"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={translate('sidebar.expandSidebar', 'Expand Sidebar')}
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {!isCollapsed && (
        <>
          {/* 头部 - 新建对话和折叠按钮 */}
          <div className="sidebar-header">
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

            {/* 折叠/展开按钮 */}
            <button
              className="sidebar-toggle-btn-inline"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={translate('sidebar.collapseSidebar', 'Collapse Sidebar')}
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="px-3 py-2 space-y-1 border-b border-border/40 mb-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative
                    ${isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                      ${item.badge === 'New'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

      {/* 搜索栏 */}
      <div className="px-3 py-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          isSearching={isSearching}
          onFilterClick={() => setShowFilterPanel(true)}
          hasActiveFilters={hasActiveFilters}
          translate={translate}
        />
      </div>

      {/* 对话列表 */}
      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery || hasActiveFilters
                ? translate('sidebar.noSearchResults', 'No matching conversations found')
                : translate('sidebar.noConversations', 'No conversations yet')}
            </p>
            {(searchQuery || hasActiveFilters) && (
              <Button
                variant="link"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2"
              >
                {translate('sidebar.clearFilters', 'Clear Filters')}
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
        translate={translate}
      />

        </>
      )}

      {!isCollapsed && (
      <div className="sidebar-footer">
        <div className="sidebar-footer-actions">
          {/* Clear All Button */}
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

          {/* Action Buttons Row */}
          <div className="sidebar-footer-tools">
            <LanguageToggle
              variant="ghost"
              size="sm"
              className="sidebar-language-button"
            />

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
              title={translate('sidebar.analytics', 'Analytics')}
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
      </div>
      )}
    </aside>
  )
}

