import { useState, useEffect, memo } from 'react'
import { Play, CheckCircle, XCircle, Clock, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 代码执行块组件
 * 实时显示代码执行状态和结果
 */
export const CodeExecutionBlock = memo(function CodeExecutionBlock({
  toolCallId,
  language,
  code,
  status = 'pending', // pending, running, success, error
  result = null,
  error = null,
  executionTime = null
}) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      text: '等待执行',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300'
    },
    running: {
      icon: Play,
      text: '执行中',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      animate: true
    },
    success: {
      icon: CheckCircle,
      text: '执行成功',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300'
    },
    error: {
      icon: XCircle,
      text: '执行失败',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300'
    }
  }

  const config = statusConfig[status] || statusConfig.pending
  const StatusIcon = config.icon

  // 处理结果输出
  const formatResult = (result) => {
    if (!result) return null

    if (typeof result === 'object') {
      // 如果有 stdout，优先显示
      if (result.stdout) return result.stdout
      if (result.output) return result.output
      // 否则显示完整对象
      return JSON.stringify(result, null, 2)
    }

    return String(result)
  }

  const formattedResult = formatResult(result)

  return (
    <div
      className={cn(
        "code-execution-block rounded-lg border overflow-hidden my-3",
        config.borderColor,
        config.bgColor
      )}
    >
      {/* Header */}
      <div className="px-4 py-2 bg-white bg-opacity-50 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "w-4 h-4",
              config.color,
              config.animate && "animate-spin"
            )}
          />
          <span className={cn("text-sm font-medium", config.color)}>
            {config.text}
          </span>
          {language && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {language}
            </span>
          )}
          {executionTime && (
            <span className="text-xs text-gray-500">
              {executionTime}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="复制代码"
          >
            {copied ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
            title={isExpanded ? "折叠" : "展开"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      {isExpanded && (
        <div className="border-b border-gray-200">
          <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-100 text-sm">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      )}

      {/* Result or Error */}
      {isExpanded && (status === 'success' || status === 'error') && (
        <div className="p-4">
          {status === 'success' && formattedResult && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">输出结果：</div>
              <pre className="bg-white p-3 rounded text-sm text-gray-800 overflow-x-auto border border-gray-200">
                {formattedResult}
              </pre>
            </div>
          )}

          {status === 'error' && error && (
            <div>
              <div className="text-xs font-medium text-red-600 mb-2">错误信息：</div>
              <pre className="bg-red-50 p-3 rounded text-sm text-red-800 overflow-x-auto border border-red-200">
                {error}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Running indicator */}
      {status === 'running' && isExpanded && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </div>
            <span>代码执行中，请稍候</span>
          </div>
        </div>
      )}
    </div>
  )
})
