/**
 * 聊天区域头部组件
 * 显示对话标题和操作按钮
 */
export function ChatHeader({
  title
}) {
  return (
    <header className="chat-header">
      <h1 className="chat-title">{title}</h1>
    </header>
  )
}

