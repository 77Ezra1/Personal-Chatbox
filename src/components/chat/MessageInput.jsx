import { useState, useRef } from 'react'
import { Send, CircleStop, Paperclip, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AttachmentPreview } from './AttachmentPreview'
import { THINKING_MODE } from '@/lib/constants'
import { getThinkingModeDescription } from '@/lib/modelThinkingDetector'

/**
 * 消息输入组件
 * 提供输入框、附件上传和发送功能
 */
export function MessageInput({
  isGenerating,
  pendingAttachments,
  isDeepThinking,
  isDeepThinkingAvailable,
  isButtonDisabled,      // 新增：按钮是否禁用
  thinkingMode,          // 新增：思考模式
  onSend,
  onStop,
  onAddAttachment,
  onRemoveAttachment,
  onToggleDeepThinking,
  onCommandTrigger,      // 新增：指令触发回调
  translate
}) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (!input.trim() && pendingAttachments.length === 0) return
    if (isGenerating) return
    if (typeof onSend !== 'function') {
      console.warn('[MessageInput] onSend handler is not available')
      return
    }

    onSend(input, pendingAttachments)
    setInput('')
  }

  const handleKeyDown = (e) => {
    // 检测 / 触发指令面板
    if (e.key === '/' && input === '' && onCommandTrigger) {
      e.preventDefault()
      onCommandTrigger()
      return
    }

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
              title={translate('tooltips.uploadAttachment', 'Upload attachment (images & files)')}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* 深度思考切换 */}
            <Button
              variant={isDeepThinking ? 'default' : 'ghost'}
              size="sm"
              className="message-input-toolbar-button"
              onClick={onToggleDeepThinking}
              disabled={isButtonDisabled || !isDeepThinkingAvailable || isGenerating}
              title={(() => {
                // 获取当前语言
                const currentLang = document.documentElement.lang === 'en' ? 'en' : 'zh'
                // 获取思考模式描述
                const modeDesc = getThinkingModeDescription(thinkingMode || THINKING_MODE.DISABLED, currentLang)
                return modeDesc.tooltip
              })()}
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="ml-1 text-xs">
                {(() => {
                  const currentLang = document.documentElement.lang === 'en' ? 'en' : 'zh'
                  const prefix = currentLang === 'zh' ? '深度思考：' : 'Deep thinking: '

                  // 根据思考模式显示不同的文本
                  switch (thinkingMode) {
                    case THINKING_MODE.DISABLED:
                      return prefix + (currentLang === 'zh' ? '不支持' : 'Not Supported')
                    case THINKING_MODE.ALWAYS_ON:
                      return prefix + (currentLang === 'zh' ? '开启 🔒' : 'On 🔒')
                    case THINKING_MODE.ADAPTIVE:
                      return prefix + (currentLang === 'zh' ? '自动 🤖' : 'Auto 🤖')
                    case THINKING_MODE.OPTIONAL:
                    default:
                      return isDeepThinking
                        ? translate('toggles.deepThinkingOn', '深度思考：开启')
                        : translate('toggles.deepThinkingOff', '深度思考：关闭')
                  }
                })()}
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
    </div>
  )
}

