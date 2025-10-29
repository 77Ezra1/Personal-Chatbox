import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 工作流执行统计组件
 * 显示执行的性能指标和统计信息
 */
export function WorkflowExecutionStats({ events, workflowStatus }) {
  // 计算统计数据
  const stats = useMemo(() => {
    const nodeStats = {
      total: 0,
      completed: 0,
      failed: 0,
      retried: 0,
      totalDuration: 0,
      slowestNode: null,
      fastestNode: null
    }

    const nodeExecutions = new Map()

    // 处理所有节点事件
    events.forEach(event => {
      if (event.type === 'node_start') {
        nodeStats.total++
        nodeExecutions.set(event.nodeId, { ...event, startTime: new Date(event.startedAt) })
      } else if (event.type === 'node_complete') {
        nodeStats.completed++
        nodeStats.totalDuration += event.durationMs || 0

        if (event.retryCount > 0) {
          nodeStats.retried++
        }

        // 找出最慢和最快的节点
        if (!nodeStats.slowestNode || event.durationMs > nodeStats.slowestNode.durationMs) {
          nodeStats.slowestNode = { ...event }
        }
        if (!nodeStats.fastestNode || event.durationMs < nodeStats.fastestNode.durationMs) {
          nodeStats.fastestNode = { ...event }
        }
      } else if (event.type === 'node_error') {
        nodeStats.failed++
      }
    })

    // 计算工作流总耗时
    const workflowStart = events.find(e => e.type === 'workflow_start')
    const workflowEnd = events.find(e => e.type === 'workflow_complete' || e.type === 'workflow_error')
    const totalWorkflowDuration = workflowEnd?.durationMs ||
      (workflowStart && workflowEnd ? new Date(workflowEnd.timestamp) - new Date(workflowStart.startedAt) : null)

    return {
      ...nodeStats,
      totalWorkflowDuration,
      successRate: nodeStats.total > 0 ? (nodeStats.completed / nodeStats.total * 100) : 0,
      avgNodeDuration: nodeStats.completed > 0 ? (nodeStats.totalDuration / nodeStats.completed) : 0
    }
  }, [events])

  return (
    <div className="space-y-4">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 总执行时间 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              总耗时
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalWorkflowDuration ?
                `${(stats.totalWorkflowDuration / 1000).toFixed(2)}s` :
                '计算中...'}
            </div>
          </CardContent>
        </Card>

        {/* 节点总数 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Activity className="h-3 w-3" />
              节点总数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completed} 完成, {stats.failed} 失败
            </div>
          </CardContent>
        </Card>

        {/* 成功率 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3 w-3" />
              成功率
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <Progress value={stats.successRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* 重试次数 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <RefreshCw className="h-3 w-3" />
              重试节点
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.retried}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.retried > 0 ? '有节点重试' : '无重试'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 性能分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            性能分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 平均节点耗时 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">平均节点耗时</span>
            <span className="font-medium">
              {stats.avgNodeDuration > 0 ? `${stats.avgNodeDuration.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>

          {/* 最慢节点 */}
          {stats.slowestNode && (
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">最慢节点</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.slowestNode.nodeId}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {stats.slowestNode.nodeType}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {stats.slowestNode.durationMs}ms
                  </div>
                  {stats.slowestNode.retryCount > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      重试 {stats.slowestNode.retryCount} 次
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 最快节点 */}
          {stats.fastestNode && stats.completed > 1 && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium">最快节点</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.fastestNode.nodeId}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {stats.fastestNode.nodeType}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.fastestNode.durationMs}ms
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 执行状态总结 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            执行状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">成功: {stats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">失败: {stats.failed}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">重试: {stats.retried}</span>
            </div>
            <div className={cn(
              "ml-auto px-3 py-1 rounded-full text-sm font-medium",
              workflowStatus === 'running' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
              workflowStatus === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              workflowStatus === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            )}>
              {workflowStatus === 'running' && '运行中'}
              {workflowStatus === 'completed' && '已完成'}
              {workflowStatus === 'failed' && '执行失败'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
