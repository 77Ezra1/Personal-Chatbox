import { useState, useEffect, useCallback, useMemo } from 'react'
import { AgentList } from '@/components/agents/AgentList'
import { AgentEditor } from '@/components/agents/AgentEditor'
import { AgentTaskExecutor } from '@/components/agents/AgentTaskExecutor'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  Loader2,
  History,
  Clock,
  Activity,
  Download,
  FileJson,
  BarChart3,
  TrendingUp,
  ListOrdered,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { agentAPI } from '@/lib/apiClient'

export default function AgentsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { translate } = useTranslation()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [executorOpen, setExecutorOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAgent, setHistoryAgent] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [executionHistory, setExecutionHistory] = useState([])
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [historyStats, setHistoryStats] = useState(null)
  const [historyTrend, setHistoryTrend] = useState([])
  const [historyFilters, setHistoryFilters] = useState({ status: 'all', start: '', end: '' })
  const [historySubtasks, setHistorySubtasks] = useState([])
  const [historySubtasksLoading, setHistorySubtasksLoading] = useState(false)
  const [historySubtasksError, setHistorySubtasksError] = useState(null)
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0)
  const [queueStatus, setQueueStatus] = useState({ waiting: [], running: [], waitingCount: 0, runningCount: 0, concurrency: 0 })
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueError, setQueueError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [queuePriorityDraft, setQueuePriorityDraft] = useState({})

  const dashboardCards = useMemo(() => {
    if (!dashboard?.totals) return []
    const totals = dashboard.totals

    const formatDuration = (value) => {
      if (!value && value !== 0) return '—'
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} s`
      }
      return `${Math.round(value)} ms`
    }

    const successRatePercent = Math.round((totals.successRate || 0) * 100)

    return [
      {
        key: 'executions',
        icon: BarChart3,
        label: translate('agents.dashboard.totalExecutions', 'Total Executions'),
        value: totals.executions || 0
      },
      {
        key: 'successRate',
        icon: TrendingUp,
        label: translate('agents.dashboard.successRate', 'Success Rate'),
        value: `${successRatePercent}%`
      },
      {
        key: 'avgDuration',
        icon: Clock,
        label: translate('agents.dashboard.avgDuration', 'Avg Duration'),
        value: formatDuration(totals.avgDuration || 0)
      }
    ]
  }, [dashboard, translate])

  const accentButtonClasses = 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
  const subtleIconButtonClasses = 'text-primary hover:bg-primary/10'
  const softDestructiveClasses = 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'

  // Fetch agents from backend
  const fetchAgents = useCallback(async () => {
    if (authLoading || !isAuthenticated) return
    try {
      setLoading(true)
      const response = await agentAPI.list()
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error(translate('agents.toasts.loadFailed', 'Failed to load agents'))
    } finally {
      setLoading(false)
    }
  }, [authLoading, isAuthenticated, translate])

  const fetchDashboard = useCallback(async () => {
    if (authLoading || !isAuthenticated) return
    try {
      setDashboardLoading(true)
      const response = await agentAPI.getSummaryMetrics()
      setDashboard(response.data?.summary || null)
    } catch (error) {
      console.error('Failed to fetch agent metrics summary:', error)
    } finally {
      setDashboardLoading(false)
    }
  }, [authLoading, isAuthenticated])

  const fetchQueueState = useCallback(async (agentId) => {
    if (!agentId) return
    try {
      setQueueLoading(true)
      setQueueError(null)
      const response = await agentAPI.getQueueStatus(agentId)
      const data = response.data || {}
      const waiting = data.waiting || []
      setQueueStatus({
        waiting,
        running: data.running || [],
        waitingCount: data.waitingCount || waiting.length,
        runningCount: data.runningCount || (data.running || []).length,
        concurrency: data.concurrency || 0
      })
      const draft = {}
      waiting.forEach(job => {
        draft[job.executionId] = Number.isFinite(job.priority) ? job.priority : 0
      })
      setQueuePriorityDraft(draft)
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
      setQueueError(error.response?.data?.message || error.message || 'Failed to load queue status')
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) {
      fetchAgents()
      fetchDashboard()
    } else {
      setAgents([])
      setDashboard(null)
      setLoading(false)
      setDashboardLoading(false)
    }
  }, [authLoading, isAuthenticated, fetchAgents, fetchDashboard])

  // Create new agent
  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setEditorOpen(true)
  }

  // Edit existing agent
  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setEditorOpen(true)
  }

  // Save agent (create or update)
  const handleSaveAgent = async (agentData) => {
    try {
      if (selectedAgent) {
        // Update existing agent
        await agentAPI.update(selectedAgent.id, agentData)
        toast.success(translate('agents.toasts.updateSuccess', 'Agent updated successfully'))
      } else {
        // Create new agent
        await agentAPI.create(agentData)
        toast.success(translate('agents.toasts.createSuccess', 'Agent created successfully'))
      }
      setEditorOpen(false)
      fetchAgents()
    } catch (error) {
      console.error('Failed to save agent:', error)
      toast.error(error.response?.data?.message || translate('agents.toasts.saveFailed', 'Failed to save agent'))
    }
  }

  // Delete agent
  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return

    try {
      await agentAPI.delete(agentToDelete.id)
      toast.success(translate('agents.toasts.deleteSuccess', 'Agent deleted successfully'))
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
      fetchAgents()
    } catch (error) {
      console.error('Failed to delete agent:', error)
      toast.error(translate('agents.toasts.deleteFailed', 'Failed to delete agent'))
    }
  }

  // Execute agent task
  const handleExecuteAgent = (agent) => {
    setSelectedAgent(agent)
    setExecutorOpen(true)
  }

  const handleExecuteTask = async (agentId, taskData) => {
    try {
      const response = await agentAPI.execute(agentId, taskData)

      toast.success(translate('agents.toasts.executeSuccess', 'Task execution started'))
      return response.data
    } catch (error) {
      console.error('Failed to execute task:', error)
      toast.error(translate('agents.toasts.executeFailed', 'Failed to execute task'))
      throw error
    }
  }

  const handleStopTask = async (agentId) => {
    try {
      await agentAPI.stop(agentId)
      toast.info('Task execution stopped')
    } catch (error) {
      console.error('Failed to stop task:', error)
      toast.error('Failed to stop task')
    }
  }

  // View agent details
  const handleViewDetails = (agent) => {
    const name = agent?.name || translate('agents.card.untitledAgent', 'Untitled Agent')
    toast.info(
      translate('agents.history.detailsPlaceholder', 'Detailed view for "{name}" is coming soon.').replace('{name}', name)
    )
  }

  const handleViewHistory = (agent) => {
    setHistoryAgent(agent)
    setHistoryOpen(true)
  }

  useEffect(() => {
    if (!historyOpen || !historyAgent || authLoading || !isAuthenticated) return

    let cancelled = false

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        setHistorySubtasks([])
        const response = await agentAPI.getExecutions(historyAgent.id, {
          page: 1,
          limit: 50,
          status: historyFilters.status,
          start: historyFilters.start || undefined,
          end: historyFilters.end || undefined
        })

        if (cancelled) return

        const data = response.data || {}
        const executions = data.executions || []
        const stats = data.stats || null
        const trend = data.trend || []

        setExecutionHistory(executions)
        setHistoryStats(stats)
        setHistoryTrend(trend)

        setSelectedExecution(prev => {
          if (executions.length === 0) return null
          const existing = executions.find(item => item.id === prev?.id)
          return existing || executions[0]
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch execution history:', error)
          setHistoryError(error.response?.data?.message || error.message || 'Failed to load history')
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    fetchHistory()
    fetchQueueState(historyAgent.id)

    return () => {
      cancelled = true
    }
  }, [historyOpen, historyAgent, authLoading, isAuthenticated, historyFilters, fetchQueueState, historyRefreshToken])

  const handleHistoryOpenChange = (open) => {
    setHistoryOpen(open)
    if (!open) {
      setHistoryAgent(null)
      setExecutionHistory([])
      setSelectedExecution(null)
      setHistoryError(null)
      setHistoryStats(null)
      setHistoryTrend([])
      setHistorySubtasks([])
      setHistorySubtasksError(null)
      setHistorySubtasksLoading(false)
      setQueueStatus({ waiting: [], running: [], waitingCount: 0, runningCount: 0, concurrency: 0 })
      setQueueError(null)
      setQueuePriorityDraft({})
    }
  }

  useEffect(() => {
    setHistorySubtasks([])
    setHistorySubtasksError(null)
  }, [selectedExecution?.id])

  const handleLoadSubtasks = useCallback(async (execution) => {
    if (!historyAgent || !execution) return
    try {
      setHistorySubtasksLoading(true)
      setHistorySubtasksError(null)
      const response = await agentAPI.getSubTasks(historyAgent.id, execution.taskId)
      setHistorySubtasks(response.data?.subtasks || [])
    } catch (error) {
      console.error('Failed to load subtasks:', error)
      setHistorySubtasksError(error.response?.data?.message || error.message || 'Failed to load subtasks')
    } finally {
      setHistorySubtasksLoading(false)
    }
  }, [historyAgent])

  const handleExportHistory = useCallback(async (format) => {
    if (!historyAgent) return
    try {
      setExporting(true)
      const response = await agentAPI.exportExecutions(historyAgent.id, {
        format,
        status: historyFilters.status,
        start: historyFilters.start || undefined,
        end: historyFilters.end || undefined
      })

      let blob
      if (format === 'json') {
        const payload = typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2)
        blob = new Blob([payload], { type: 'application/json' })
      } else {
        const data = response.data
        blob = data instanceof Blob
          ? data
          : new Blob([data], { type: 'text/csv;charset=utf-8' })
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `agent-${historyAgent.id}-executions.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(translate('agents.history.exportSuccess', 'Execution history exported'))
    } catch (error) {
      console.error('Failed to export history:', error)
      toast.error(error.response?.data?.message || translate('agents.history.exportFailed', 'Failed to export history'))
    } finally {
      setExporting(false)
    }
  }, [historyAgent, historyFilters, translate])

  const handleCancelQueuedTask = useCallback(async (executionId) => {
    if (!historyAgent || !executionId) return
    try {
      await agentAPI.cancelQueuedExecution(historyAgent.id, executionId)
      toast.success(translate('agents.history.queue.cancelSuccess', 'Queued task cancelled'))
      fetchQueueState(historyAgent.id)
      setHistoryRefreshToken(prev => prev + 1)
    } catch (error) {
      console.error('Failed to cancel queued task:', error)
      toast.error(error.response?.data?.message || translate('agents.history.queue.cancelFailed', 'Failed to cancel task'))
    }
  }, [historyAgent, fetchQueueState, translate])

  const handleUpdateQueuePriority = useCallback(async (executionId, priority) => {
    if (!historyAgent || !executionId) return
    const numericPriority = Number(priority)
    if (!Number.isFinite(numericPriority)) {
      toast.error(translate('agents.history.queue.priorityInvalid', 'Priority must be a number'))
      return
    }
    try {
      await agentAPI.updateQueuePriority(historyAgent.id, executionId, numericPriority)
      toast.success(translate('agents.history.queue.prioritySuccess', 'Priority updated'))
      fetchQueueState(historyAgent.id)
    } catch (error) {
      console.error('Failed to update queue priority:', error)
      toast.error(error.response?.data?.message || translate('agents.history.queue.priorityFailed', 'Failed to update priority'))
    }
  }, [historyAgent, fetchQueueState, translate])

  const handleStatusFilterChange = (value) => {
    setHistoryFilters(prev => ({ ...prev, status: value }))
  }

  const handleDateFilterChange = (key, value) => {
    setHistoryFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setHistoryFilters({ status: 'all', start: '', end: '' })
  }

  const renderStatusBadge = (status) => {
    const normalized = (status || '').toLowerCase()
    const statusStyles = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      busy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      queued: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      retrying: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      cancelled: 'bg-gray-200 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }

    return (
      <Badge variant="outline" className={cn('capitalize', statusStyles[normalized])}>
        {normalized || 'unknown'}
      </Badge>
    )
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  const formatDuration = (durationMs, startedAt, completedAt) => {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      return `${Math.round(durationMs)} ms`
    }
    if (startedAt && completedAt) {
      const start = new Date(startedAt).getTime()
      const end = new Date(completedAt).getTime()
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        return `${Math.round(end - start)} ms`
      }
    }
    return '—'
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 flex min-h-[calc(100vh-96px)] flex-col">
      <div className="mb-6 space-y-4">
        {dashboardLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map(index => (
              <div key={index} className="h-24 rounded-lg border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          dashboardCards.length > 0 && (
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                {dashboardCards.map(card => {
                  const Icon = card.icon
                  return (
                    <div key={card.key} className="rounded-lg border p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-semibold">{card.value}</p>
                      </div>
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                  )
                })}
              </div>

              {dashboard?.recent?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="size-4" />
                      {translate('agents.dashboard.recentTrend', 'Recent 7-day trend')}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {translate('agents.dashboard.completedVsTotal', 'Completed vs total')}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {dashboard.recent.map(day => {
                      const completion = day.total ? Math.min(100, Math.round((day.completed / day.total) * 100)) : 0
                      return (
                        <div key={day.bucket} className="flex items-center gap-2">
                          <span className="w-20 text-muted-foreground">{day.bucket}</span>
                          <div className="relative h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="absolute left-0 top-0 h-full rounded-full bg-primary/70"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                          <span className="w-16 text-right">{day.completed}/{day.total}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="flex-1 min-h-0">
        <AgentList
          agents={agents}
          loading={loading}
          onCreateAgent={handleCreateAgent}
          onExecute={handleExecuteAgent}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent}
          onViewDetails={handleViewDetails}
          onViewHistory={handleViewHistory}
          translate={translate}
          className="h-full"
        />
      </div>

      {/* Agent Editor Dialog */}
      <AgentEditor
        agent={selectedAgent}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveAgent}
      />

      {/* Task Executor Dialog */}
      {selectedAgent && (
        <AgentTaskExecutor
          agent={selectedAgent}
          open={executorOpen}
          onOpenChange={setExecutorOpen}
          onExecute={handleExecuteTask}
          onStop={handleStopTask}
        />
      )}

      <Sheet open={historyOpen} onOpenChange={handleHistoryOpenChange}>
        <SheetContent side="right" className="w-[480px] sm:w-[560px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="size-4" />
              {translate('agents.history.title', 'Execution History')}
            </SheetTitle>
            <SheetDescription>
              {historyAgent
                ? translate('agents.history.description', 'Recent runs for "{name}"').replace('{name}', historyAgent.name || translate('agents.card.untitledAgent', 'Untitled Agent'))
                : translate('agents.history.emptyAgent', 'Select an agent to view history')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {translate('agents.history.filters.status', 'Status')}
                  </label>
                  <Select value={historyFilters.status} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue placeholder={translate('agents.history.filters.allStatuses', 'All statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translate('agents.history.filters.allStatuses', 'All statuses')}</SelectItem>
                      <SelectItem value="completed">{translate('agents.status.completed', 'Completed')}</SelectItem>
                      <SelectItem value="failed">{translate('agents.status.failed', 'Failed')}</SelectItem>
                      <SelectItem value="queued">{translate('agents.status.queued', 'Queued')}</SelectItem>
                      <SelectItem value="retrying">{translate('agents.status.retrying', 'Retrying')}</SelectItem>
                      <SelectItem value="running">{translate('agents.status.running', 'Running')}</SelectItem>
                      <SelectItem value="cancelled">{translate('agents.status.cancelled', 'Cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {translate('agents.history.filters.startDate', 'Start')}
                  </label>
                  <Input
                    type="date"
                    value={historyFilters.start}
                    max={historyFilters.end || undefined}
                    onChange={(event) => handleDateFilterChange('start', event.target.value)}
                    className="h-8 w-[140px]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {translate('agents.history.filters.endDate', 'End')}
                  </label>
                  <Input
                    type="date"
                    value={historyFilters.end}
                    min={historyFilters.start || undefined}
                    onChange={(event) => handleDateFilterChange('end', event.target.value)}
                    className="h-8 w-[140px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', subtleIconButtonClasses)}
                  onClick={handleResetFilters}
                  title={translate('agents.history.filters.reset', 'Reset filters')}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('gap-1', accentButtonClasses)}
                  onClick={() => handleExportHistory('csv')}
                  disabled={exporting || executionHistory.length === 0}
                >
                  <Download className="size-4" />
                  <span className="ml-1 hidden sm:inline">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('gap-1', accentButtonClasses)}
                  onClick={() => handleExportHistory('json')}
                  disabled={exporting || executionHistory.length === 0}
                >
                  <FileJson className="size-4" />
                  <span className="ml-1 hidden sm:inline">JSON</span>
                </Button>
              </div>
            </div>

            {historyStats && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    {translate('agents.history.stats.totalRuns', 'Runs')}
                  </p>
                  <p className="text-lg font-semibold">{historyStats.total || 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    {translate('agents.history.stats.successRate', 'Success rate')}
                  </p>
                  <p className="text-lg font-semibold">{Math.round((historyStats.successRate || 0) * 100)}%</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    {translate('agents.history.stats.avgDuration', 'Avg duration')}
                  </p>
                  <p className="text-lg font-semibold">{formatDuration(historyStats.avgDuration, null, null)}</p>
                </div>
              </div>
            )}

            {historyTrend?.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ListOrdered className="size-4" />
                  {translate('agents.history.stats.recentTrend', 'Recent trend')}
                </div>
                <div className="space-y-1 text-xs">
                  {historyTrend.map(item => {
                    const completion = item.total ? Math.min(100, Math.round((item.completed / item.total) * 100)) : 0
                    return (
                      <div key={item.date} className="flex items-center gap-2">
                        <span className="w-20 text-muted-foreground">{item.date}</span>
                        <div className="relative h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-primary/70"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="w-16 text-right">{item.completed}/{item.total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {historyLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : historyError ? (
              <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {historyError}
              </div>
            ) : executionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {translate('agents.history.noExecutions', 'No execution records yet.')}
              </p>
            ) : (
              <>
                <ScrollArea className="max-h-64 pr-4">
                  <div className="space-y-2">
                    {executionHistory.map(execution => {
                      const isActive = selectedExecution?.id === execution.id
                      return (
                        <button
                          key={execution.id}
                          className={cn(
                            'w-full rounded-md border p-3 text-left transition hover:border-primary',
                            isActive && 'border-primary bg-primary/5'
                          )}
                          onClick={() => setSelectedExecution(execution)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {formatDateTime(execution.startedAt) || translate('agents.history.unknownStart', 'Unknown start')}
                            </span>
                            {renderStatusBadge(execution.status)}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatDuration(execution.durationMs, execution.startedAt, execution.completedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="size-3" />
                              {Math.round((execution.progress || 0) * 100)}%
                            </span>
                            <span className="flex items-center gap-1">
                              <ListOrdered className="size-3" />
                              {translate('agents.history.attemptsShort', 'Attempts')}: {execution.attempts ?? 0}
                            </span>
                          </div>
                          {execution.queuedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {translate('agents.history.queuedAt', 'Queued')}: {formatDateTime(execution.queuedAt)}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>

                {selectedExecution && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold">
                        {translate('agents.history.detailsTitle', 'Execution Details')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {translate('agents.history.executionId', 'Execution ID')}: {selectedExecution.id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{translate('agents.history.status', 'Status')}:</span>
                        {renderStatusBadge(selectedExecution.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.startedAt', 'Started')}:</span>
                        <span>{formatDateTime(selectedExecution.startedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.completedAt', 'Completed')}:</span>
                        <span>{formatDateTime(selectedExecution.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.duration', 'Duration')}:</span>
                        <span>{formatDuration(selectedExecution.durationMs, selectedExecution.startedAt, selectedExecution.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.progress', 'Progress')}:</span>
                        <span>{Math.round((selectedExecution.progress || 0) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.attempts', 'Attempts')}:</span>
                        <span>{selectedExecution.attempts ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{translate('agents.history.queuedAt', 'Queued')}:</span>
                        <span>{formatDateTime(selectedExecution.queuedAt)}</span>
                      </div>
                      {selectedExecution.taskPriority !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{translate('agents.history.taskPriority', 'Task priority')}:</span>
                          <span>{selectedExecution.taskPriority}</span>
                        </div>
                      )}
                      {selectedExecution.errorMessage && (
                        <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                          {selectedExecution.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={accentButtonClasses}
                        onClick={() => handleLoadSubtasks(selectedExecution)}
                        disabled={historySubtasksLoading}
                      >
                        <ListOrdered className="size-4" />
                        <span className="ml-1">
                          {historySubtasksLoading
                            ? translate('agents.history.loadingSubtasks', 'Loading...')
                            : translate('agents.history.viewSubtasks', 'View subtasks')}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn('text-sm', subtleIconButtonClasses)}
                        onClick={() => setHistoryRefreshToken(prev => prev + 1)}
                      >
                        <RefreshCw className="size-4" />
                        <span className="ml-1">{translate('agents.history.refresh', 'Refresh')}</span>
                      </Button>
                    </div>
                    {historySubtasksError && (
                      <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                        {historySubtasksError}
                      </div>
                    )}
                    {historySubtasksLoading ? (
                      <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    ) : historySubtasks.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {historySubtasks.map(subtask => (
                          <div key={subtask.id} className="rounded border p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{subtask.title}</span>
                              {renderStatusBadge(subtask.status)}
                            </div>
                            {subtask.description && (
                              <p className="mt-1 text-muted-foreground">{subtask.description}</p>
                            )}
                            {subtask.errorMessage && (
                              <p className="mt-1 text-destructive">{subtask.errorMessage}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {translate('agents.history.noSubtasks', 'No subtasks recorded for this run.')}
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ListOrdered className="size-4" />
                      {translate('agents.history.queue.title', 'Queue status')}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {translate('agents.history.queue.summary', '{waiting} waiting · {running} running')
                        .replace('{waiting}', queueStatus.waitingCount || 0)
                        .replace('{running}', queueStatus.runningCount || 0)}
                    </span>
                  </div>
                  {queueLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  ) : queueError ? (
                    <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                      {queueError}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {queueStatus.runningCount === 0 && queueStatus.waitingCount === 0 ? (
                        <p className="text-muted-foreground">
                          {translate('agents.history.queue.empty', 'Queue is currently empty.')}
                        </p>
                      ) : (
                        <>
                          {queueStatus.runningCount > 0 && (
                            <div className="rounded border p-3">
                              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                                {translate('agents.history.queue.running', 'Running')}
                              </p>
                              <div className="space-y-2">
                                {queueStatus.running.map(job => (
                                  <div key={job.executionId} className="flex items-center justify-between text-sm">
                                    <div>
                                      <p className="font-medium">{job.executionId}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {translate('agents.history.queue.startedAt', 'Started at')}: {formatDateTime(job.startedAt)}
                                      </p>
                                    </div>
                                    <Badge variant="outline">{translate('agents.status.running', 'Running')}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {queueStatus.waitingCount > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                {translate('agents.history.queue.waiting', 'Waiting')}
                              </p>
                              {queueStatus.waiting.map(job => (
                                <div key={job.executionId} className="rounded border border-dashed p-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <p className="font-medium">
                                        #{job.position} · {job.executionId}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {translate('agents.history.queue.enqueued', 'Queued at')}: {formatDateTime(job.queuedAt)}
                                      </p>
                                    </div>
                                    <Badge variant="outline">{translate('agents.history.queue.waitingStatus', 'Waiting')}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <span>{translate('agents.history.queue.priority', 'Priority')}: {job.priority ?? 0}</span>
                                    <span>{translate('agents.history.queue.attempts', 'Attempts')}: {job.attempts || 0}</span>
                                    <span>{translate('agents.history.queue.retryAt', 'Next retry')}: {job.nextRetryAt ? formatDateTime(job.nextRetryAt) : translate('agents.history.queue.notScheduled', 'Not scheduled')}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Input
                                      type="number"
                                      value={queuePriorityDraft[job.executionId] ?? job.priority ?? 0}
                                      onChange={(event) => setQueuePriorityDraft(prev => ({ ...prev, [job.executionId]: Number(event.target.value) }))}
                                      className="h-8 w-20 text-xs"
                                    />
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      className={cn('h-8 px-3', accentButtonClasses)}
                                      onClick={() => handleUpdateQueuePriority(job.executionId, queuePriorityDraft[job.executionId] ?? job.priority ?? 0)}
                                    >
                                      <ArrowUpDown className="size-3" />
                                      <span className="ml-1">{translate('agents.history.queue.update', 'Update')}</span>
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      className={cn('h-8 px-3', softDestructiveClasses)}
                                      onClick={() => handleCancelQueuedTask(job.executionId)}
                                    >
                                      {translate('agents.history.queue.cancel', 'Cancel')}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              {translate('agents.deleteConfirm.title', 'Delete Agent')}
            </DialogTitle>
            <DialogDescription>
              {translate('agents.deleteConfirm.description', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', agentToDelete?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {translate('confirms.cancelButton', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {translate('agents.actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
