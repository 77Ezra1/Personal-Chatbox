import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/apiClient'

/**
 * 工作流调试器 Hook
 * 管理断点、调试状态和控制操作
 */
export function useWorkflowDebugger(workflowId, executionId) {
  const [breakpoints, setBreakpoints] = useState([])
  const [debugState, setDebugState] = useState({
    isPaused: false,
    currentNode: null,
    variables: {},
    callStack: []
  })

  // 监听 WebSocket 调试事件
  useEffect(() => {
    if (!executionId) return

    // 这里可以添加 WebSocket 监听逻辑
    // 暂时使用轮询方式（简化实现）

    return () => {
      // 清理
    }
  }, [executionId])

  // 设置断点
  const setBreakpoint = useCallback(async (nodeId) => {
    if (!workflowId) return

    try {
      await apiClient.post(`/workflows/${workflowId}/debug/breakpoints`, {
        nodeId
      })
      setBreakpoints(prev => [...new Set([...prev, nodeId])])
    } catch (error) {
      console.error('设置断点失败:', error)
      throw error
    }
  }, [workflowId])

  // 移除断点
  const removeBreakpoint = useCallback(async (nodeId) => {
    if (!workflowId) return

    try {
      await apiClient.delete(`/workflows/${workflowId}/debug/breakpoints/${nodeId}`)
      setBreakpoints(prev => prev.filter(id => id !== nodeId))
    } catch (error) {
      console.error('移除断点失败:', error)
      throw error
    }
  }, [workflowId])

  // 切换断点
  const toggleBreakpoint = useCallback(async (nodeId) => {
    if (breakpoints.includes(nodeId)) {
      await removeBreakpoint(nodeId)
    } else {
      await setBreakpoint(nodeId)
    }
  }, [breakpoints, setBreakpoint, removeBreakpoint])

  // 清除所有断点
  const clearBreakpoints = useCallback(async () => {
    if (!workflowId) return

    try {
      await apiClient.delete(`/workflows/${workflowId}/debug/breakpoints`)
      setBreakpoints([])
    } catch (error) {
      console.error('清除断点失败:', error)
      throw error
    }
  }, [workflowId])

  // 继续执行
  const continueExecution = useCallback(async () => {
    if (!executionId) return

    try {
      await apiClient.post(`/workflows/debug/${executionId}/continue`)
    } catch (error) {
      console.error('继续执行失败:', error)
      throw error
    }
  }, [executionId])

  // 单步执行
  const stepOver = useCallback(async () => {
    if (!executionId) return

    try {
      await apiClient.post(`/workflows/debug/${executionId}/step-over`)
    } catch (error) {
      console.error('单步执行失败:', error)
      throw error
    }
  }, [executionId])

  // 停止调试
  const stopDebug = useCallback(async () => {
    if (!executionId) return

    try {
      await apiClient.post(`/workflows/debug/${executionId}/stop`)
      setDebugState({
        isPaused: false,
        currentNode: null,
        variables: {},
        callStack: []
      })
    } catch (error) {
      console.error('停止调试失败:', error)
      throw error
    }
  }, [executionId])

  // 获取调试状态
  const fetchDebugState = useCallback(async () => {
    if (!executionId) return

    try {
      const response = await apiClient.get(`/workflows/debug/${executionId}/status`)
      setDebugState({
        isPaused: response.data.isPaused,
        currentNode: response.data.currentNode,
        variables: response.data.variables || {},
        callStack: response.data.callStack || []
      })
    } catch (error) {
      // 静默失败（可能是调试会话不存在）
      console.debug('获取调试状态失败:', error)
    }
  }, [executionId])

  // 加载工作流的所有断点
  const loadBreakpoints = useCallback(async () => {
    if (!workflowId) return

    try {
      const response = await apiClient.get(`/workflows/${workflowId}/debug/breakpoints`)
      setBreakpoints(response.data.breakpoints || [])
    } catch (error) {
      console.error('加载断点失败:', error)
    }
  }, [workflowId])

  // 初始加载断点
  useEffect(() => {
    loadBreakpoints()
  }, [loadBreakpoints])

  return {
    // 状态
    breakpoints,
    isPaused: debugState.isPaused,
    currentNode: debugState.currentNode,
    variables: debugState.variables,
    callStack: debugState.callStack,

    // 操作
    setBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    clearBreakpoints,
    continueExecution,
    stepOver,
    stopDebug,
    fetchDebugState,
    loadBreakpoints
  }
}
