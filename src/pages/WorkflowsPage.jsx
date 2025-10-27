import { useState, useEffect, useCallback, useRef } from 'react'
import { WorkflowList } from '@/components/workflows/WorkflowList'
import { WorkflowEditorDialog } from '@/components/workflows/WorkflowEditorDialog'
import { toast } from 'sonner'
import axios from 'axios'
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
import { AlertCircle, Info, Download, Upload } from 'lucide-react'

/**
 * WorkflowsPage - 工作流管理主页面
 *
 * 功能:
 * - 工作流列表展示
 * - 创建/编辑工作流
 * - 执行工作流
 * - 导入/导出工作流
 * - 复制和删除工作流
 */
export default function WorkflowsPage() {
  const { token } = useAuth()
  const { translate } = useTranslation()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState(null)

  // ✅ 编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState(null)

  // ✅ 文件上传引用
  const fileInputRef = useRef(null)

  // Fetch workflows from backend
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/workflows', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setWorkflows(response.data.workflows || [])
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
      toast.error(translate('workflows.toasts.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [token, translate])

  useEffect(() => {
    if (token) {
      fetchWorkflows()
    }
  }, [token, fetchWorkflows])

  // ✅ Create new workflow
  const handleCreateWorkflow = () => {
    setEditingWorkflow(null)
    setEditorOpen(true)
  }

  // Execute workflow
  const handleExecute = async (workflow) => {
    try {
      toast.loading(translate('workflows.toasts.executing'), { id: 'workflow-execute' })

      await axios.post(
        `/api/workflows/${workflow.id}/run`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success(translate('workflows.toasts.executionStarted'), { id: 'workflow-execute' })
      fetchWorkflows() // Refresh to get updated status
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      toast.error(
        error.response?.data?.message || translate('workflows.toasts.executeFailed'),
        { id: 'workflow-execute' }
      )
    }
  }

  // ✅ Edit workflow
  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow)
    setEditorOpen(true)
  }

  // ✅ Save workflow (创建或更新)
  const handleSaveWorkflow = async (workflowData) => {
    try {
      const isNew = !workflowData.id

      if (isNew) {
        // 创建新工作流
        const response = await axios.post('/api/workflows', workflowData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('工作流创建成功!')
      } else {
        // 更新现有工作流
        await axios.put(`/api/workflows/${workflowData.id}`, workflowData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('工作流更新成功!')
      }

      fetchWorkflows()
    } catch (error) {
      console.error('Failed to save workflow:', error)
      throw error
    }
  }

  // Delete workflow
  const handleDelete = (workflow) => {
    setWorkflowToDelete(workflow)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!workflowToDelete) return

    try {
      await axios.delete(`/api/workflows/${workflowToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(translate('workflows.toasts.deleteSuccess'))
      setDeleteDialogOpen(false)
      setWorkflowToDelete(null)
      fetchWorkflows()
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast.error(translate('workflows.toasts.deleteFailed'))
    }
  }

  // Duplicate workflow
  const handleDuplicate = async (workflow) => {
    try {
      toast.loading(translate('workflows.toasts.duplicating'), { id: 'workflow-duplicate' })

      const response = await axios.post(
        `/api/workflows/${workflow.id}/copy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success(translate('workflows.toasts.duplicateSuccess'), { id: 'workflow-duplicate' })
      fetchWorkflows()
    } catch (error) {
      console.error('Failed to duplicate workflow:', error)
      toast.error(
        error.response?.data?.message || translate('workflows.toasts.duplicateFailed'),
        { id: 'workflow-duplicate' }
      )
    }
  }

  // View workflow details
  const handleViewDetails = (workflow) => {
    // TODO: 实现详情视图
    const message = translate('workflows.toasts.workflowDetails')
      .replace('{name}', workflow.name)
      .replace('{nodes}', workflow.nodeCount || 0)
      .replace('{status}', workflow.status || 'draft')

    toast.info(message, {
      duration: 4000
    })
  }

  // ✅ Import workflow
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedData = JSON.parse(text)

      // 验证导入的数据
      if (!importedData.name || !importedData.definition) {
        toast.error('无效的工作流文件格式')
        return
      }

      // 创建导入的工作流（去掉 id 以创建新的）
      const { id, ...workflowData } = importedData
      workflowData.name = `${workflowData.name} (导入)`

      const response = await axios.post('/api/workflows', workflowData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('工作流导入成功!')
      fetchWorkflows()
    } catch (error) {
      console.error('Failed to import workflow:', error)
      toast.error('导入失败: ' + (error.message || '文件格式错误'))
    } finally {
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // ✅ Export workflow
  const handleExport = () => {
    if (workflows.length === 0) {
      toast.warning('没有可导出的工作流')
      return
    }

    try {
      // 导出所有工作流为 JSON 文件
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        workflows: workflows
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workflows-export-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`已导出 ${workflows.length} 个工作流`)
    } catch (error) {
      console.error('Failed to export workflows:', error)
      toast.error('导出失败: ' + error.message)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* ✅ 页面头部说明 - 使用指南 */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              如何使用工作流
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li><strong>创建工作流</strong> - 点击"创建新工作流"按钮，填写基本信息</li>
              <li><strong>添加节点</strong> - 在可视化编辑器中，从左侧添加节点（开始、AI分析、Agent等）</li>
              <li><strong>连接节点</strong> - 点击"连接节点"按钮，依次点击源节点和目标节点创建连接线</li>
              <li><strong>配置节点</strong> - 双击节点或点击配置按钮，设置AI模型、提示词等参数</li>
              <li><strong>保存并执行</strong> - 保存工作流后，在列表中点击"Run"按钮执行</li>
            </ol>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 提示：确保在设置页面中已配置好AI模型、MCP服务和Agent，才能在工作流中使用它们。
            </p>
          </div>
        </div>
      </div>

      {/* 工作流列表 */}
      <WorkflowList
        workflows={workflows}
        loading={loading}
        onCreateWorkflow={handleCreateWorkflow}
        onExecute={handleExecute}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onViewDetails={handleViewDetails}
        onImport={handleImport}
        onExport={handleExport}
        translate={translate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              {translate('workflows.dialog.deleteTitle')}
            </DialogTitle>
            <DialogDescription>
              {translate('workflows.dialog.deleteMessage').replace('{name}', workflowToDelete?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {translate('workflows.dialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {translate('workflows.dialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Workflow Editor Dialog */}
      <WorkflowEditorDialog
        workflow={editingWorkflow}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveWorkflow}
      />

      {/* ✅ Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
