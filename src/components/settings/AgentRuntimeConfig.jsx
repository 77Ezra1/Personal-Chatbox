import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { agentAPI } from '@/lib/apiClient'
import { Loader2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

const DEFAULT_CONFIG = {
  decomposer: {
    model: '',
    temperature: 0.3,
    maxTokens: 1600,
    maxSubtasks: 8,
    contextLimit: 4000
  },
  toolRefresh: {
    auto: false,
    intervalMs: 600000
  },
  queue: {
    defaultPriority: 0
  }
}

export function AgentRuntimeConfig() {
  const { translate } = useTranslation()
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const response = await agentAPI.getRuntimeConfig()
      const runtime = response.data?.config
      if (runtime) {
        setConfig(prev => ({
          ...prev,
          ...runtime,
          decomposer: { ...prev.decomposer, ...(runtime.decomposer || {}) },
          toolRefresh: { ...prev.toolRefresh, ...(runtime.toolRefresh || {}) },
          queue: { ...prev.queue, ...(runtime.queue || {}) }
        }))
      } else {
        setConfig(DEFAULT_CONFIG)
      }
    } catch (error) {
      console.error('Failed to load runtime config:', error)
      toast.error(translate('agents.settings.runtime.loadFailed', 'Failed to load runtime configuration'))
    } finally {
      setLoading(false)
    }
  }, [translate])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleDecomposerChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      decomposer: {
        ...prev.decomposer,
        [key]: value
      }
    }))
  }

  const handleToolRefreshChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      toolRefresh: {
        ...prev.toolRefresh,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await agentAPI.updateRuntimeConfig(config)
      toast.success(translate('agents.settings.runtime.saveSuccess', 'Runtime configuration updated'))
      loadConfig()
    } catch (error) {
      console.error('Failed to update runtime config:', error)
      toast.error(error.response?.data?.message || translate('agents.settings.runtime.saveFailed', 'Failed to update configuration'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadConfig()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate('agents.settings.runtime.title', 'Agent runtime configuration')}</CardTitle>
        <CardDescription>
          {translate('agents.settings.runtime.description', 'Adjust task decomposer defaults and automatic tool refresh behaviour without redeploying the service.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {translate('agents.settings.runtime.decomposerTitle', 'Task decomposer')}
            </h3>
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="decomposer-model">{translate('agents.settings.runtime.model', 'Model')}</Label>
              <Input
                id="decomposer-model"
                value={config.decomposer.model}
                placeholder="gpt-4o-mini"
                disabled={loading || saving}
                onChange={(event) => handleDecomposerChange('model', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decomposer-temperature">{translate('agents.settings.runtime.temperature', 'Temperature')}</Label>
              <Input
                id="decomposer-temperature"
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={config.decomposer.temperature}
                disabled={loading || saving}
                onChange={(event) => handleDecomposerChange('temperature', parseFloat(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decomposer-maxTokens">{translate('agents.settings.runtime.maxTokens', 'Max tokens')}</Label>
              <Input
                id="decomposer-maxTokens"
                type="number"
                min="256"
                value={config.decomposer.maxTokens}
                disabled={loading || saving}
                onChange={(event) => handleDecomposerChange('maxTokens', parseInt(event.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decomposer-maxSubtasks">{translate('agents.settings.runtime.maxSubtasks', 'Max subtasks')}</Label>
              <Input
                id="decomposer-maxSubtasks"
                type="number"
                min="1"
                value={config.decomposer.maxSubtasks}
                disabled={loading || saving}
                onChange={(event) => handleDecomposerChange('maxSubtasks', parseInt(event.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decomposer-contextLimit">{translate('agents.settings.runtime.contextLimit', 'Context limit')}</Label>
              <Input
                id="decomposer-contextLimit"
                type="number"
                min="500"
                value={config.decomposer.contextLimit}
                disabled={loading || saving}
                onChange={(event) => handleDecomposerChange('contextLimit', parseInt(event.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {translate('agents.settings.runtime.toolRefreshTitle', 'Tool refresh policy')}
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="text-sm font-medium">
                  {translate('agents.settings.runtime.autoRefresh', 'Auto refresh tools')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {translate('agents.settings.runtime.autoRefreshHint', 'Automatically reload dynamic tools after the configured interval before queuing new work.')}
                </p>
              </div>
              <Switch
                checked={config.toolRefresh.auto}
                disabled={loading || saving}
                onCheckedChange={(value) => handleToolRefreshChange('auto', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toolRefresh-interval">{translate('agents.settings.runtime.refreshInterval', 'Refresh interval (ms)')}</Label>
              <Input
                id="toolRefresh-interval"
                type="number"
                min="1000"
                step="5000"
                value={config.toolRefresh.intervalMs}
                disabled={loading || saving}
                onChange={(event) => handleToolRefreshChange('intervalMs', parseInt(event.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {translate('common.save', 'Save')}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={loading || saving}>
          <RefreshCcw className="mr-2 size-4" />
          {translate('common.reset', 'Reset')}
        </Button>
      </CardFooter>
    </Card>
  )
}
