import { useState, useEffect } from 'react'
import { MessageSquare, Settings, Plus, Moon, Sun, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [conversations, setConversations] = useState([
    { id: 1, title: '新对话', messages: [] }
  ])
  const [currentConvId, setCurrentConvId] = useState(1)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // 模型配置
  const [modelConfig, setModelConfig] = useState({
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const currentConv = conversations.find(c => c.id === currentConvId)

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    // 更新对话
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId 
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ))

    setInputMessage('')
    setIsTyping(true)

    // 模拟AI回复
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '这是一个演示回复。在实际应用中，这里会调用配置的AI模型API来生成回复。您可以在右侧配置面板中设置API密钥和模型参数。',
        timestamp: new Date()
      }

      setConversations(prev => prev.map(conv => 
        conv.id === currentConvId 
          ? { ...conv, messages: [...conv.messages, aiMessage] }
          : conv
      ))
      setIsTyping(false)
    }, 1500)
  }

  const createNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: `新对话 ${conversations.length + 1}`,
      messages: []
    }
    setConversations([...conversations, newConv])
    setCurrentConvId(newConv.id)
  }

  return (
    <div className="app-container">
      {/* 左侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Button 
            onClick={createNewConversation}
            className="new-chat-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            新对话
          </Button>
        </div>

        <div className="conversation-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setCurrentConvId(conv.id)}
              className={`conversation-item ${conv.id === currentConvId ? 'active' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{conv.title}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </aside>

      {/* 主对话区域 */}
      <main className="chat-area">
        <div className="chat-header">
          <h2 className="chat-title">{currentConv?.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConfig(!showConfig)}
            className="config-toggle"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="messages-container">
          {currentConv?.messages.length === 0 ? (
            <div className="empty-state">
              <Sparkles className="w-16 h-16 mb-4 text-primary/30" />
              <h3 className="text-2xl font-semibold mb-2">开始新对话</h3>
              <p className="text-muted-foreground">输入消息开始与AI对话</p>
            </div>
          ) : (
            currentConv?.messages.map(msg => (
              <div
                key={msg.id}
                className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="message message-ai">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入消息..."
              className="message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              size="icon"
              className="send-button"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* 右侧配置面板 */}
      {showConfig && (
        <aside className="config-panel">
          <div className="config-header">
            <h3 className="text-lg font-semibold">模型配置</h3>
          </div>

          <div className="config-content">
            <div className="config-section">
              <label className="config-label">AI提供商</label>
              <select
                value={modelConfig.provider}
                onChange={(e) => setModelConfig({...modelConfig, provider: e.target.value})}
                className="config-select"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>

            <div className="config-section">
              <label className="config-label">模型</label>
              <select
                value={modelConfig.model}
                onChange={(e) => setModelConfig({...modelConfig, model: e.target.value})}
                className="config-select"
              >
                {modelConfig.provider === 'openai' && (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {modelConfig.provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </>
                )}
                {modelConfig.provider === 'google' && (
                  <>
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-ultra">Gemini Ultra</option>
                  </>
                )}
              </select>
            </div>

            <div className="config-section">
              <label className="config-label">API密钥</label>
              <input
                type="password"
                value={modelConfig.apiKey}
                onChange={(e) => setModelConfig({...modelConfig, apiKey: e.target.value})}
                placeholder="输入API密钥"
                className="config-input"
              />
            </div>

            <div className="config-section">
              <label className="config-label">
                Temperature: {modelConfig.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => setModelConfig({...modelConfig, temperature: parseFloat(e.target.value)})}
                className="config-slider"
              />
            </div>

            <div className="config-section">
              <label className="config-label">最大Token数</label>
              <input
                type="number"
                value={modelConfig.maxTokens}
                onChange={(e) => setModelConfig({...modelConfig, maxTokens: parseInt(e.target.value)})}
                className="config-input"
              />
            </div>

            <Button
              onClick={() => {
                localStorage.setItem('modelConfig', JSON.stringify(modelConfig))
                alert('配置已保存')
              }}
              className="w-full mt-4"
            >
              保存配置
            </Button>
          </div>
        </aside>
      )}
    </div>
  )
}

export default App
