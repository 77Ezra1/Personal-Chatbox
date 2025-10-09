import { Plus, Trash } from 'lucide-react'
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
  translate
}) {
  const handleDelete = (id, title) => {
    if (confirm(`确定要删除对话"${title}"吗?`)) {
      onDeleteConversation(id)
    }
  }

  const handleClearAll = () => {
    if (confirm('确定要清除所有对话吗?')) {
      onClearAll()
    }
  }

  return (
    <aside className="sidebar">
      {/* 头部 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {translate('headings.conversation', 'Conversation')}
        </h2>
        <div className="sidebar-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            title={translate('buttons.newConversation', 'New conversation')}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearAll}
            title={translate('tooltips.clearConversations', 'Clear all conversations')}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
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
    </aside>
  )
}

