import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Play,
  Plus,
  Trash2,
  Save,
  GitBranch,
  Bot,
  Code,
  Filter,
  RefreshCw,
  Zap,
  ArrowRight,
  Circle,
  Grip,
  X
} from 'lucide-react'
import { AgentSelector } from '@/components/agents/AgentSelector'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * ✅ 可视化工作流编辑器
 * 提供拖放式工作流构建界面
 */

// 节点类型配置
const NODE_TYPES = {
  start: {
    label: '开始',
    icon: Play,
    color: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
    description: '工作流起点'
  },
  ai_analysis: {
    label: 'AI 分析',
    icon: Zap,
    color: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
    description: '使用 AI 模型分析数据'
  },
  agent: {
    label: 'Agent 任务',
    icon: Bot,
    color: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
    description: '执行 Agent 任务'
  },
  mcp_tool: {
    label: 'MCP 工具',
    icon: Zap,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300',
    description: '调用 MCP 服务工具'
  },
  data_transform: {
    label: '数据转换',
    icon: RefreshCw,
    color: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300',
    description: '转换数据格式'
  },
  condition: {
    label: '条件判断',
    icon: GitBranch,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
    description: '根据条件分支'
  },
  loop: {
    label: '循环',
    icon: RefreshCw,
    color: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300',
    description: '重复执行任务'
  },
  api_call: {
    label: 'API 调用',
    icon: Code,
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300',
    description: '调用外部 API'
  },
  end: {
    label: '结束',
    icon: Circle,
    color: 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/30 dark:border-gray-700 dark:text-gray-300',
    description: '工作流终点'
  }
}

// ✅ 节点组件 - 支持拖拽
function WorkflowNode({ node, isSelected, isSource, onClick, onDelete, onEdit, onDragEnd }) {
  const nodeType = NODE_TYPES[node.type] || NODE_TYPES.start
  const Icon = nodeType.icon
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleDragStart = (e) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return // 拖拽结束时会触发
    // 拖拽过程中更新位置
  }

  const handleDragEndEvent = (e) => {
    setIsDragging(false)
    if (e.clientX === 0 && e.clientY === 0) return

    // 计算新位置（相对于画布）
    const canvas = e.currentTarget.parentElement
    const canvasRect = canvas.getBoundingClientRect()
    const newX = Math.max(0, e.clientX - canvasRect.left - dragOffset.x)
    const newY = Math.max(0, e.clientY - canvasRect.top - dragOffset.y)

    onDragEnd?.(node.id, { x: newX, y: newY })
  }

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border-2 cursor-move transition-all hover:shadow-md',
        nodeType.color,
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isSource && 'ring-4 ring-blue-500 ring-offset-2',
        isDragging && 'opacity-50 shadow-2xl'
      )}
      onClick={() => onClick(node)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEdit(node)
      }}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEndEvent}
      style={{
        position: 'absolute',
        left: node.position?.x || 0,
        top: node.position?.y || 0,
        minWidth: '200px'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{nodeType.label}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-white/50"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(node)
          }}
          title="配置节点"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs font-medium truncate mb-1">
        {node.label || node.id}
      </div>

      {node.config && Object.keys(node.config).length > 0 ? (
        <div className="text-xs opacity-70 space-y-0.5">
          {Object.entries(node.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              <span className="font-medium">{key}:</span> {String(value).substring(0, 20)}
            </div>
          ))}
          {Object.keys(node.config).length > 2 && (
            <div className="text-xs opacity-50">+{Object.keys(node.config).length - 2} 更多...</div>
          )}
        </div>
      ) : (
        <div className="text-xs opacity-50 italic">
          双击或点击配置按钮编辑
        </div>
      )}

      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
          title="删除节点"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// 连接线组件
function Connection({ from, to, nodes, onDelete }) {
  const fromNode = nodes.find(n => n.id === from)
  const toNode = nodes.find(n => n.id === to)
  const [isHovered, setIsHovered] = useState(false)

  if (!fromNode || !toNode) return null

  const fromX = (fromNode.position?.x || 0) + 90
  const fromY = (fromNode.position?.y || 0) + 50
  const toX = (toNode.position?.x || 0) + 90
  const toY = (toNode.position?.y || 0)

  // 计算中点位置用于放置删除按钮
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  return (
    <>
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
          </marker>
        </defs>
        <path
          d={`M ${fromX} ${fromY} L ${toX} ${toY}`}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          className={cn(
            "transition-all pointer-events-auto cursor-pointer",
            isHovered ? "text-destructive" : "text-muted-foreground"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onDelete?.(from, to)}
          style={{ pointerEvents: 'stroke' }}
        />
      </svg>

      {/* 删除按钮 */}
      {isHovered && (
        <button
          className="absolute z-10 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-all"
          style={{
            left: midX - 10,
            top: midY - 10,
            width: '20px',
            height: '20px'
          }}
          onClick={() => onDelete?.(from, to)}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </>
  )
}

// ✅ 节点编辑对话框 - 支持选择大模型、MCP服务、Agent
function NodeEditDialog({ node, open, onOpenChange, onSave }) {
  const [config, setConfig] = useState(node?.config || {})
  const [label, setLabel] = useState(node?.label || '')
  const [models, setModels] = useState([])
  const [mcpServices, setMcpServices] = useState([])
  const [agents, setAgents] = useState([])

  // 加载大模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/user-data/models', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setModels(response.data?.models || [])
      } catch (error) {
        console.error('Failed to load models:', error)
        setModels([])
      }
    }
    if (open) loadModels()
  }, [open])

  // 加载MCP服务列表
  useEffect(() => {
    const loadMCPServices = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/mcp/user-configs?enabled=true', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMcpServices(response.data?.configs || [])
      } catch (error) {
        console.error('Failed to load MCP services:', error)
      }
    }
    if (open) loadMCPServices()
  }, [open])

  // 加载Agent列表
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/agents', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAgents(response.data?.agents || [])
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
    }
    if (open) loadAgents()
  }, [open])

  const handleSave = () => {
    onSave({
      ...node,
      label,
      config
    })
    onOpenChange(false)
  }

  if (!node) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden flex flex-col"
        style={{
          width: '95vw',
          height: '95vh',
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        <DialogHeader>
          <DialogTitle>编辑节点: {NODE_TYPES[node.type]?.label || node.type}</DialogTitle>
          <DialogDescription>
            配置节点参数和行为
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4 pr-4">
          <div>
            <Label>节点名称</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入节点名称"
            />
          </div>

          {node.type === 'ai_analysis' && (
            <>
              <div>
                <Label>选择大模型</Label>
                <Select
                  value={config.modelId || ''}
                  onValueChange={(value) => {
                    const selectedModel = models.find(m => m.id === value)
                    setConfig({
                      ...config,
                      modelId: value,
                      provider: selectedModel?.provider,
                      model: selectedModel?.model
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        暂无可用模型，请先在设置中配置模型
                      </div>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.displayName || `${model.provider} - ${model.model}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  从您已配置的 AI 模型中选择
                </p>
              </div>
              <div>
                <Label>提示词</Label>
                <Textarea
                  value={config.prompt || ''}
                  onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                  placeholder="输入 AI 提示词"
                  rows={4}
                />
              </div>
              <div>
                <Label>温度 (Temperature)</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature || 0.7}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}

          {node.type === 'agent' && (
            <>
              <div>
                <Label>选择 Agent</Label>
                <Select
                  value={config.agentId || ''}
                  onValueChange={(value) => setConfig({ ...config, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个 Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span>{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  从您创建的 Agent 中选择
                </p>
              </div>
              <div>
                <Label>任务描述</Label>
                <Textarea
                  value={config.taskDescription || ''}
                  onChange={(e) => setConfig({ ...config, taskDescription: e.target.value })}
                  placeholder="描述任务内容"
                  rows={3}
                />
              </div>
              <div>
                <Label>超时时间 (毫秒)</Label>
                <Input
                  type="number"
                  value={config.timeout || 300000}
                  onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                  placeholder="300000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  默认 5 分钟 (300000ms)
                </p>
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <div>
              <Label>条件表达式</Label>
              <Input
                value={config.condition || ''}
                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                placeholder="例如: data.value > 100"
              />
            </div>
          )}

          {node.type === 'mcp_tool' && (
            <>
              <div>
                <Label>选择 MCP 服务</Label>
                <Select
                  value={config.mcpServiceId || ''}
                  onValueChange={(value) => setConfig({ ...config, mcpServiceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个 MCP 服务" />
                  </SelectTrigger>
                  <SelectContent>
                    {mcpServices.map((service) => (
                      <SelectItem key={service.id} value={service.mcp_id}>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span>{service.name}</span>
                          {service.enabled && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              已启用
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  从您已启用的 MCP 服务中选择
                </p>
              </div>
              <div>
                <Label>工具名称</Label>
                <Input
                  value={config.toolName || ''}
                  onChange={(e) => setConfig({ ...config, toolName: e.target.value })}
                  placeholder="例如: search, read_file"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  要调用的 MCP 工具名称
                </p>
              </div>
              <div>
                <Label>参数 (JSON)</Label>
                <Textarea
                  value={config.parameters || '{}'}
                  onChange={(e) => setConfig({ ...config, parameters: e.target.value })}
                  placeholder='{"query": "搜索关键词"}'
                  rows={3}
                />
              </div>
            </>
          )}

          {node.type === 'api_call' && (
            <>
              <div>
                <Label>API URL</Label>
                <Input
                  value={config.url || ''}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <Label>HTTP 方法</Label>
                <Select
                  value={config.method || 'GET'}
                  onValueChange={(value) => setConfig({ ...config, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 主编辑器组件
export function WorkflowVisualEditor({ workflow, onSave }) {
  const [nodes, setNodes] = useState(workflow?.definition?.nodes || [])
  const [connections, setConnections] = useState(workflow?.definition?.connections || [])
  const [selectedNode, setSelectedNode] = useState(null)
  const [editingNode, setEditingNode] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [nextNodePosition, setNextNodePosition] = useState({ x: 50, y: 50 })
  const [connectMode, setConnectMode] = useState(false)
  const [sourceNode, setSourceNode] = useState(null)

  const handleAddNode = useCallback((type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      label: NODE_TYPES[type]?.label || type,
      config: {},
      position: { ...nextNodePosition }
    }

    setNodes(prev => [...prev, newNode])
    setNextNodePosition(prev => ({
      x: prev.x + 30,
      y: prev.y + 120
    }))
  }, [nextNodePosition])

  // ✅ 处理节点拖拽结束
  const handleNodeDragEnd = useCallback((nodeId, newPosition) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, position: newPosition }
        : node
    ))
  }, [])

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId))
    setSelectedNode(null)
  }, [])

  const handleEditNode = useCallback((node) => {
    setEditingNode(node)
    setEditDialogOpen(true)
  }, [])

  const handleSaveNode = useCallback((updatedNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n))
  }, [])

  // 处理节点点击 - 连接模式
  const handleNodeClick = useCallback((node) => {
    if (connectMode) {
      if (!sourceNode) {
        // 选择源节点
        setSourceNode(node)
        setSelectedNode(node)
      } else if (sourceNode.id !== node.id) {
        // 选择目标节点，创建连接
        const newConnection = {
          sourceNodeId: sourceNode.id,
          targetNodeId: node.id
        }
        // 检查是否已存在相同连接
        const exists = connections.some(
          c => c.sourceNodeId === sourceNode.id && c.targetNodeId === node.id
        )
        if (!exists) {
          setConnections(prev => [...prev, newConnection])
        }
        // 重置选择
        setSourceNode(null)
        setSelectedNode(null)
        setConnectMode(false)
      }
    } else {
      setSelectedNode(node)
    }
  }, [connectMode, sourceNode, connections])

  // 删除连接
  const handleDeleteConnection = useCallback((sourceId, targetId) => {
    setConnections(prev => prev.filter(
      c => !(c.sourceNodeId === sourceId && c.targetNodeId === targetId)
    ))
  }, [])

  const handleSaveWorkflow = useCallback(() => {
    const workflowData = {
      ...workflow,
      definition: {
        nodes,
        connections
      }
    }
    onSave(workflowData)
  }, [workflow, nodes, connections, onSave])

  return (
    <div className="flex h-full">
      {/* 工具栏 */}
      <div className="w-64 border-r p-4 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">工作流编辑</h3>
            <Button size="sm" variant="outline" onClick={handleSaveWorkflow}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>

          {/* 连接模式按钮 */}
          <Button
            variant={connectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setConnectMode(!connectMode)
              setSourceNode(null)
              setSelectedNode(null)
            }}
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {connectMode ? '连接模式 (点击取消)' : '连接节点'}
          </Button>

          {connectMode && sourceNode && (
            <div className="p-2 bg-primary/10 rounded text-xs">
              <div className="font-medium">源节点: {sourceNode.label}</div>
              <div className="text-muted-foreground">点击目标节点创建连接</div>
            </div>
          )}

          {connectMode && !sourceNode && (
            <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
              点击选择源节点
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <h4 className="font-semibold mb-2 text-sm">节点类型</h4>
        </div>

        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-2">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={type}
                  className={cn(
                    'w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-sm',
                    config.color
                  )}
                  onClick={() => handleAddNode(type)}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">{config.label}</div>
                    <div className="text-xs opacity-70">{config.description}</div>
                  </div>
                  <Plus className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 画布 */}
      <div className="flex-1 relative bg-grid p-4 overflow-auto">
        <div className="relative" style={{ minHeight: '800px', minWidth: '1200px' }}>
          {/* 连接线 */}
          {connections.map((conn, index) => (
            <Connection
              key={index}
              from={conn.sourceNodeId}
              to={conn.targetNodeId}
              nodes={nodes}
              onDelete={handleDeleteConnection}
            />
          ))}

          {/* 节点 */}
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              isSource={sourceNode?.id === node.id}
              onClick={handleNodeClick}
              onDelete={handleDeleteNode}
              onEdit={handleEditNode}
              onDragEnd={handleNodeDragEnd}
            />
          ))}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground max-w-md">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">从左侧添加节点开始构建工作流</p>
                <div className="text-sm space-y-1 text-left bg-muted/50 rounded-lg p-4 mt-4">
                  <p>📝 <strong>使用步骤：</strong></p>
                  <p>1. 点击左侧节点类型添加节点</p>
                  <p>2. 点击"连接节点"按钮创建连接</p>
                  <p>3. 双击节点配置参数</p>
                  <p>4. 保存工作流后在列表中执行</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 节点编辑对话框 */}
      <NodeEditDialog
        node={editingNode}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveNode}
      />
    </div>
  )
}
