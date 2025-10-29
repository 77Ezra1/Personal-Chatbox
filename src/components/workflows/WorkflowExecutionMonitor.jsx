import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, Play, RefreshCw, AlertCircle, ChevronDown, ChevronRight, BarChart3, List, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowExecutionStats } from './WorkflowExecutionStats'
import { cn } from '@/lib/utils'

/**
 * 工作流执行监控组件
 * 通过 WebSocket 实时显示工作流执行状态
 */
export function WorkflowExecutionMonitor({ executionId, onClose }) {
  const [events, setEvents] = useState([])
  const [workflowStatus, setWorkflowStatus] = useState('running')
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  // 连接 WebSocket
  useEffect(() => {
    if (!executionId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws/workflow`

    console.log('[WorkflowMonitor] 连接到:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WorkflowMonitor] WebSocket 已连接')
      setIsConnected(true)

      // 订阅执行状态更新
      ws.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (error) {
        console.error('[WorkflowMonitor] 消息解析失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WorkflowMonitor] WebSocket 错误:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('[WorkflowMonitor] WebSocket 已断开')
      setIsConnected(false)
    }

    wsRef.current = ws

    // 清理函数
    return () => {
      if (ws) {
        ws.send(JSON.stringify({
          type: 'unsubscribe',
          executionId
        }))
        ws.close()
      }
    }
  }, [executionId])

  // 处理 WebSocket 消息
  const handleWebSocketMessage = useCallback((message) => {
    console.log('[WorkflowMonitor] 收到消息:', message)

    setEvents(prev => [...prev, message])

    // 更新工作流状态
    if (message.type === 'workflow_complete') {
      setWorkflowStatus('completed')
    } else if (message.type === 'workflow_error') {
      setWorkflowStatus('failed')
    }
  }, [])

  // 切换节点展开/折叠
  const toggleNode = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // 导出执行日志
  const exportLogs = useCallback(() => {
    const logData = {
      executionId,
      workflowStatus,
      exportedAt: new Date().toISOString(),
      events
    }

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-execution-${executionId}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [executionId, workflowStatus, events])

  // 渲染事件图标
  const renderEventIcon = (event) => {
    switch (event.type) {
      case 'workflow_start':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'workflow_complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'workflow_error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'node_start':
        return <Clock className="h-4 w-4 text-blue-400" />
      case 'node_complete':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'node_error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'node_retry':
        return <RefreshCw className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  // 渲染事件内容
  const renderEventContent = (event, index) => {
    const isExpanded = expandedNodes.has(event.nodeId)

    switch (event.type) {
      case 'workflow_start':
        return (
          <div className="space-y-1">
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              工作流开始执行
            </div>
            <div className="text-sm text-muted-foreground">
              {event.workflowName || '未命名工作流'}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(event.startedAt).toLocaleString()}
            </div>
          </div>
        )

      case 'workflow_complete':
        return (
          <div className="space-y-1">
            <div className="font-semibold text-green-600 dark:text-green-400">
              工作流执行完成
            </div>
            <div className="text-sm text-muted-foreground">
              耗时: {event.durationMs}ms
            </div>
          </div>
        )

      case 'workflow_error':
        return (
          <div className="space-y-1">
            <div className="font-semibold text-red-600 dark:text-red-400">
              工作流执行失败
            </div>
            <div className="text-sm text-red-500">
              {event.error}
            </div>
          </div>
        )

      case 'node_start':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">节点开始:</span>
              <span className="text-sm">{event.nodeLabel || event.nodeId}</span>
              <Badge variant="outline" className="text-xs">
                {event.nodeType}
              </Badge>
            </div>
          </div>
        )

      case 'node_complete':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 dark:text-green-400">
                  节点完成:
                </span>
                <span className="text-sm">{event.nodeId}</span>
                <Badge variant="outline" className="text-xs">
                  {event.nodeType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {event.durationMs}ms
                </span>
                {event.retryCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    重试 {event.retryCount} 次
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleNode(event.nodeId)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isExpanded && (
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    输入数据:
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(event.inputData, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    输出数据:
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(event.outputData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )

      case 'node_error':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-red-600 dark:text-red-400">
                节点失败:
              </span>
              <span className="text-sm">{event.nodeId}</span>
              <Badge variant="outline" className="text-xs">
                {event.nodeType}
              </Badge>
              {event.retryCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  已重试 {event.retryCount} 次
                </Badge>
              )}
            </div>
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
              {event.error}
            </div>
          </div>
        )

      case 'node_retry':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                节点重试:
              </span>
              <span className="text-sm">{event.nodeId}</span>
              <Badge variant="outline" className="text-xs">
                第 {event.attempt}/{event.maxRetries} 次
              </Badge>
              <span className="text-xs text-muted-foreground">
                等待 {event.delayMs}ms
              </span>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-sm text-muted-foreground">
            {event.type}: {JSON.stringify(event)}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">执行监控</h3>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '已连接' : '未连接'}
          </Badge>
          <Badge variant={
            workflowStatus === 'running' ? 'default' :
            workflowStatus === 'completed' ? 'success' :
            'destructive'
          }>
            {workflowStatus === 'running' ? '运行中' :
             workflowStatus === 'completed' ? '已完成' :
             '失败'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={events.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            导出日志
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>

      {/* 标签页内容 */}
      <Tabs defaultValue="events" className="flex-1 flex flex-col">
        <div className="px-4 pt-3 border-b">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              事件日志
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              性能统计
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 事件列表视图 */}
        <TabsContent value="events" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {events.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  等待执行事件...
                </div>
              )}

              {events.map((event, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border transition-colors",
                    event.type.includes('error') && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                    event.type.includes('complete') && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {renderEventIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderEventContent(event, index)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 性能统计视图 */}
        <TabsContent value="stats" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full p-4">
            <WorkflowExecutionStats
              events={events}
              workflowStatus={workflowStatus}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 底部统计 */}
      <div className="border-t p-3 bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            执行ID: <code className="text-xs">{executionId}</code>
          </span>
          <span className="text-muted-foreground">
            事件数: {events.length}
          </span>
        </div>
      </div>
    </div>
  )
}
