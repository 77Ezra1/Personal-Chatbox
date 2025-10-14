import { useEffect, useMemo, useRef, useState } from 'react'

import { createLogger } from '../lib/logger'
const logger = createLogger('useConversations')


const STORAGE_KEY = 'ai-chat-conversations.v1'

const DEFAULT_TITLE = '新对话'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const ensureISOTime = (value) => {
  if (!value) return new Date().toISOString()
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

const sanitizeAttachments = (input) => {
  if (!Array.isArray(input)) return []
  return input
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const type = typeof item.type === 'string' ? item.type : ''
      const category = typeof item.category === 'string'
        ? item.category
        : type.startsWith('image/')
          ? 'image'
          : 'file'
      return {
        id: item.id ?? createId(),
        name: typeof item.name === 'string' ? item.name : '',
        size: Number(item.size) || 0,
        type,
        dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : '',
        lastModified: item.lastModified ?? undefined,
        category
      }
    })
    .filter(Boolean)
}

const sanitizeMessage = (msg) => {
  if (!msg || typeof msg !== 'object') {
    return null
  }

  const role = typeof msg.role === 'string' ? msg.role : 'assistant'
  const content = typeof msg.content === 'string'
    ? msg.content
    : String(msg.content ?? '')

  return {
    id: msg.id ?? createId(),
    role,
    content,
    timestamp: ensureISOTime(msg.timestamp),
    metadata: typeof msg.metadata === 'object' && msg.metadata !== null
      ? { ...msg.metadata }
      : {},
    status: typeof msg.status === 'string' ? msg.status : 'done',
    attachments: sanitizeAttachments(msg.attachments)
  }
}

const sanitizeConversation = (conversation, index = 0) => {
  if (!conversation || typeof conversation !== 'object') {
    return null
  }

  const messages = Array.isArray(conversation.messages)
    ? conversation.messages
        .map(sanitizeMessage)
        .filter(Boolean)
    : []

  return {
    id: conversation.id ?? createId(),
    title: typeof conversation.title === 'string' && conversation.title.trim()
      ? conversation.title.trim()
      : `${DEFAULT_TITLE} ${index + 1}`,
    createdAt: ensureISOTime(conversation.createdAt),
    messages
  }
}

const createConversation = (title = DEFAULT_TITLE, index = 0) => ({
  id: createId(),
  title: index === 0 ? title : `${title} ${index + 1}`,
  createdAt: new Date().toISOString(),
  messages: []
})

const createMessage = ({
  role,
  content = '',
  metadata = {},
  status = 'done',
  timestamp,
  id,
  attachments = []
}) => ({
  id: id ?? createId(),
  role,
  content,
  timestamp: ensureISOTime(timestamp),
  metadata,
  status,
  attachments: sanitizeAttachments(attachments)
})

const loadStoredConversations = () => {
  if (typeof window === 'undefined') return [createConversation()]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [createConversation()]
    const parsed = JSON.parse(raw)
    const conversations = Array.isArray(parsed)
      ? parsed.map((conv, index) => sanitizeConversation(conv, index)).filter(Boolean)
      : []
    if (conversations.length === 0) {
      return [createConversation()]
    }
    return conversations
  } catch (error) {
    logger.warn('[Conversations] Failed to load from localStorage', error)
    return [createConversation()]
  }
}

export function useConversations() {
  const initialDataRef = useRef(null)
  if (initialDataRef.current === null) {
    initialDataRef.current = loadStoredConversations()
  }

  const [conversations, setConversations] = useState(initialDataRef.current)
  const [currentId, setCurrentId] = useState(() => initialDataRef.current[0]?.id ?? createConversation().id)

  // Persist to storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch (error) {
      logger.warn('[Conversations] Failed to persist to localStorage', error)
    }
  }, [conversations])

  // Ensure current conversation id is valid
  useEffect(() => {
    if (conversations.length === 0) {
      const fallback = createConversation()
      setConversations([fallback])
      setCurrentId(fallback.id)
      return
    }

    const exists = conversations.some(conv => conv.id === currentId)
    if (!exists) {
      setCurrentId(conversations[0].id)
    }
  }, [conversations, currentId])

  const currentConversation = useMemo(
    () => conversations.find(conv => conv.id === currentId) ?? conversations[0],
    [conversations, currentId]
  )

  const selectConversation = (id) => {
    if (!id) return
    setCurrentId(id)
  }

  const addConversation = (title) => {
    setConversations(prev => {
      const next = [...prev, createConversation(title, prev.length)]
      const added = next[next.length - 1]
      setCurrentId(added.id)
      return next
    })
  }

  const renameConversation = (id, title) => {
    if (!id) return
    setConversations(prev => prev.map(conv => (
      conv.id === id
        ? { ...conv, title: title?.trim() || conv.title }
        : conv
    )))
  }

  const removeConversation = (id) => {
    if (!id) return
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id)
      if (filtered.length === 0) {
        const fallback = createConversation()
        setCurrentId(fallback.id)
        return [fallback]
      }
      if (currentId === id) {
        setCurrentId(filtered[0].id)
      }
      return filtered
    })
  }

  const clearAllConversations = () => {
    const fallback = createConversation()
    setConversations([fallback])
    setCurrentId(fallback.id)
  }

  const appendMessage = (conversationId, messageInput) => {
    if (!conversationId) return null
    const message = sanitizeMessage(messageInput) ?? createMessage({
      role: messageInput?.role ?? 'assistant',
      content: messageInput?.content ?? ''
    })

    setConversations(prev => prev.map(conv => (
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    )))

    return message
  }

  const updateMessage = (conversationId, messageId, updater) => {
    if (!conversationId || !messageId || typeof updater !== 'function') return
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv
      const nextMessages = conv.messages.map(msg => {
        if (msg.id !== messageId) return msg
        const updated = updater(msg)
        return sanitizeMessage({ ...msg, ...updated })
      })
      return { ...conv, messages: nextMessages }
    }))
  }

  const replaceConversationMessages = (conversationId, messages = []) => {
    if (!conversationId) return
    setConversations(prev => prev.map(conv => (
      conv.id === conversationId
        ? {
            ...conv,
            messages: messages
              .map(sanitizeMessage)
              .filter(Boolean)
          }
        : conv
    )))
  }

  const deleteMessage = (conversationId, messageId) => {
    if (!conversationId || !messageId) return
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv
      return {
        ...conv,
        messages: conv.messages.filter(msg => msg.id !== messageId)
      }
    }))
  }

  const editMessage = (conversationId, messageId, newContent) => {
    if (!conversationId || !messageId) return
    updateMessage(conversationId, messageId, (prev) => ({
      ...prev,
      content: newContent,
      edited: true,
      editedAt: new Date().toISOString()
    }))
  }

  return {
    conversations,
    currentConversation,
    currentConversationId: currentId,
    selectConversation,
    addConversation,
    renameConversation,
    removeConversation,
    clearAllConversations,
    appendMessage,
    updateMessage,
    replaceConversationMessages,
    deleteMessage,
    editMessage
  }
}

export const conversationUtils = {
  createMessage,
  createConversation
}
