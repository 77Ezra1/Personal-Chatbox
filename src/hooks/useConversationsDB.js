import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_TITLE = '新对话';

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const ensureISOTime = (value) => {
  if (!value) return new Date().toISOString();
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const sanitizeAttachments = (input) => {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const type = typeof item.type === 'string' ? item.type : '';
      const category = typeof item.category === 'string'
        ? item.category
        : type.startsWith('image/')
          ? 'image'
          : 'file';
      return {
        id: item.id ?? createId(),
        name: typeof item.name === 'string' ? item.name : '',
        size: Number(item.size) || 0,
        type,
        dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : '',
        lastModified: item.lastModified ?? undefined,
        category
      };
    })
    .filter(Boolean);
};

const sanitizeMessage = (msg) => {
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const role = typeof msg.role === 'string' ? msg.role : 'assistant';
  const content = typeof msg.content === 'string'
    ? msg.content
    : String(msg.content ?? '');

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
  };
};

const createConversation = (title = DEFAULT_TITLE, index = 0) => ({
  id: createId(),
  title: index === 0 ? title : `${title} ${index + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: []
});

const createMessage = ({
  role,
  content = '',
  metadata = {},
  status = 'done',
  attachments = []
}) => ({
  id: createId(),
  role,
  content,
  timestamp: new Date().toISOString(),
  metadata,
  status,
  attachments: sanitizeAttachments(attachments)
});

/**
 * 基于数据库的对话管理Hook
 */
export function useConversationsDB() {
  const { token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  // 从数据库加载对话
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user-data/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('加载对话失败');
      }

      const { conversations: conversationList } = await response.json();
      
      // 转换为对象格式
      const conversationsObj = {};
      conversationList.forEach(conv => {
        conversationsObj[conv.id] = conv;
      });

      setConversations(conversationsObj);

      // 如果没有对话,创建一个新对话
      if (conversationList.length === 0) {
        const newConv = createConversation(DEFAULT_TITLE, 0);
        setConversations({ [newConv.id]: newConv });
        setCurrentConversationId(newConv.id);
      } else {
        // 选择最新的对话
        const latestConv = conversationList.reduce((latest, conv) => {
          return new Date(conv.updated_at || conv.updatedAt) > new Date(latest.updated_at || latest.updatedAt)
            ? conv
            : latest;
        });
        setCurrentConversationId(latestConv.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('[useConversationsDB] Error loading conversations:', error);
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  // 保存对话到数据库
  const saveConversations = useCallback(async (conversationsToSave) => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch('/api/user-data/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ conversations: conversationsToSave })
      });

      if (!response.ok) {
        throw new Error('保存对话失败');
      }
    } catch (error) {
      console.error('[useConversationsDB] Error saving conversations:', error);
    }
  }, [token, isAuthenticated]);

  // 防抖保存
  const debouncedSave = useCallback((conversationsToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveConversations(conversationsToSave);
    }, 1000); // 1秒防抖
  }, [saveConversations]);

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 选择对话
  const selectConversation = useCallback((id) => {
    setCurrentConversationId(id);
  }, []);

  // 添加新对话
  const addConversation = useCallback((title = DEFAULT_TITLE) => {
    const existingCount = Object.keys(conversations).length;
    const newConv = createConversation(title, existingCount);
    
    setConversations(prev => {
      const updated = { ...prev, [newConv.id]: newConv };
      debouncedSave(updated);
      return updated;
    });
    
    setCurrentConversationId(newConv.id);
    return newConv.id;
  }, [conversations, debouncedSave]);

  // 清除所有对话
  const clearAllConversations = useCallback(() => {
    const newConv = createConversation(DEFAULT_TITLE, 0);
    setConversations({ [newConv.id]: newConv });
    setCurrentConversationId(newConv.id);
    debouncedSave({ [newConv.id]: newConv });
  }, [debouncedSave]);

  // 添加消息
  const appendMessage = useCallback((conversationId, message) => {
    setConversations(prev => {
      const conv = prev[conversationId];
      if (!conv) return prev;

      const sanitized = sanitizeMessage(message);
      if (!sanitized) return prev;

      const updated = {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: [...conv.messages, sanitized],
          updatedAt: new Date().toISOString()
        }
      };

      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // 更新消息
  const updateMessage = useCallback((conversationId, messageId, updater) => {
    setConversations(prev => {
      const conv = prev[conversationId];
      if (!conv) return prev;

      const updated = {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: conv.messages.map(msg => {
            if (msg.id !== messageId) return msg;
            const updates = typeof updater === 'function' ? updater(msg) : updater;
            return { ...msg, ...updates };
          }),
          updatedAt: new Date().toISOString()
        }
      };

      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // 重命名对话
  const renameConversation = useCallback((id, newTitle) => {
    setConversations(prev => {
      if (!prev[id]) return prev;

      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          title: newTitle,
          updatedAt: new Date().toISOString()
        }
      };

      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // 删除对话
  const removeConversation = useCallback((id) => {
    setConversations(prev => {
      const { [id]: removed, ...rest } = prev;
      
      // 如果删除的是当前对话,切换到其他对话
      if (id === currentConversationId) {
        const remainingIds = Object.keys(rest);
        if (remainingIds.length > 0) {
          setCurrentConversationId(remainingIds[0]);
        } else {
          // 如果没有剩余对话,创建一个新的
          const newConv = createConversation(DEFAULT_TITLE, 0);
          const updated = { [newConv.id]: newConv };
          setCurrentConversationId(newConv.id);
          debouncedSave(updated);
          return updated;
        }
      }

      debouncedSave(rest);
      return rest;
    });
  }, [currentConversationId, debouncedSave]);

  // 删除消息
  const deleteMessage = useCallback((conversationId, messageId) => {
    setConversations(prev => {
      const conv = prev[conversationId];
      if (!conv) return prev;

      const updated = {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: conv.messages.filter(msg => msg.id !== messageId),
          updatedAt: new Date().toISOString()
        }
      };

      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // 编辑消息
  const editMessage = useCallback((conversationId, messageId, newContent) => {
    setConversations(prev => {
      const conv = prev[conversationId];
      if (!conv) return prev;

      const updated = {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, content: newContent } : msg
          ),
          updatedAt: new Date().toISOString()
        }
      };

      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const currentConversation = conversations[currentConversationId] || null;

  return {
    conversations,
    currentConversation,
    currentConversationId,
    loading,
    selectConversation,
    addConversation,
    clearAllConversations,
    appendMessage,
    updateMessage,
    renameConversation,
    removeConversation,
    deleteMessage,
    editMessage,
    reload: loadConversations
  };
}

// 导出工具函数
export const conversationUtils = {
  createMessage,
  createConversation,
  sanitizeMessage,
  sanitizeAttachments
};

