import { useEffect, useCallback } from 'react'

/**
 * 工作流键盘快捷键 Hook
 * 提供全局键盘快捷键支持
 */
export function useWorkflowKeyboardShortcuts({
  enabled = true,
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onSelectAll,
  onSearch,
  onRun,
  onDebug,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleDebugger
}) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // 检查是否在输入框中
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey

    // Ctrl/Cmd + S - 保存
    if (ctrlOrCmd && event.key === 's') {
      event.preventDefault()
      onSave?.()
      return
    }

    // Ctrl/Cmd + Z - 撤销
    if (ctrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      onUndo?.()
      return
    }

    // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y - 重做
    if ((ctrlOrCmd && event.shiftKey && event.key === 'z') || (ctrlOrCmd && event.key === 'y')) {
      event.preventDefault()
      onRedo?.()
      return
    }

    // Ctrl/Cmd + A - 全选
    if (ctrlOrCmd && event.key === 'a' && !isInputField) {
      event.preventDefault()
      onSelectAll?.()
      return
    }

    // Ctrl/Cmd + C - 复制
    if (ctrlOrCmd && event.key === 'c' && !isInputField) {
      event.preventDefault()
      onCopy?.()
      return
    }

    // Ctrl/Cmd + V - 粘贴
    if (ctrlOrCmd && event.key === 'v' && !isInputField) {
      event.preventDefault()
      onPaste?.()
      return
    }

    // Delete/Backspace - 删除 (仅在非输入框时)
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isInputField) {
      event.preventDefault()
      onDelete?.()
      return
    }

    // Ctrl/Cmd + F - 搜索
    if (ctrlOrCmd && event.key === 'f') {
      event.preventDefault()
      onSearch?.()
      return
    }

    // Ctrl/Cmd + Enter - 运行工作流
    if (ctrlOrCmd && event.key === 'Enter') {
      event.preventDefault()
      onRun?.()
      return
    }

    // Ctrl/Cmd + Shift + D - 调试模式
    if (ctrlOrCmd && event.shiftKey && event.key === 'D') {
      event.preventDefault()
      onDebug?.()
      return
    }

    // Ctrl/Cmd + = 或 + - 放大
    if (ctrlOrCmd && (event.key === '=' || event.key === '+')) {
      event.preventDefault()
      onZoomIn?.()
      return
    }

    // Ctrl/Cmd + - - 缩小
    if (ctrlOrCmd && event.key === '-') {
      event.preventDefault()
      onZoomOut?.()
      return
    }

    // Ctrl/Cmd + 0 - 重置缩放
    if (ctrlOrCmd && event.key === '0') {
      event.preventDefault()
      onZoomReset?.()
      return
    }

    // Ctrl/Cmd + Shift + P - 切换调试面板
    if (ctrlOrCmd && event.shiftKey && event.key === 'P') {
      event.preventDefault()
      onToggleDebugger?.()
      return
    }

    // F5 - 刷新/运行
    if (event.key === 'F5') {
      event.preventDefault()
      onRun?.()
      return
    }

    // F9 - 切换断点 (需要在节点上下文中处理)
    if (event.key === 'F9') {
      event.preventDefault()
      // 断点切换由节点上下文处理
      return
    }

    // F10 - 单步执行
    if (event.key === 'F10') {
      event.preventDefault()
      // 单步执行（需要从外部传入）
      return
    }
  }, [
    enabled,
    onSave,
    onUndo,
    onRedo,
    onDelete,
    onCopy,
    onPaste,
    onSelectAll,
    onSearch,
    onRun,
    onDebug,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onToggleDebugger
  ])

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    // 返回快捷键帮助信息
    shortcuts: {
      save: 'Ctrl/Cmd + S',
      undo: 'Ctrl/Cmd + Z',
      redo: 'Ctrl/Cmd + Shift + Z',
      delete: 'Delete/Backspace',
      copy: 'Ctrl/Cmd + C',
      paste: 'Ctrl/Cmd + V',
      selectAll: 'Ctrl/Cmd + A',
      search: 'Ctrl/Cmd + F',
      run: 'Ctrl/Cmd + Enter 或 F5',
      debug: 'Ctrl/Cmd + Shift + D',
      zoomIn: 'Ctrl/Cmd + +',
      zoomOut: 'Ctrl/Cmd + -',
      zoomReset: 'Ctrl/Cmd + 0',
      toggleDebugger: 'Ctrl/Cmd + Shift + P',
      toggleBreakpoint: 'F9',
      stepOver: 'F10'
    }
  }
}
