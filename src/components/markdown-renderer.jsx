import { useEffect, useMemo, useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { cn } from '@/lib/utils.js'

// 导入样式
import 'katex/dist/katex.min.css'

import { createLogger } from '../lib/logger'
const logger = createLogger('MarkdownRenderer')


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
      logger.error('[Markdown] Failed to copy code', error)
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
const ThinkingProcess = memo(function ThinkingProcess({ content }) {
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
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]} 
            rehypePlugins={[rehypeKatex]}
            components={MARKDOWN_COMPONENTS}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
})

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
  // 表格组件
  table: ({ className, ...props }) => (
    <div className="markdown-table-wrapper">
      <table className={cn('markdown-table', className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => <thead className={className} {...props} />,
  tbody: ({ className, ...props }) => <tbody className={className} {...props} />,
  tr: ({ className, ...props }) => <tr className={className} {...props} />,
  th: ({ className, ...props }) => <th className={className} {...props} />,
  td: ({ className, ...props }) => <td className={className} {...props} />,
  // 图片懒加载
  img: ({ className, src, alt, ...props }) => (
    <img 
      className={cn('markdown-image', className)} 
      src={src}
      alt={alt}
      loading="lazy"
      {...props}
    />
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
 * 解析MCP工具调用标记和思考过程
 * 支持三种格式:
 * 1. MCP格式: < | tool_calls_begin | >...< | tool_calls_end | >
 * 2. DeepSeek-chat格式: <thinking>...</thinking> 和 <tool_call>...</tool_call>
 * 3. DeepSeek-reasoner格式: <reasoning>...</reasoning> 和 <answer>...</answer>
 */
function parseMCPContent(text) {
  const parts = []
  let processedText = text
  
  // 首先提取所有思考过程和工具调用内容
  let thinkingContent = ''
  
  // 提取 <thinking> 标签内容 (deepseek-chat)
  processedText = processedText.replace(/<thinking>([\s\S]*?)<\/thinking>/gi, (match, content) => {
    thinkingContent += content.trim() + '\n\n'
    return ''
  })
  
  // 提取 <reasoning> 标签内容 (deepseek-reasoner)
  processedText = processedText.replace(/<reasoning>([\s\S]*?)<\/reasoning>/gi, (match, content) => {
    thinkingContent += content.trim() + '\n\n'
    return ''
  })
  
  // 提取 <tool_call> 标签内容
  processedText = processedText.replace(/<tool_call>([\s\S]*?)<\/tool_call>/gi, (match, content) => {
    thinkingContent += '**工具调用:**\n```json\n' + content.trim() + '\n```\n\n'
    return ''
  })
  
  // 移除 <answer> 标签但保留内容 (deepseek-reasoner)
  processedText = processedText.replace(/<answer>([\s\S]*?)<\/answer>/gi, '$1')
  
  // 提取 MCP 格式的工具调用
  const mcpToolCallsRegex = /<\s*\|\s*tool_calls_begin\s*\|\s*>([\s\S]*?)<\s*\|\s*tool_calls_end\s*\|\s*>/g
  let mcpMatch
  while ((mcpMatch = mcpToolCallsRegex.exec(text)) !== null) {
    const toolCallsContent = mcpMatch[1]
    
    // 解析单个工具调用
    const toolCallItemRegex = /<\s*\|\s*tool_call_begin\s*\|\s*>([\s\S]*?)<\s*\|\s*tool_call_end\s*\|\s*>/g
    let toolMatch
    
    while ((toolMatch = toolCallItemRegex.exec(toolCallsContent)) !== null) {
      thinkingContent += toolMatch[1] + '\n\n'
    }
    
    // 从原文中移除
    processedText = processedText.replace(mcpMatch[0], '')
  }
  
  // 清理处理后的文本
  processedText = processedText.trim()
  
  // 构建结果
  if (thinkingContent.trim()) {
    parts.push({ type: 'thinking', text: thinkingContent.trim() })
  }
  
  if (processedText) {
    parts.push({ type: 'content', text: processedText })
  }
  
  return parts
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, className, isStreaming = false }) {
  const text = typeof content === 'string' ? content : String(content ?? '')
  
  // 缓存解析结果
  const parts = useMemo(() => {
    if (!text.trim()) return []
    return parseMCPContent(text)
  }, [text])
  
  // 缓存渲染内容
  const renderedContent = useMemo(() => {
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'content')) {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={MARKDOWN_COMPONENTS}
        >
          {text}
        </ReactMarkdown>
      )
    }
    
    return parts.map((part, index) => {
      if (part.type === 'thinking') {
        return <ThinkingProcess key={index} content={part.text} />
      }
      return (
        <div key={index}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={MARKDOWN_COMPONENTS}
          >
            {part.text}
          </ReactMarkdown>
        </div>
      )
    })
  }, [parts, text])
  
  if (!text.trim()) {
    return null
  }

  return (
    <div className={cn('markdown-body', className, isStreaming && 'streaming')}>
      {renderedContent}
    </div>
  )
})

