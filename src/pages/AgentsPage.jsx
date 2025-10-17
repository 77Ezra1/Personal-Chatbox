import { useState, useEffect, useCallback } from 'react'
import { AgentList } from '@/components/agents/AgentList'
import { AgentEditor } from '@/components/agents/AgentEditor'
import { AgentTaskExecutor } from '@/components/agents/AgentTaskExecutor'
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
import { AlertCircle } from 'lucide-react'

export default function AgentsPage() {
  const { token } = useAuth()
  const { translate } = useTranslation()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [executorOpen, setExecutorOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState(null)

  // Fetch agents from backend
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/agents', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error(translate('agents.toasts.loadFailed', 'Failed to load agents'))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchAgents()
    }
  }, [token, fetchAgents])

  // Create new agent
  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setEditorOpen(true)
  }

  // Edit existing agent
  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setEditorOpen(true)
  }

  // Save agent (create or update)
  const handleSaveAgent = async (agentData) => {
    try {
      if (selectedAgent) {
        // Update existing agent
        await axios.put(
          `/api/agents/${selectedAgent.id}`,
          agentData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        toast.success(translate('agents.toasts.updateSuccess', 'Agent updated successfully'))
      } else {
        // Create new agent
        await axios.post(
          '/api/agents',
          agentData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        toast.success(translate('agents.toasts.createSuccess', 'Agent created successfully'))
      }
      setEditorOpen(false)
      fetchAgents()
    } catch (error) {
      console.error('Failed to save agent:', error)
      toast.error(error.response?.data?.message || translate('agents.toasts.saveFailed', 'Failed to save agent'))
    }
  }

  // Delete agent
  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return

    try {
      await axios.delete(`/api/agents/${agentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(translate('agents.toasts.deleteSuccess', 'Agent deleted successfully'))
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
      fetchAgents()
    } catch (error) {
      console.error('Failed to delete agent:', error)
      toast.error(translate('agents.toasts.deleteFailed', 'Failed to delete agent'))
    }
  }

  // Execute agent task
  const handleExecuteAgent = (agent) => {
    setSelectedAgent(agent)
    setExecutorOpen(true)
  }

  const handleExecuteTask = async (agentId, taskData) => {
    try {
      const response = await axios.post(
        `/api/agents/${agentId}/execute`,
        { taskData },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success(translate('agents.toasts.executeSuccess', 'Task execution started'))
      return response.data
    } catch (error) {
      console.error('Failed to execute task:', error)
      toast.error(translate('agents.toasts.executeFailed', 'Failed to execute task'))
      throw error
    }
  }

  const handleStopTask = async (agentId) => {
    try {
      await axios.post(
        `/api/agents/${agentId}/stop`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.info('Task execution stopped')
    } catch (error) {
      console.error('Failed to stop task:', error)
      toast.error('Failed to stop task')
    }
  }

  // View agent details
  const handleViewDetails = (agent) => {
    // TODO: Implement details view
    toast.info('Details view coming soon')
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AgentList
        agents={agents}
        loading={loading}
        onCreateAgent={handleCreateAgent}
        onExecute={handleExecuteAgent}
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
        onViewDetails={handleViewDetails}
        translate={translate}
      />

      {/* Agent Editor Dialog */}
      <AgentEditor
        agent={selectedAgent}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveAgent}
      />

      {/* Task Executor Dialog */}
      {selectedAgent && (
        <AgentTaskExecutor
          agent={selectedAgent}
          open={executorOpen}
          onOpenChange={setExecutorOpen}
          onExecute={handleExecuteTask}
          onStop={handleStopTask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              {translate('agents.deleteConfirm.title', 'Delete Agent')}
            </DialogTitle>
            <DialogDescription>
              {translate('agents.deleteConfirm.description', 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', agentToDelete?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {translate('confirms.cancelButton', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {translate('agents.actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
