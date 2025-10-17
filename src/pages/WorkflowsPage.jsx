import { useState, useEffect, useCallback } from 'react'
import { WorkflowList } from '@/components/workflows/WorkflowList'
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
import { AlertCircle, Info } from 'lucide-react'

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

  // Create new workflow
  const handleCreateWorkflow = () => {
    // TODO: 在Phase 2.2中实现WorkflowEditor后，这里将打开编辑器
    toast.info(translate('workflows.toasts.editorComingSoon'), {
      duration: 5000
    })
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

  // Edit workflow
  const handleEdit = (workflow) => {
    // TODO: 在Phase 2.2中实现WorkflowEditor后，这里将打开编辑器
    toast.info(translate('workflows.toasts.editWorkflow').replace('{name}', workflow.name), {
      duration: 4000
    })
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

  // Import workflow
  const handleImport = () => {
    // TODO: 实现导入功能
    toast.info(translate('workflows.toasts.importComingSoon'), {
      duration: 4000
    })
  }

  // Export workflow
  const handleExport = () => {
    // TODO: 实现导出功能
    if (workflows.length === 0) {
      toast.warning(translate('workflows.toasts.noWorkflowsToExport'))
      return
    }

    toast.info(translate('workflows.toasts.exportComingSoon'), {
      duration: 4000
    })
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* 页面头部说明 */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {translate('workflows.phaseInfo.title')}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {translate('workflows.phaseInfo.ready')}
              <br />
              {translate('workflows.phaseInfo.coming')}
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
    </div>
  )
}
