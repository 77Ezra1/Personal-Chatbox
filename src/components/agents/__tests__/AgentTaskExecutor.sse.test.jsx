import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'
import { AgentTaskExecutor } from '../AgentTaskExecutor'

const replaceVars = (text = '', variables = {}) => {
  return Object.entries(variables).reduce((acc, [paramKey, paramValue]) => (
    acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
  ), text)
}

const mockAgentAPI = vi.hoisted(() => ({
  getProgress: vi.fn().mockResolvedValue({ data: { status: 'queued', progress: 0 } }),
  getTasks: vi.fn().mockResolvedValue({ data: { tasks: [] } }),
  getSubTasks: vi.fn().mockResolvedValue({ data: { subtasks: [] } }),
  stop: vi.fn()
}))

vi.mock('@/lib/apiClient', () => ({
  agentAPI: mockAgentAPI
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    translate: (key, params) => {
      const dictionary = {
        'agents.executor.title': 'Execute Task - {name}',
        'agents.executor.description': 'Run tasks using your AI agent\'s capabilities',
        'agents.executor.taskLabel': 'Task Description',
        'agents.executor.taskPlaceholder': 'Describe the task you want the agent to perform...',
        'agents.executor.progress': 'Progress',
        'agents.executor.subtaskFallback': 'Subtask',
        'agents.executor.buttons.execute': 'Execute Task',
        'agents.executor.buttons.stop': 'Stop Execution',
        'agents.executor.buttons.retry': 'Retry Task',
        'agents.executor.buttons.clear': 'Clear',
        'agents.executor.buttons.retryNow': 'Retry Now',
        'agents.executor.buttons.hideRaw': 'Hide Raw JSON',
        'agents.executor.buttons.showRaw': 'View Raw JSON',
        'agents.executor.status.idle': 'Idle',
        'agents.executor.status.running': 'Running',
        'agents.executor.status.completed': 'Completed',
        'agents.executor.status.failed': 'Failed',
        'agents.executor.status.stopped': 'Stopped',
        'agents.executor.status.taskId': 'Task: {id}',
        'agents.executor.status.executionId': 'Exec: {id}',
        'agents.executor.status.durationSeconds': '{seconds}s',
        'agents.executor.result.successTitle': 'Task Completed Successfully',
        'agents.executor.result.tokens': 'Tokens: {usage}',
        'agents.executor.result.failureTitle': 'Task Failed',
        'agents.executor.tabs.subtasks': 'Subtasks ({count})',
        'agents.executor.tabs.logs': 'Logs ({count})',
        'agents.executor.empty.subtasks': 'No subtasks yet',
        'agents.executor.empty.logs': 'No logs yet',
        'agents.executor.logs.connected': 'Connected to realtime task stream',
        'agents.executor.logs.disconnected': 'Realtime channel disconnected, switching to polling',
        'agents.executor.logs.currentStep': 'Current step: {step}',
        'agents.executor.logs.fetchSubtasksFailed': 'Failed to fetch subtasks: {message}',
        'agents.executor.logs.completed': 'Task execution completed',
        'agents.executor.logs.failed': 'Task execution failed',
        'agents.executor.logs.cancelled': 'Task execution cancelled',
        'agents.executor.logs.pollingFailed': 'Progress polling failed: {message}',
        'agents.executor.logs.start': 'Starting task execution for agent: {name}',
        'agents.executor.logs.retry': 'Retrying task execution for agent: {name}',
        'agents.executor.logs.taskLine': 'Task: {task}',
        'agents.executor.logs.sending': 'Sending task to agent...',
        'agents.executor.logs.queued': 'Execution queued (task {id})',
        'agents.executor.logs.executionStatus': 'Execution status: {status}',
        'agents.executor.logs.error': 'Error: {message}',
        'agents.executor.logs.stop': 'Task execution stopped by user',
        'agents.executor.logs.stopFailed': 'Failed to stop task: {message}',
        'agents.executor.logs.unknownError': 'Unknown error',
        'agents.executor.errors.incompleteResponse': 'Task execution response is incomplete',
        'agents.executor.errors.executionFailed': 'Task execution failed'
      }

      if (typeof params === 'string') {
        return dictionary[key] ? replaceVars(dictionary[key], {}) : params
      }

      const template = dictionary[key]
      if (template) {
        return replaceVars(template, params || {})
      }

      if (params && typeof params === 'object') {
        return replaceVars(key, params)
      }

      return key
    }
  })
}))

class MockEventSource {
  static instances = []

  constructor(url, options = {}) {
    this.url = url
    this.options = options
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    MockEventSource.instances.push(this)
  }

  close() {
    this.onopen = null
    this.onmessage = null
    this.onerror = null
  }

  emitOpen(event = {}) {
    this.onopen?.(event)
  }

  emitMessage(data) {
    this.onmessage?.({ data })
  }
}

global.EventSource = MockEventSource

describe('AgentTaskExecutor SSE handling', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    Object.values(mockAgentAPI).forEach(fn => fn.mockClear?.())
    mockAgentAPI.getProgress.mockResolvedValue({ data: { status: 'queued', progress: 0 } })
    mockAgentAPI.getTasks.mockResolvedValue({ data: { tasks: [] } })
    mockAgentAPI.getSubTasks.mockResolvedValue({ data: { subtasks: [] } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('updates logs when SSE message is received', async () => {
    const agent = {
      id: 'agent-1',
      name: 'Test Agent',
      config: {}
    }

    render(
      <AgentTaskExecutor
        agent={agent}
        open
        onOpenChange={() => {}}
        onExecute={() => Promise.resolve({ executionId: 'exec-1', taskId: 'task-1' })}
        onStop={() => Promise.resolve()}
      />
    )

    expect(MockEventSource.instances.length).toBeGreaterThan(0)
    const instance = MockEventSource.instances[0]

    await waitFor(() => {
      expect(instance).toBeDefined()
    })

    await act(async () => {
      instance.emitOpen({})
      instance.emitMessage(JSON.stringify({
        status: 'running',
        progress: 0.5,
        executionId: 'exec-1',
        taskId: 'task-1'
      }))
    })

    // Debug: inspect available log counters
    await waitFor(() => {
      expect(screen.getByText(/Logs \(2\)/i)).toBeInTheDocument()
    })
  })
})
