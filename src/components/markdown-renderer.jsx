import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { cn } from '@/lib/utils.js'

function InlineCode({ className, children, ...props }) {
  return (
    <code className={cn('markdown-code-inline', className)} {...props}>
      {children}
    </code>
  )
}

function CodeBlock({ className, code = '', ...props }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const language = useMemo(() => {
    const match = /language-([\w+-]+)/.exec(className ?? '')
    return match?.[1] ?? ''
  }, [className])

  const handleCopy = async () => {
    const value = code
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
    } catch (error) {
      console.error('[Markdown] Failed to copy code', error)
      setCopied(false)
    }
  }

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-toolbar">
        <span className="markdown-code-language">{language || 'text'}</span>
        <button
          type="button"
          className="markdown-code-copy"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <ScrollArea className="markdown-code-scroll">
        <pre>
          <code className={className} {...props}>
            {code}
          </code>
        </pre>
      </ScrollArea>
    </div>
  )
}

/**
 * 思考过程折叠框组件
 */
function ThinkingProcess({ content }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="thinking-process-container">
      <button
        className="thinking-process-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span>思考过程</span>
      </button>
      {isExpanded && (
        <div className="thinking-process-content">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MARKDOWN_COMPONENTS}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

const MARKDOWN_COMPONENTS = {
  h1: ({ className, ...props }) => <h1 className={cn('markdown-heading-1', className)} {...props} />,
  h2: ({ className, ...props }) => <h2 className={cn('markdown-heading-2', className)} {...props} />,
  h3: ({ className, ...props }) => <h3 className={cn('markdown-heading-3', className)} {...props} />,
  h4: ({ className, ...props }) => <h4 className={cn('markdown-heading-4', className)} {...props} />,
  p: ({ className, ...props }) => <p className={cn('markdown-paragraph', className)} {...props} />,
  ul: ({ className, ...props }) => <ul className={cn('markdown-list', className)} {...props} />,
  ol: ({ className, ...props }) => <ol className={cn('markdown-list ordered', className)} {...props} />,
  li: ({ className, ...props }) => <li className={cn('markdown-list-item', className)} {...props} />,
  blockquote: ({ className, ...props }) => <blockquote className={cn('markdown-blockquote', className)} {...props} />,
  a: ({ className, ...props }) => (
    <a className={className} target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ inline, className, children, ...props }) => {
    const content = String(children ?? '').replace(/\n$/, '')
    if (inline) {
      return (
        <InlineCode className={className} {...props}>
          {content}
        </InlineCode>
      )
    }
    return <CodeBlock className={className} code={content} {...props} />
  }
}

/**
 * 解析MCP工具调用标记
 * 格式: < | tool_calls_begin | >< | tool_call_begin | >...< | tool_call_end | >...< | tool_calls_end | >
 */
function parseMCPContent(text) {
  const parts = []
  let currentIndex = 0
  
  // 正则匹配 tool_calls 块
  const toolCallsRegex = /<\s*\|\s*tool_calls_begin\s*\|\s*>([\s\S]*?)<\s*\|\s*tool_calls_end\s*\|\s*>/g
  
  let match
  while ((match = toolCallsRegex.exec(text)) !== null) {
    // 添加工具调用之前的内容
    if (match.index > currentIndex) {
      const beforeContent = text.substring(currentIndex, match.index).trim()
      if (beforeContent) {
        parts.push({ type: 'content', text: beforeContent })
      }
    }
    
    // 提取工具调用内容
    const toolCallsContent = match[1]
    
    // 解析单个工具调用
    const toolCallRegex = /<\s*\|\s*tool_call_begin\s*\|\s*>([\s\S]*?)<\s*\|\s*tool_call_end\s*\|\s*>/g
    let toolMatch
    let thinkingContent = ''
    
    while ((toolMatch = toolCallRegex.exec(toolCallsContent)) !== null) {
      thinkingContent += toolMatch[1] + '\n\n'
    }
    
    if (thinkingContent.trim()) {
      parts.push({ type: 'thinking', text: thinkingContent.trim() })
    }
    
    currentIndex = match.index + match[0].length
  }
  
  // 添加剩余内容
  if (currentIndex < text.length) {
    const remainingContent = text.substring(currentIndex).trim()
    if (remainingContent) {
      parts.push({ type: 'content', text: remainingContent })
    }
  }
  
  return parts
}

export function MarkdownRenderer({ content, className, isStreaming = false }) {
  const text = typeof content === 'string' ? content : String(content ?? '')
  if (!text.trim()) {
    return null
  }

  // 解析内容
  const parts = useMemo(() => parseMCPContent(text), [text])
  
  // 如果没有MCP标记,直接渲染
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'content')) {
    return (
      <div className={cn('markdown-body', className, isStreaming && 'streaming')}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MARKDOWN_COMPONENTS}>
          {text}
        </ReactMarkdown>
      </div>
    )
  }
  
  // 渲染包含MCP内容的消息
  return (
    <div className={cn('markdown-body', className, isStreaming && 'streaming')}>
      {parts.map((part, index) => {
        if (part.type === 'thinking') {
          return <ThinkingProcess key={index} content={part.text} />
        }
        return (
          <div key={index}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MARKDOWN_COMPONENTS}>
              {part.text}
            </ReactMarkdown>
          </div>
        )
      })}
    </div>
  )
}

