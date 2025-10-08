import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

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

export function MarkdownRenderer({ content, className, isStreaming = false }) {
  const text = typeof content === 'string' ? content : String(content ?? '')
  if (!text.trim()) {
    return null
  }

  return (
    <div className={cn('markdown-body', className, isStreaming && 'streaming')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
