import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  StopCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { agentAPI } from '@/lib/apiClient'
import { useTranslation } from '@/hooks/useTranslation'

const TaskStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped'
}

const mapExecutionStatus = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'running':
      return TaskStatus.RUNNING
    case 'queued':
    case 'retrying':
      return TaskStatus.RUNNING
    case 'completed':
      return TaskStatus.COMPLETED
    case 'failed':
      return TaskStatus.FAILED
    case 'cancelled':
      return TaskStatus.STOPPED
    default:
      return TaskStatus.IDLE
  }
}

const mapSubtaskStatus = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return TaskStatus.IDLE
    case 'running':
      return TaskStatus.RUNNING
    case 'completed':
      return TaskStatus.COMPLETED
    case 'failed':
      return TaskStatus.FAILED
    case 'skipped':
    case 'cancelled':
      return TaskStatus.STOPPED
    default:
      return TaskStatus.IDLE
  }
}

const formatSubtaskResult = (outputData) => {
  if (!outputData) return null
  if (typeof outputData === 'string') return outputData
  try {
    return JSON.stringify(outputData)
  } catch {
    return String(outputData)
  }
}

const StatusIcon = ({ status, className }) => {
  const icons = {
    [TaskStatus.IDLE]: Clock,
    [TaskStatus.RUNNING]: Loader2,
    [TaskStatus.COMPLETED]: CheckCircle2,
    [TaskStatus.FAILED]: XCircle,
    [TaskStatus.STOPPED]: StopCircle
  }

  const Icon = icons[status] || Clock

  return (
    <Icon
      className={cn(
        'size-4',
        status === TaskStatus.RUNNING && 'animate-spin',
        className
      )}
    />
  )
}

const SubTask = ({ task, index }) => {
  const statusColors = {
    [TaskStatus.IDLE]: 'text-muted-foreground',
    [TaskStatus.RUNNING]: 'text-primary',
    [TaskStatus.COMPLETED]: 'text-green-600',
    [TaskStatus.FAILED]: 'text-destructive',
    [TaskStatus.STOPPED]: 'text-orange-500'
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon status={task.status} className={statusColors[task.status]} />
          <span className="font-medium text-sm">{task.name}</span>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground">{task.description}</p>
        )}
        {task.result && task.status === TaskStatus.COMPLETED && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs">
            {task.result}
          </div>
        )}
        {task.error && task.status === TaskStatus.FAILED && (
          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            {task.error}
          </div>
        )}
      </div>
      {task.duration && (
        <Badge variant="outline" className="shrink-0">
          {task.duration}ms
        </Badge>
      )}
    </div>
  )
}

const LogEntry = ({ entry }) => {
  const typeColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
    error: 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex gap-3 text-sm font-mono">
      <span className="text-muted-foreground text-xs">{entry.timestamp}</span>
      <span className={cn('font-semibold', typeColors[entry.type])}>
        [{entry.type.toUpperCase()}]
      </span>
      <span className="flex-1">{entry.message}</span>
    </div>
  )
}

export function AgentTaskExecutor({
  agent,
  open,
  onOpenChange,
  onExecute,
  onStop
}) {
  const { translate } = useTranslation()
  const [taskInput, setTaskInput] = useState('')
  const [status, setStatus] = useState(TaskStatus.IDLE)
  const [progress, setProgress] = useState(0)
  const [subTasks, setSubTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [executionId, setExecutionId] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [sseReady, setSseReady] = useState(false)
  const [showRawResult, setShowRawResult] = useState(false)

  const [retrying, setRetrying] = useState(false)

  const formatStatusLabel = useCallback((statusValue) => {
    if (!statusValue) return ''
    const key = String(statusValue).toLowerCase()
    const fallback = key.charAt(0).toUpperCase() + key.slice(1)
    return translate(`agents.executor.status.${key}`, fallback)
  }, [translate])

  const logsEndRef = useRef(null)
  const pollingRef = useRef(null)
  const activeTaskIdRef = useRef(null)
  const currentStepRef = useRef(null)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, type, message }])
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchExecutionState = useCallback(async (agentId, currentTaskId) => {
    if (sseReady) {
      return;
    }
    try {
      const [progressRes, tasksRes] = await Promise.all([
        agentAPI.getProgress(agentId),
        agentAPI.getTasks(agentId)
      ])

      const progressData = progressRes.data || {}
      const tasks = tasksRes.data?.tasks || []
      const activeTask = currentTaskId
        ? tasks.find(task => task.id === currentTaskId)
        : tasks[0]

      if (progressData.currentStep && progressData.currentStep !== currentStepRef.current) {
        addLog(translate('agents.executor.logs.currentStep', {
          step: progressData.currentStep
        }), 'info')
        currentStepRef.current = progressData.currentStep
      }

      if (activeTask) {
        setTaskId(activeTask.id)
        activeTaskIdRef.current = activeTask.id
        setResult(activeTask.outputData || null)
        if (activeTask.outputData?.error) {
          setError(activeTask.outputData.error)
        }

        try {
          const subtaskRes = await agentAPI.getSubTasks(agentId, activeTask.id)
          const subtasks = subtaskRes.data?.subtasks || []
          setSubTasks(subtasks.map(sub => ({
            id: sub.id,
            name: sub.title || translate('agents.executor.subtaskFallback', 'Subtask'),
            description: sub.description || '',
            status: mapSubtaskStatus(sub.status),
            result: formatSubtaskResult(sub.outputData ?? sub.output_data),
            error: sub.errorMessage ?? sub.error_message,
            duration: sub.durationMs ?? sub.duration_ms
          })))
        } catch (subtaskError) {
          const message = subtaskError?.message || translate('agents.executor.logs.unknownError', 'Unknown error')
          addLog(translate('agents.executor.logs.fetchSubtasksFailed', {
            message
          }), 'warning')
        }
      } else {
        setSubTasks([])
      }

      const percent = Math.round((progressData.progress || 0) * 100)
      setProgress(Number.isFinite(percent) ? percent : 0)

      if (progressData.errorMessage) {
        setError(progressData.errorMessage)
      }

      const nextStatus = mapExecutionStatus(progressData.status)
      setStatus(prev => {
        if (prev !== nextStatus) {
          if (nextStatus === TaskStatus.COMPLETED) {
            addLog(translate('agents.executor.logs.completed', 'Task execution completed'), 'success')
            setEndTime(Date.now())
            setError(null)
          } else if (nextStatus === TaskStatus.FAILED) {
            addLog(translate('agents.executor.logs.failed', 'Task execution failed'), 'error')
            setEndTime(Date.now())
          } else if (nextStatus === TaskStatus.STOPPED) {
            addLog(translate('agents.executor.logs.cancelled', 'Task execution cancelled'), 'warning')
            setEndTime(Date.now())
          }
        }
        return nextStatus
      })

      if ([TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.STOPPED].includes(nextStatus)) {
        stopPolling()
      }
    } catch (err) {
      const message = err?.message || translate('agents.executor.logs.unknownError', 'Unknown error')
      addLog(translate('agents.executor.logs.pollingFailed', {
        message
      }), 'warning')
    }
  }, [addLog, stopPolling, sseReady, translate])

  const startPolling = useCallback((agentId, currentTaskId) => {
    if (sseReady) {
      return
    }
    stopPolling()
    activeTaskIdRef.current = currentTaskId
    fetchExecutionState(agentId, currentTaskId)
    pollingRef.current = setInterval(() => {
      fetchExecutionState(agentId, activeTaskIdRef.current)
    }, 2000)
  }, [fetchExecutionState, stopPolling, sseReady])

  useEffect(() => {
    if (!open) {
      stopPolling()
    }
  }, [open, stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  useEffect(() => {
    if (sseReady) {
      stopPolling()
    }
  }, [sseReady, stopPolling])

  const handleServerEvent = useCallback((event) => {
    if (!event || !event.data) return
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }

    if (!data || data.status === 'connected') {
      return
    }

    if (data.executionId && executionId && data.executionId !== executionId) {
      return
    }

    if (!executionId && data.executionId) {
      setExecutionId(data.executionId)
    }

    if (data.taskId && !activeTaskIdRef.current) {
      activeTaskIdRef.current = data.taskId
      setTaskId(data.taskId)
    }

    if (typeof data.progress === 'number') {
      const normalized = data.progress > 1 ? data.progress : data.progress * 100
      const percent = Math.round(Math.max(0, Math.min(100, normalized)))
      setProgress(percent)
    }

    if (data.currentStep && data.currentStep !== currentStepRef.current) {
      currentStepRef.current = data.currentStep
      addLog(translate('agents.executor.logs.currentStep', {
        step: data.currentStep
      }), 'info')
    }

    if (data.subtask) {
      const subtaskPayload = data.subtask
      const subtaskStatus = mapSubtaskStatus(subtaskPayload.status)
      setSubTasks(prev => {
        const next = [...prev]
        const index = next.findIndex(item => item.id === subtaskPayload.id)
      const updated = {
        id: subtaskPayload.id,
        name: subtaskPayload.title || translate('agents.executor.subtaskFallback', 'Subtask'),
        description: subtaskPayload.description || '',
          status: subtaskStatus,
          result: formatSubtaskResult(subtaskPayload.result),
          error: subtaskPayload.error || null,
          duration: subtaskPayload.duration || subtaskPayload.durationMs || null
        }
        if (index === -1) {
          next.push(updated)
        } else {
          next[index] = { ...next[index], ...updated }
        }
        return next
      })
    }

    if (data.result) {
      setResult(data.result)
      setError(null)
    }

    if (data.error || data.errorMessage) {
      setError(data.error || data.errorMessage)
    }

    if (data.status) {
      const mapped = mapExecutionStatus(data.status)
      if (mapped !== status) {
        setStatus(mapped)
        if (mapped === TaskStatus.RUNNING && !startTime) {
          setStartTime(Date.now())
        }
        if (mapped === TaskStatus.COMPLETED) {
          setEndTime(Date.now())
          setError(null)
        } else if ([TaskStatus.FAILED, TaskStatus.STOPPED].includes(mapped)) {
          setEndTime(Date.now())
        }
        const lower = data.status.toLowerCase()
        const logType = lower === 'failed' ? 'error' : lower === 'completed' ? 'success' : 'info'
        addLog(translate('agents.executor.logs.executionStatus', {
          status: data.status
        }), logType)
      }

      if (['completed', 'failed', 'cancelled'].includes(data.status.toLowerCase())) {
        stopPolling()
      }
    }
  }, [executionId, status, startTime, addLog, stopPolling, translate])

  useEffect(() => {
    if (!open || !agent?.id) {
      return
    }

    const origin = window.location.origin
    const url = new URL(`/api/agents/${agent.id}/events`, origin)
    const source = new EventSource(url.toString(), { withCredentials: true })
    eventSourceRef.current = source

    source.onopen = () => {
      setSseReady(true)
      addLog(translate('agents.executor.logs.connected', 'Connected to realtime task stream'), 'info')
    }

    source.onmessage = handleServerEvent

    source.onerror = () => {
      setSseReady(false)
      addLog(translate('agents.executor.logs.disconnected', 'Realtime channel disconnected, switching to polling'), 'warning')
      source.close()
      eventSourceRef.current = null
      if (status === TaskStatus.RUNNING && activeTaskIdRef.current) {
        startPolling(agent.id, activeTaskIdRef.current)
      }
    }

    return () => {
      source.close()
      eventSourceRef.current = null
      setSseReady(false)
    }
  }, [open, agent?.id, handleServerEvent, addLog, status, startPolling, translate])

  const handleExecute = async (isRetry = false) => {
    if (!taskInput.trim() || status === TaskStatus.RUNNING) return

    stopPolling()
    setStatus(TaskStatus.RUNNING)
    setRetrying(isRetry)
    setProgress(0)
    setSubTasks([])
    setLogs([])
    setResult(null)
    setError(null)
    setStartTime(Date.now())
    setEndTime(null)
    setExecutionId(null)
    setTaskId(null)
    activeTaskIdRef.current = null
    currentStepRef.current = null

    addLog(
      translate(
        isRetry ? 'agents.executor.logs.retry' : 'agents.executor.logs.start',
        { name: agent.name }
      ),
      'info'
    )
    addLog(translate('agents.executor.logs.taskLine', { task: taskInput }), 'info')

    try {
      if (onExecute) {
        const taskData = {
          title: taskInput,
          description: taskInput,
          inputData: {}
        }

        addLog(translate('agents.executor.logs.sending', 'Sending task to agent...'), 'info')
        const response = await onExecute(agent.id, taskData)

        if (!response?.taskId || !response?.executionId) {
          throw new Error(translate('agents.executor.errors.incompleteResponse', 'Task execution response is incomplete'))
        }

        setExecutionId(response.executionId)
        setTaskId(response.taskId)
        activeTaskIdRef.current = response.taskId
        addLog(translate('agents.executor.logs.queued', { id: response.taskId }), 'info')
        if (!sseReady) {
          startPolling(agent.id, response.taskId)
        }
      }
    } catch (err) {
      stopPolling()
      setStatus(TaskStatus.FAILED)
      setEndTime(Date.now())
      const message = err?.message || translate('agents.executor.logs.unknownError', 'Unknown error')
      setError(err?.message || translate('agents.executor.errors.executionFailed', 'Task execution failed'))
      addLog(translate('agents.executor.logs.error', { message }), 'error')
    } finally {
      setRetrying(false)
    }
  }

  const handleStop = async () => {
    if (status !== TaskStatus.RUNNING) return

    stopPolling()
    setStatus(TaskStatus.STOPPED)
    setEndTime(Date.now())
    addLog(translate('agents.executor.logs.stop', 'Task execution stopped by user'), 'warning')

    setSubTasks(prev => prev.map(task =>
      task.status === TaskStatus.RUNNING
        ? { ...task, status: TaskStatus.STOPPED }
        : task
    ))

    if (onStop) {
      try {
        await onStop(agent.id)
      } catch (err) {
        const message = err?.message || translate('agents.executor.logs.unknownError', 'Unknown error')
        addLog(translate('agents.executor.logs.stopFailed', { message }), 'error')
      }
    }
  }

  const handleReset = () => {
    stopPolling()
    setStatus(TaskStatus.IDLE)
    setProgress(0)
    setSubTasks([])
    setLogs([])
    setResult(null)
    setError(null)
    setTaskInput('')
    setStartTime(null)
    setEndTime(null)
    setExecutionId(null)
    setTaskId(null)
    activeTaskIdRef.current = null
    currentStepRef.current = null
  }

  const duration = startTime && endTime ? endTime - startTime : null
  const displayResult = useMemo(() => {
    if (!result) return null
    if (typeof result === 'string') return result
    if (typeof result.summary === 'string') return result.summary
    try {
      return JSON.stringify(result.summary || result)
    } catch {
      return String(result)
    }
  }, [result])

  const usageSummary = useMemo(() => {
    if (!result?.usage) return null
    try {
      return Object.entries(result.usage)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')
    } catch {
      return null
    }
  }, [result])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            {translate('agents.executor.title', {
              name: agent?.name || translate('agents.card.untitledAgent', 'Untitled Agent')
            })}
          </DialogTitle>
          <DialogDescription>
            {translate('agents.executor.description', 'Run tasks using your AI agent\'s capabilities')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate('agents.executor.taskLabel', 'Task Description')}
            </label>
            <Textarea
              placeholder={translate('agents.executor.taskPlaceholder', 'Describe the task you want the agent to perform...')}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              disabled={status === TaskStatus.RUNNING}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {status === TaskStatus.IDLE && (
              <Button
                onClick={handleExecute}
                disabled={!taskInput.trim()}
                className="flex-1"
              >
                <Play className="size-4" />
                {translate('agents.executor.buttons.execute', 'Execute Task')}
              </Button>
            )}
            {status === TaskStatus.RUNNING && (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="flex-1"
              >
                <StopCircle className="size-4" />
                {translate('agents.executor.buttons.stop', 'Stop Execution')}
              </Button>
            )}
            {[TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.STOPPED].includes(status) && (
              <div className="flex flex-1 gap-2">
                <Button
                  onClick={handleExecute}
                  disabled={retrying || !taskInput.trim()}
                  className="flex-1"
                >
                  {retrying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {translate('agents.executor.buttons.retry', 'Retry Task')}
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  {translate('agents.executor.buttons.clear', 'Clear')}
                </Button>
              </div>
            )}
          </div>

          {/* Progress */}
          {status !== TaskStatus.IDLE && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {translate('agents.executor.progress', 'Progress')}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Status Summary */}
          {status !== TaskStatus.IDLE && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <StatusIcon status={status} />
                <span className="font-medium">{formatStatusLabel(status)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {taskId && (
                  <span>{translate('agents.executor.status.taskId', { id: taskId.slice(0, 8) })}</span>
                )}
                {executionId && (
                  <span>{translate('agents.executor.status.executionId', { id: executionId.slice(0, 8) })}</span>
                )}
                {duration && (
                  <Badge variant="outline">
                    {translate('agents.executor.status.durationSeconds', {
                      seconds: (duration / 1000).toFixed(2)
                    })}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Results */}
        {displayResult && status === TaskStatus.COMPLETED && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  {translate('agents.executor.result.successTitle', 'Task Completed Successfully')}
                </h4>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap break-words">{displayResult}</p>
                  {usageSummary && (
                    <p className="text-xs text-green-700/80 dark:text-green-200/70">
                      {translate('agents.executor.result.tokens', { usage: usageSummary })}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowRawResult(prev => !prev)}
                    className="w-fit"
                  >
                    {showRawResult
                      ? translate('agents.executor.buttons.hideRaw', 'Hide Raw JSON')
                      : translate('agents.executor.buttons.showRaw', 'View Raw JSON')}
                  </Button>
                  {showRawResult && result && (
                    <pre className="max-h-48 overflow-auto rounded border bg-background p-2 text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && status === TaskStatus.FAILED && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-1">
                  {translate('agents.executor.result.failureTitle', 'Task Failed')}
                </h4>
                <p className="text-sm text-destructive/80">{error}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setShowRawResult(prev => !prev)}
                      className="w-fit"
                    >
                      {showRawResult
                        ? translate('agents.executor.buttons.hideRaw', 'Hide Raw JSON')
                        : translate('agents.executor.buttons.showRaw', 'View Raw JSON')}
                    </Button>
                    <Button
                      variant="default"
                      size="xs"
                      disabled={retrying}
                      onClick={() => handleExecute(true)}
                      className="w-fit"
                    >
                      {retrying ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                      {translate('agents.executor.buttons.retryNow', 'Retry Now')}
                    </Button>
                  </div>
                  {showRawResult && result && (
                    <pre className="max-h-48 overflow-auto rounded border bg-background p-2 text-xs mt-2">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
              </div>
            </div>
          </div>
        )}

          {/* Tabs for SubTasks and Logs */}
          {status !== TaskStatus.IDLE && (
            <Tabs defaultValue="subtasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subtasks">
                  {translate('agents.executor.tabs.subtasks', { count: subTasks.length })}
                </TabsTrigger>
                <TabsTrigger value="logs">
                  {translate('agents.executor.tabs.logs', { count: logs.length })}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subtasks">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {subTasks.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        {translate('agents.executor.empty.subtasks', 'No subtasks yet')}
                      </div>
                    ) : (
                      subTasks.map((task, idx) => (
                        <SubTask key={idx} task={task} index={idx} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="logs">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-1">
                    {logs.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        {translate('agents.executor.empty.logs', 'No logs yet')}
                      </div>
                    ) : (
                      <>
                        {logs.map((entry, idx) => (
                          <LogEntry key={idx} entry={entry} />
                        ))}
                        <div ref={logsEndRef} />
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
