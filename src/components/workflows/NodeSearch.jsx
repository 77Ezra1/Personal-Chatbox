import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * 节点搜索组件
 * 提供节点快速搜索和导航功能
 */
export function NodeSearch({
  nodes = [],
  onNodeSelect,
  onClose,
  className
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredNodes, setFilteredNodes] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // 自动聚焦搜索框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // 过滤节点
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNodes(nodes)
      setSelectedIndex(0)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = nodes.filter(node => {
      const matchId = node.id?.toLowerCase().includes(term)
      const matchLabel = node.label?.toLowerCase().includes(term)
      const matchType = node.type?.toLowerCase().includes(term)
      return matchId || matchLabel || matchType
    })

    setFilteredNodes(filtered)
    setSelectedIndex(0)
  }, [searchTerm, nodes])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            Math.min(prev + 1, filteredNodes.length - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredNodes[selectedIndex]) {
            handleNodeClick(filteredNodes[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredNodes, selectedIndex, onClose])

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  const handleNodeClick = (node) => {
    onNodeSelect?.(node)
    onClose?.()
  }

  const getNodeTypeLabel = (type) => {
    const labels = {
      start: '开始',
      end: '结束',
      ai_analysis: 'AI分析',
      data_transform: '数据转换',
      condition: '条件判断',
      loop: '循环',
      api_call: 'API调用',
      agent: 'Agent',
      mcp_tool: 'MCP工具',
      parallel: '并行执行',
      merge: '合并'
    }
    return labels[type] || type
  }

  const getNodeTypeColor = (type) => {
    const colors = {
      start: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      end: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      ai_analysis: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      data_transform: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      condition: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      loop: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      api_call: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
      agent: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      mcp_tool: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      parallel: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
      merge: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <div className={cn("flex flex-col bg-background border rounded-lg shadow-lg", className)}>
      {/* 搜索头部 */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索节点 (ID, 标签, 类型)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 搜索结果 */}
      <ScrollArea className="flex-1 max-h-96" ref={listRef}>
        <div className="p-2">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchTerm ? '未找到匹配的节点' : '没有可用的节点'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNodes.map((node, index) => (
                <button
                  key={node.id}
                  data-index={index}
                  onClick={() => handleNodeClick(node)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    "hover:bg-muted/50",
                    index === selectedIndex && "bg-muted border-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {node.label || node.id}
                      </div>
                      {node.label && node.id !== node.label && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          ID: {node.id}
                        </div>
                      )}
                    </div>
                    <Badge className={cn("text-xs flex-shrink-0", getNodeTypeColor(node.type))}>
                      {getNodeTypeLabel(node.type)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>↑↓ 导航</span>
          <span>Enter 选择</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  )
}
