import { useState, useEffect, useRef } from 'react'
import { RefreshCw, ExternalLink, FileCode, Eye, EyeOff, Code2, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './CodePreview.css'

/**
 * 代码预览组件
 * 支持代码查看和实时预览两种模式
 */
export function CodePreview({ messages, translate }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showIframe, setShowIframe] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [viewMode, setViewMode] = useState('code') // 'code' | 'preview'
  const [codeContent, setCodeContent] = useState('')
  const [fileName, setFileName] = useState('')
  const iframeRef = useRef(null)

  // 从消息中提取文件路径和代码内容
  useEffect(() => {
    if (!messages || messages.length === 0) return

    console.log('[CodePreview] Checking', messages.length, 'messages for HTML files and code...')

    // 查找最后一条包含文件路径的消息（检查tool和assistant消息）
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (!msg.content) continue

      // 支持tool和assistant消息
      if (msg.role === 'tool' || msg.role === 'assistant') {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        let detectedFileName = ''
        let detectedCode = ''

        console.log('[CodePreview] Checking', msg.role, 'message:', content.substring(0, 150) + '...')

        // 方式1: 检测 "Successfully wrote to xxx.html" （关键修复！）
        const successMatch = content.match(/Successfully wrote to\s+([^\s\n]+\.html)/i)
        if (successMatch) {
          detectedFileName = successMatch[1].split(/[\/\\]/).pop()
          console.log('[CodePreview] ✅ Detected file from success message:', detectedFileName, 'in', msg.role, 'message')
        }

        // 方式2: 检测文件名（任何提到的.html文件）
        if (!detectedFileName) {
          const htmlFileMatch = content.match(/([a-zA-Z0-9_\-]+\.html)/i)
          if (htmlFileMatch) {
            detectedFileName = htmlFileMatch[1]
            console.log('[CodePreview] Detected HTML file mention:', detectedFileName)
          }
        }

        // 方式3: 检测工具调用结果（MCP filesystem）
        if (!detectedFileName && (content.includes('write_file') || content.includes('write file'))) {
          const toolMatch = content.match(/([a-zA-Z0-9_\-]+\.html)/i)
          if (toolMatch) {
            detectedFileName = toolMatch[1]
            console.log('[CodePreview] Detected file from tool call:', detectedFileName)
          }
        }

        // 提取HTML代码块（支持未闭合的代码块，用于实时预览）
        const htmlCodeMatch = content.match(/```html\n([\s\S]*?)```/i)
        if (htmlCodeMatch) {
          detectedCode = htmlCodeMatch[1].trim()
          console.log('[CodePreview] Extracted HTML code (completed):', detectedCode.substring(0, 100) + '...')
        } else {
          // 尝试提取未闭合的代码块（AI正在生成中）
          const incompleteMatch = content.match(/```html\n([\s\S]+)$/i)
          if (incompleteMatch) {
            detectedCode = incompleteMatch[1].trim()
            console.log('[CodePreview] Extracted HTML code (streaming):', detectedCode.substring(0, 100) + '...')
          }
        }

        // 如果找到了文件名或代码，更新状态
        if (detectedFileName || detectedCode) {
          setFileName(detectedFileName)
          setPreviewUrl(detectedFileName ? `/${detectedFileName}` : null)
          setCodeContent(detectedCode)
          setLastUpdate(Date.now())
          setShowIframe(true)

          // 如果找到了代码，自动切换到代码模式查看实时生成
          if (detectedCode && !isGenerationComplete(content)) {
            setViewMode('code')
          } else if (detectedFileName) {
            // 如果生成完成且有文件，自动切换到预览模式
            setViewMode('preview')
          }
          break
        }
      }
    }
  }, [messages])

  // 判断代码生成是否完成
  const isGenerationComplete = (content) => {
    return content.includes('Successfully wrote to') ||
           content.includes('创建完成') ||
           content.includes('生成完成')
  }

  const handleRefresh = () => {
    setLastUpdate(Date.now())
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleOpenExternal = () => {
    if (previewUrl) {
      const fullUrl = `${window.location.origin}${previewUrl}`
      window.open(fullUrl, '_blank')
    }
  }

  const toggleIframe = () => {
    setShowIframe(prev => !prev)
  }

  // 调试日志
  console.log('[CodePreview] Render state:', {
    previewUrl,
    codeContent: codeContent ? `${codeContent.length} chars` : 'none',
    fileName,
    viewMode,
    messagesCount: messages?.length || 0
  })

  if (!previewUrl && !codeContent) {
    return (
      <div className="code-preview-empty">
        <FileCode className="empty-icon" size={48} />
        <h3>{translate?.('labels.noPreview', '暂无预览内容')}</h3>
        <p>{translate?.('labels.previewHint', 'AI生成HTML文件后，将自动显示预览')}</p>
      </div>
    )
  }

  return (
    <div className="code-preview-container">
      {/* 工具栏 */}
      <div className="code-preview-toolbar">
        <div className="preview-info">
          <FileCode size={16} />
          <span className="preview-url">{fileName || previewUrl || '代码预览'}</span>
        </div>
        <div className="preview-actions">
          {/* 模式切换按钮 */}
          <div className="view-mode-toggle">
            <Button
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('code')}
              title="代码模式"
              disabled={!codeContent}
            >
              <Code2 size={16} />
              <span>代码</span>
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              title="预览模式"
              disabled={!previewUrl}
            >
              <Monitor size={16} />
              <span>预览</span>
            </Button>
          </div>

          <div className="preview-divider"></div>

          {viewMode === 'preview' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                title={translate?.('buttons.refresh', '刷新')}
              >
                <RefreshCw size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                title={translate?.('buttons.openExternal', '在新标签页打开')}
              >
                <ExternalLink size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 代码视图 */}
      {viewMode === 'code' && codeContent && (
        <div className="code-view">
          <pre className="code-content">
            <code>{codeContent}</code>
          </pre>
        </div>
      )}

      {/* 预览视图 */}
      {viewMode === 'preview' && previewUrl && (
        <div className="code-preview-frame">
          <iframe
            ref={iframeRef}
            key={lastUpdate}
            src={previewUrl}
            title="Code Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              minHeight: '400px'
            }}
          />
        </div>
      )}

      {/* 空状态提示 */}
      {viewMode === 'code' && !codeContent && (
        <div className="code-preview-empty">
          <Code2 className="empty-icon" size={32} />
          <p>暂无代码内容</p>
        </div>
      )}

      {viewMode === 'preview' && !previewUrl && (
        <div className="code-preview-empty">
          <Monitor className="empty-icon" size={32} />
          <p>预览尚未就绪，请等待文件生成完成</p>
        </div>
      )}
    </div>
  )
}

