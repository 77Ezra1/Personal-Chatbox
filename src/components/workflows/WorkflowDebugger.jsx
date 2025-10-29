import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  Pause,
  StepForward,
  Square,
  Circle,
  CircleDot,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 工作流调试器组件
 * 提供断点管理、单步执行、变量检查等调试功能
 */
export function WorkflowDebugger({
  workflowId,
  executionId,
  isPaused,
  currentNode,
  breakpoints = [],
  variables = {},
  callStack = [],
  onSetBreakpoint,
  onRemoveBreakpoint,
  onClearBreakpoints,
  onContinue,
  onStepOver,
  onStop
}) {
  const [expandedSections, setExpandedSections] = useState({
    breakpoints: true,
    variables: true,
    callStack: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // 格式化变量值
  const formatValue = (value) => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* 头部 - 调试控制 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">调试器</h3>
          {isPaused && (
            <Badge variant="warning" className="flex items-center gap-1">
              <Pause className="h-3 w-3" />
              已暂停
            </Badge>
          )}
        </div>

        {/* 调试控制按钮 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={onContinue}
            disabled={!isPaused || !executionId}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            继续
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onStepOver}
            disabled={!isPaused || !executionId}
            className="flex items-center gap-2"
          >
            <StepForward className="h-4 w-4" />
            单步
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            disabled={!executionId}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            停止
          </Button>
        </div>

        {/* 当前暂停位置 */}
        {isPaused && currentNode && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-muted-foreground mb-1">当前节点</div>
            <div className="text-sm font-medium">{currentNode}</div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 断点部分 */}
          <div>
            <button
              className="flex items-center justify-between w-full mb-2 hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => toggleSection('breakpoints')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.breakpoints ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">断点</span>
                <Badge variant="secondary" className="text-xs">
                  {breakpoints.length}
                </Badge>
              </div>
              {breakpoints.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearBreakpoints()
                  }}
                  className="h-6 px-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </button>

            {expandedSections.breakpoints && (
              <div className="space-y-1 pl-6">
                {breakpoints.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    暂无断点
                  </div>
                ) : (
                  breakpoints.map((nodeId) => (
                    <div
                      key={nodeId}
                      className={cn(
                        "flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors",
                        currentNode === nodeId && "bg-yellow-100 dark:bg-yellow-950/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{nodeId}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveBreakpoint(nodeId)}
                        className="h-6 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 变量部分 */}
          <div>
            <button
              className="flex items-center justify-between w-full mb-2 hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => toggleSection('variables')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.variables ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">变量</span>
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(variables).length}
                </Badge>
              </div>
            </button>

            {expandedSections.variables && (
              <div className="space-y-2 pl-6">
                {Object.keys(variables).length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    暂无变量
                  </div>
                ) : (
                  Object.entries(variables).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-2 rounded bg-muted/30 border"
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {key}
                      </div>
                      <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                        {formatValue(value)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 调用栈部分 */}
          <div>
            <button
              className="flex items-center justify-between w-full mb-2 hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => toggleSection('callStack')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.callStack ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">调用栈</span>
                <Badge variant="secondary" className="text-xs">
                  {callStack.length}
                </Badge>
              </div>
            </button>

            {expandedSections.callStack && (
              <div className="space-y-1 pl-6">
                {callStack.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    暂无调用栈
                  </div>
                ) : (
                  callStack.map((frame, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-2 rounded border",
                        index === callStack.length - 1
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{frame.nodeId}</div>
                        {index === callStack.length - 1 && (
                          <Badge variant="outline" className="text-xs">
                            当前
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {frame.nodeType}
                      </div>
                      {frame.enteredAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(frame.enteredAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
