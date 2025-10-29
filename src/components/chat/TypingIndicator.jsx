import { useState, useEffect } from 'react'
import { Brain, Sparkles, Zap, MessageSquare } from 'lucide-react'
import './TypingIndicator.css'

/**
 * 打字指示器组件
 * 显示 AI 正在思考和生成回复的动态效果
 */
export function TypingIndicator({ type = 'default', message, showIcon = true }) {
  const [dots, setDots] = useState('')
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [iconIndex, setIconIndex] = useState(0)

  // 动态思考文案
  const thinkingPhrases = [
    '正在思考',
    '分析问题',
    '生成回复',
    '整理思路',
    '准备答案'
  ]

  const icons = [Brain, Sparkles, Zap, MessageSquare]

  // 动画点点效果
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // 切换思考文案
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase(prev => (prev + 1) % thinkingPhrases.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [thinkingPhrases.length])

  // 切换图标
  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex(prev => (prev + 1) % icons.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [icons.length])

  const CurrentIcon = icons[iconIndex]

  if (type === 'minimal') {
    // 简约模式 - 只显示动态点点
    return (
      <div className="typing-indicator-minimal">
        <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
        <span className="typing-dot" style={{ animationDelay: '160ms' }}></span>
        <span className="typing-dot" style={{ animationDelay: '320ms' }}></span>
      </div>
    )
  }

  if (type === 'simple') {
    // 简单模式 - 文字 + 点点
    return (
      <div className="typing-indicator-simple">
        <div className="typing-dots-wrapper">
          <span className="typing-dot-bounce"></span>
          <span className="typing-dot-bounce"></span>
          <span className="typing-dot-bounce"></span>
        </div>
        <span className="typing-text">
          {message || '正在输入'}{dots}
        </span>
      </div>
    )
  }

  // 默认模式 - 完整动画
  return (
    <div className="typing-indicator-enhanced">
      {showIcon && (
        <div className="typing-icon-wrapper">
          <CurrentIcon className="typing-icon" />
          <div className="typing-icon-pulse"></div>
        </div>
      )}
      <div className="typing-content">
        <div className="typing-phrase-container">
          <span className="typing-phrase">{thinkingPhrases[currentPhrase]}</span>
          <span className="typing-dots">{dots}</span>
        </div>
        <div className="typing-progress-bar">
          <div className="typing-progress-fill"></div>
        </div>
      </div>
    </div>
  )
}
