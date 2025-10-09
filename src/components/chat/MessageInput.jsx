import { useState, useRef } from 'react'
import { Send, CircleStop, Paperclip, ImagePlus, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AttachmentPreview } from './AttachmentPreview'

/**
 * 消息输入组件
 * 提供输入框、附件上传和发送功能
 */
export function MessageInput({
  isGenerating,
  pendingAttachments,
  isDeepThinking,
  isDeepThinkingAvailable,
  onSend,
  onStop,
  onAddAttachment,
  onRemoveAttachment,
  onToggleDeepThinking,
  translate
}) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const handleSend = () => {
    if (!input.trim() && pendingAttachments.length === 0) return
    if (isGenerating) return

    onSend(input, pendingAttachments)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onAddAttachment(file)
      e.target.value = '' // 重置 input
    }
  }

  return (
    <div className="input-area message-input-container">
      {/* 附件预览 */}
      {pendingAttachments.length > 0 && (
        <div className="message-input-attachments">
          {pendingAttachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => onRemoveAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="message-input-body">
        <div className="message-input-main">
          {/* 工具栏 */}
          <div className="message-input-toolbar">
            {/* 上传附件 */}
            <Button
              variant="ghost"
              size="icon"
              className="message-input-toolbar-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              title={translate('tooltips.uploadAttachment', 'Upload attachment')}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* 添加图片 */}
            <Button
              variant="ghost"
              size="icon"
              className="message-input-toolbar-button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isGenerating}
              title={translate('tooltips.addImage', 'Insert image')}
            >
              <ImagePlus className="w-4 h-4" />
            </Button>

            {/* 深度思考切换 */}
            <Button
              variant={isDeepThinking ? 'default' : 'ghost'}
              size="sm"
              className="message-input-toolbar-button"
              onClick={onToggleDeepThinking}
              disabled={!isDeepThinkingAvailable || isGenerating}
              title={translate('tooltips.toggleDeepThinking', 'Toggle deep thinking mode')}
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="ml-1 text-xs">
                {isDeepThinking
                  ? translate('toggles.deepThinkingOn', 'Deep thinking: On')
                  : translate('toggles.deepThinkingOff', 'Deep thinking: Off')
                }
              </span>
            </Button>
          </div>

          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            className="message-input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={translate('placeholders.messageInput', 'Type a message...')}
            disabled={isGenerating}
            rows={3}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          className="message-input-send"
          onClick={isGenerating ? onStop : handleSend}
          disabled={!isGenerating && !input.trim() && pendingAttachments.length === 0}
        >
          {isGenerating ? (
            <>
              <CircleStop className="w-4 h-4" />
              <span className="ml-1">
                {translate('tooltips.stopGenerating', 'Stop')}
              </span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="ml-1">
                {translate('buttons.send', 'Send')}
              </span>
            </>
          )}
        </Button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  )
}

