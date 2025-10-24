import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import AgentsPage from '../AgentsPage'

const axiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}))

vi.mock('axios', () => ({
  default: {
    ...axiosInstance,
    create: vi.fn(() => axiosInstance)
  }
}))

import axios from 'axios'

const mockAgentAPI = vi.hoisted(() => ({
  getExecutions: vi.fn(),
  getQueueStatus: vi.fn(),
  getSummaryMetrics: vi.fn()
}))

vi.mock('@/lib/apiClient', () => ({
  agentAPI: mockAgentAPI
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ translate: (_key, fallback) => fallback })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' })
}))

vi.mock('@/components/agents/AgentList', () => ({
  AgentList: ({ agents, onViewHistory }) => (
    <div>
      <span>{agents[0]?.name}</span>
      <button onClick={() => agents[0] && onViewHistory(agents[0])}>Open History</button>
    </div>
  )
}))

vi.mock('@/components/agents/AgentEditor', () => ({
  AgentEditor: () => null
}))

vi.mock('@/components/agents/AgentTaskExecutor', () => ({
  AgentTaskExecutor: () => null
}))

describe('AgentsPage history error handling', () => {
  beforeEach(() => {
    axios.get.mockReset()
    Object.values(mockAgentAPI).forEach(fn => fn.mockReset())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('displays an error when execution history fails to load', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    axios.get.mockImplementation((url) => {
      if (url === '/api/agents') {
        return Promise.resolve({ data: { agents: [{ id: 'agent-1', name: 'Test Agent' }] } })
      }
      return Promise.resolve({ data: {} })
    })

    mockAgentAPI.getExecutions.mockRejectedValue(new Error('Network error'))
    mockAgentAPI.getQueueStatus.mockResolvedValue({ data: { waiting: [], running: [], waitingCount: 0, runningCount: 0 } })
    mockAgentAPI.getSummaryMetrics.mockResolvedValue({ data: { totals: { executions: 0, success: 0, failed: 0, successRate: 0, avgDuration: 0 }, recent: [] } })

    render(<AgentsPage />)

    await screen.findByText('Test Agent')

    const openHistoryButton = await screen.findByText('Open History')
    fireEvent.click(openHistoryButton)

    await waitFor(() => {
      expect(mockAgentAPI.getExecutions).toHaveBeenCalledWith('agent-1', expect.any(Object))
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })
})
