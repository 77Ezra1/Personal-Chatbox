import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Trash, PencilLine, Check, X as CloseIcon } from 'lucide-react'

/**
 * 对话列表项组件
 * 显示单个对话,支持重命名和删除
 */
export function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(conversation.title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  useEffect(() => {
    setDraftTitle(conversation.title)
  }, [conversation.title])

  const commitRename = useCallback(() => {
    const nextTitle = draftTitle.trim()
    if (nextTitle && nextTitle !== conversation.title) {
      onRename(conversation.id, nextTitle)
    } else {
      setDraftTitle(conversation.title)
    }
    setIsEditing(false)
  }, [conversation.id, conversation.title, draftTitle, onRename])

  const cancelRename = useCallback(() => {
    setDraftTitle(conversation.title)
    setIsEditing(false)
  }, [conversation.title])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }

  return (
    <div className={`conversation-item ${isActive ? 'active' : ''}`}>
      <button type="button" onClick={onSelect} className="conversation-item-main">
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        {isEditing ? (
          <input
            ref={inputRef}
            className="conversation-title-input"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            aria-label="Rename conversation"
          />
        ) : (
          <span className="conversation-title" title={conversation.title}>
            {conversation.title}
          </span>
        )}
      </button>
      <div className="conversation-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="conversation-action"
              onClick={commitRename}
              aria-label="Save name"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="conversation-action"
              onClick={cancelRename}
              aria-label="Cancel rename"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="conversation-action"
            onClick={(event) => {
              event.stopPropagation()
              setIsEditing(true)
            }}
            aria-label="Rename conversation"
          >
            <PencilLine className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          className="conversation-action"
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.(conversation.id, conversation.title)
          }}
          aria-label="Delete conversation"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

