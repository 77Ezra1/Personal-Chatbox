import { useState, useEffect, useRef } from 'react'
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

const TaskStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped'
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

const LogEntry = ({ entry, index }) => {
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
  const [taskInput, setTaskInput] = useState('')
  const [status, setStatus] = useState(TaskStatus.IDLE)
  const [progress, setProgress] = useState(0)
  const [subTasks, setSubTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)

  const logsEndRef = useRef(null)

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, type, message }])
  }

  const handleExecute = async () => {
    if (!taskInput.trim() || status === TaskStatus.RUNNING) return

    setStatus(TaskStatus.RUNNING)
    setProgress(0)
    setSubTasks([])
    setLogs([])
    setResult(null)
    setError(null)
    setStartTime(Date.now())
    setEndTime(null)

    addLog(`Starting task execution for agent: ${agent.name}`, 'info')
    addLog(`Task: ${taskInput}`, 'info')

    try {
      // Call the actual execution API
      if (onExecute) {
        const taskData = {
          title: taskInput,
          description: taskInput,
          inputData: {}
        }

        // Start execution
        addLog('Sending task to agent...', 'info')
        const response = await onExecute(agent.id, taskData)

        // Simulate progress updates (in real app, use polling or websockets)
        const mockSubTasks = [
          { name: 'Analyzing task', description: 'Understanding requirements' },
          { name: 'Planning approach', description: 'Breaking down into steps' },
          { name: 'Executing task', description: 'Running agent capabilities' },
          { name: 'Validating results', description: 'Checking output quality' }
        ]

        for (let i = 0; i < mockSubTasks.length; i++) {
          const task = mockSubTasks[i]
          const taskStart = Date.now()

          setSubTasks(prev => [
            ...prev,
            { ...task, status: TaskStatus.RUNNING }
          ])
          addLog(`Started: ${task.name}`, 'info')

          // Simulate task execution
          await new Promise(resolve => setTimeout(resolve, 1500))

          const taskEnd = Date.now()
          const duration = taskEnd - taskStart

          setSubTasks(prev => prev.map((t, idx) =>
            idx === i
              ? { ...t, status: TaskStatus.COMPLETED, duration, result: 'Completed successfully' }
              : t
          ))
          addLog(`Completed: ${task.name} (${duration}ms)`, 'success')

          setProgress(((i + 1) / mockSubTasks.length) * 100)
        }

        setStatus(TaskStatus.COMPLETED)
        setEndTime(Date.now())
        setResult(response?.result?.summary || 'Task completed successfully!')
        addLog('All subtasks completed', 'success')
        addLog('Task execution finished', 'success')
      }
    } catch (err) {
      setStatus(TaskStatus.FAILED)
      setEndTime(Date.now())
      setError(err.message || 'Task execution failed')
      addLog(`Error: ${err.message}`, 'error')
    }
  }

  const handleStop = () => {
    if (status !== TaskStatus.RUNNING) return

    setStatus(TaskStatus.STOPPED)
    setEndTime(Date.now())
    addLog('Task execution stopped by user', 'warning')

    setSubTasks(prev => prev.map(task =>
      task.status === TaskStatus.RUNNING
        ? { ...task, status: TaskStatus.STOPPED }
        : task
    ))

    if (onStop) {
      onStop(agent.id)
    }
  }

  const handleReset = () => {
    setStatus(TaskStatus.IDLE)
    setProgress(0)
    setSubTasks([])
    setLogs([])
    setResult(null)
    setError(null)
    setTaskInput('')
    setStartTime(null)
    setEndTime(null)
  }

  const duration = startTime && endTime ? endTime - startTime : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Execute Task - {agent?.name}
          </DialogTitle>
          <DialogDescription>
            Run tasks using your AI agent's capabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Description</label>
            <Textarea
              placeholder="Describe the task you want the agent to perform..."
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
                Execute Task
              </Button>
            )}
            {status === TaskStatus.RUNNING && (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="flex-1"
              >
                <StopCircle className="size-4" />
                Stop Execution
              </Button>
            )}
            {[TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.STOPPED].includes(status) && (
              <Button onClick={handleReset} className="flex-1">
                <Play className="size-4" />
                Run Another Task
              </Button>
            )}
          </div>

          {/* Progress */}
          {status === TaskStatus.RUNNING && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
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
                <span className="font-medium capitalize">{status}</span>
              </div>
              {duration && (
                <Badge variant="outline">
                  {(duration / 1000).toFixed(2)}s
                </Badge>
              )}
            </div>
          )}

          {/* Results */}
          {result && status === TaskStatus.COMPLETED && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                    Task Completed Successfully
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">{result}</p>
                </div>
              </div>
            </div>
          )}

          {error && status === TaskStatus.FAILED && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive mb-1">Task Failed</h4>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for SubTasks and Logs */}
          {status !== TaskStatus.IDLE && (
            <Tabs defaultValue="subtasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subtasks">
                  SubTasks ({subTasks.length})
                </TabsTrigger>
                <TabsTrigger value="logs">
                  Logs ({logs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subtasks">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {subTasks.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        No subtasks yet
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
                        No logs yet
                      </div>
                    ) : (
                      <>
                        {logs.map((entry, idx) => (
                          <LogEntry key={idx} entry={entry} index={idx} />
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
