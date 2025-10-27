import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowVisualEditor } from './WorkflowVisualEditor'
import { Save, X, Code, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * 工作流编辑器对话框
 * 提供基本信息编辑和可视化流程编辑
 */
export function WorkflowEditorDialog({
  workflow,
  open,
  onOpenChange,
  onSave
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    definition: {
      nodes: [],
      connections: []
    }
  })
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)

  // 初始化或更新表单数据
  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name || '',
        description: workflow.description || '',
        tags: workflow.tags?.join(', ') || '',
        definition: workflow.definition || {
          nodes: [],
          connections: []
        }
      })
    } else {
      // 新建工作流的默认结构
      setFormData({
        name: '',
        description: '',
        tags: '',
        definition: {
          nodes: [
            {
              id: 'start_node',
              type: 'start',
              label: '开始',
              config: {},
              position: { x: 100, y: 100 }
            }
          ],
          connections: []
        }
      })
    }
  }, [workflow, open])

  const handleBasicInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDefinitionChange = (newDefinition) => {
    setFormData(prev => ({
      ...prev,
      definition: newDefinition.definition
    }))
  }

  const handleSave = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      alert('请输入工作流名称')
      return
    }

    if (formData.definition.nodes.length === 0) {
      alert('工作流至少需要一个节点')
      return
    }

    setSaving(true)
    try {
      const workflowData = {
        ...workflow,
        name: formData.name,
        description: formData.description,
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [],
        definition: formData.definition,
        nodeCount: formData.definition.nodes.length
      }

      await onSave(workflowData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save workflow:', error)
      alert('保存失败: ' + (error.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  const isNewWorkflow = !workflow?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col p-0"
        style={{
          width: '95vw',
          height: '95vh',
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {isNewWorkflow ? '创建新工作流' : '编辑工作流'}
          </DialogTitle>
          <DialogDescription>
            {isNewWorkflow
              ? '设置工作流的基本信息，并使用可视化编辑器构建流程'
              : '修改工作流的配置和流程定义'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mb-4">
              <TabsTrigger value="basic" className="gap-2">
                <Code className="h-4 w-4" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="visual" className="gap-2">
                <Workflow className="h-4 w-4" />
                可视化编辑
                <Badge variant="secondary" className="ml-1">
                  {formData.definition.nodes.length} 节点
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="flex-1 overflow-auto px-6 m-0">
              <div className="space-y-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    工作流名称 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    placeholder="输入工作流名称"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                    placeholder="描述这个工作流的用途和功能"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleBasicInfoChange('tags', e.target.value)}
                    placeholder="使用逗号分隔多个标签，例如: 自动化, 数据处理, AI"
                  />
                  <p className="text-xs text-muted-foreground">
                    标签可以帮助您组织和搜索工作流
                  </p>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">工作流统计</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">节点数量:</span>
                      <span className="ml-2 font-medium">{formData.definition.nodes.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">连接数量:</span>
                      <span className="ml-2 font-medium">{formData.definition.connections.length}</span>
                    </div>
                  </div>
                </div>

                {!isNewWorkflow && workflow && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">执行统计</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">总运行次数:</span>
                        <span className="ml-2 font-medium">{workflow.totalRuns || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">成功率:</span>
                        <span className="ml-2 font-medium">{workflow.successRate || 0}%</span>
                      </div>
                      {workflow.lastRun && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">最后运行:</span>
                          <span className="ml-2 font-medium">
                            {new Date(workflow.lastRun).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="visual" className="flex-1 m-0 overflow-hidden">
              <WorkflowVisualEditor
                workflow={formData}
                onSave={handleDefinitionChange}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : (isNewWorkflow ? '创建工作流' : '保存修改')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
