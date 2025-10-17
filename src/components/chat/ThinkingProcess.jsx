import { useState, useEffect, useMemo } from 'react'
import { Brain, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import './ThinkingProcess.css'

/**
 * 思考过程组件 - 优化版
 * 提供更好的思考过程可视化和交互体验
 */
export function ThinkingProcess({
  reasoning,
  isStreaming = false,
  translate = (key, fallback) => fallback
}) {
  const [isOpen, setIsOpen] = useState(true) // 默认展开,更好的用户体验
  const [displayedContent, setDisplayedContent] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  // 计算思考统计信息
  const stats = useMemo(() => {
    if (!reasoning) return { chars: 0, words: 0, lines: 0 }
    return {
      chars: reasoning.length,
      words: reasoning.split(/\s+/).filter(Boolean).length,
      lines: reasoning.split('\n').filter(line => line.trim()).length
    }
  }, [reasoning])

  // 解析思考步骤
  const thinkingSteps = useMemo(() => {
    if (!reasoning) return []
    
    // 尝试分割成多个步骤（基于换行或特定标记）
    const steps = reasoning
      .split(/\n\n+/)
      .filter(step => step.trim().length > 0)
      .map((step, index) => ({
        id: index,
        content: step.trim()
      }))
    
    return steps
  }, [reasoning])

  // 流式显示效果
  useEffect(() => {
    if (!isStreaming || !reasoning) {
      setDisplayedContent(reasoning || '')
      return
    }

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= reasoning.length) {
        setDisplayedContent(reasoning.slice(0, currentIndex))
        currentIndex += 3 // 每次显示3个字符
      } else {
        clearInterval(interval)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [reasoning, isStreaming])

  // 光标闪烁效果
  useEffect(() => {
    if (!isStreaming) {
      setShowCursor(false)
      return
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  if (!reasoning && !isStreaming) {
    return null
  }

  const hasMultipleSteps = thinkingSteps.length > 1

  return (
    <div className={`thinking-process-enhanced ${isOpen ? 'is-open' : ''} ${isStreaming ? 'is-streaming' : ''}`}>
      {/* 头部 */}
      <button
        className="thinking-process-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="thinking-process-title">
          <div className="thinking-icon-wrapper">
            {isStreaming ? (
              <Loader2 className="thinking-icon animate-spin" />
            ) : (
              <Brain className="thinking-icon" />
            )}
            <Sparkles className="thinking-sparkle" />
          </div>
          <span className="thinking-label">
            {isStreaming 
              ? translate('sections.thinkingInProgress', '正在思考中...')
              : translate('sections.thinkingProcess', '思考过程')
            }
          </span>
          {!isStreaming && (
            <div className="thinking-stats">
              {hasMultipleSteps && (
                <span className="thinking-stat-badge">
                  {thinkingSteps.length} {translate('labels.steps', '步骤')}
                </span>
              )}
              <span className="thinking-stat-badge">
                {stats.words} {translate('labels.words', '词')}
              </span>
              <span className="thinking-stat-badge">
                {stats.lines} {translate('labels.lines', '行')}
              </span>
            </div>
          )}
          {isStreaming && (
            <span className="thinking-stat-badge streaming-badge">
              {translate('labels.processing', '处理中')} <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />
            </span>
          )}
        </div>
        <div className="thinking-process-toggle-icon">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* 内容区域 */}
      {isOpen && (
        <div className="thinking-process-body">
          {hasMultipleSteps ? (
            // 多步骤展示
            <div className="thinking-steps">
              {thinkingSteps.map((step, index) => (
                <div key={step.id} className="thinking-step">
                  <div className="thinking-step-header">
                    <span className="thinking-step-number">{index + 1}</span>
                    <span className="thinking-step-label">
                      {translate('labels.step', '步骤')} {index + 1}
                    </span>
                  </div>
                  <div className="thinking-step-content">
                    <MarkdownRenderer 
                      content={index === thinkingSteps.length - 1 ? displayedContent : step.content}
                      isStreaming={isStreaming && index === thinkingSteps.length - 1}
                    />
                    {isStreaming && index === thinkingSteps.length - 1 && showCursor && (
                      <span className="thinking-cursor">▊</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 单一内容展示
            <div className="thinking-content-single">
              <MarkdownRenderer 
                content={displayedContent}
                isStreaming={isStreaming}
              />
              {isStreaming && showCursor && (
                <span className="thinking-cursor">▊</span>
              )}
            </div>
          )}

          {/* 思考进度条 (仅在流式输出时显示) */}
          {isStreaming && (
            <div className="thinking-progress">
              <div className="thinking-progress-bar">
                <div className="thinking-progress-fill"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
