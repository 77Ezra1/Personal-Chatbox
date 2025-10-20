/**
 * AI助手对话面板
 * 在笔记编辑时提供AI对话辅助功能
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import './AIAssistantPanel.css';

export function AIAssistantPanel({ noteContent, onInsertText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息到AI
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 添加用户消息
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: Date.now() }
    ];
    setMessages(newMessages);

    setIsLoading(true);

    try {
      // 调用后端笔记 AI 问答接口
      const response = await fetch('/api/ai/notes/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 使用 cookie 认证
        body: JSON.stringify({
          question: userMessage,
          content: noteContent || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI request failed');
      }

      const data = await response.json();
      const aiMessage = data.answer || '抱歉，我无法回答这个问题。';

      // 添加AI回复
      setMessages([
        ...newMessages,
        { role: 'assistant', content: aiMessage, timestamp: Date.now() }
      ]);
    } catch (error) {
      console.error('AI request error:', error);
      toast.error('AI请求失败，请检查网络连接');

      // 添加错误消息
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '抱歉，我现在无法回答。请稍后再试。',
          timestamp: Date.now(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 快捷操作
  const quickActions = [
    { label: '总结笔记', icon: '📝', prompt: '请帮我总结一下这篇笔记的要点' },
    { label: '扩展内容', icon: '✨', prompt: '请帮我扩展这部分内容，使其更详细' },
    { label: '检查语法', icon: '✅', prompt: '请帮我检查这篇笔记的语法和表达' },
    { label: '提取TODO', icon: '📋', prompt: '请帮我从笔记中提取所有待办事项' }
  ];

  const handleQuickAction = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // 插入AI回复到编辑器
  const handleInsertToEditor = (content) => {
    if (onInsertText) {
      onInsertText(content);
      toast.success('已插入到编辑器');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant-panel">
      {/* 快捷操作 */}
      {messages.length === 0 && (
        <div className="ai-quick-actions">
          <div className="quick-actions-header">
            <span className="quick-actions-icon">🤖</span>
            <span className="quick-actions-title">AI助手</span>
          </div>
          <div className="quick-actions-hint">选择快捷操作或直接提问</div>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.prompt)}
              >
                <span className="quick-action-icon">{action.icon}</span>
                <span className="quick-action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      {messages.length > 0 && (
        <div className="ai-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-message ${message.role} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                {message.role === 'assistant' && !message.isError && (
                  <button
                    className="message-action"
                    onClick={() => handleInsertToEditor(message.content)}
                    title="插入到编辑器"
                  >
                    ⬇ 插入
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ai-message assistant loading">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-text">
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 输入框 */}
      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          className="ai-input"
          placeholder="向AI助手提问... (Shift+Enter 换行，Enter 发送)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isLoading}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
