import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

// Agent schema
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['conversational', 'task-based', 'analytical', 'creative']),
  capabilities: z.array(z.string()).min(1, 'At least one capability required'),
  config: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(100).max(100000).optional(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
    autoRetry: z.boolean().optional(),
    maxRetries: z.number().min(0).max(5).optional(),
  }).optional(),
})

// Capability keys for translation
const CAPABILITY_KEYS = [
  'textGeneration',
  'codeAnalysis',
  'dataProcessing',
  'webSearch',
  'fileOperations',
  'apiIntegration',
  'taskAutomation',
  'knowledgeRetrieval',
  'imageAnalysis',
  'documentParsing'
]

// Tool keys for translation
const TOOL_KEYS = [
  { key: 'webSearch', value: 'web_search' },
  { key: 'fileReader', value: 'file_reader' },
  { key: 'codeExecutor', value: 'code_executor' },
  { key: 'apiCaller', value: 'api_caller' },
  { key: 'dataAnalyzer', value: 'data_analyzer' },
  { key: 'imageProcessor', value: 'image_processor' }
]

export function AgentEditor({
  agent = null,
  open,
  onOpenChange,
  onSave,
  loading = false
}) {
  const { translate } = useTranslation()
  const [customCapability, setCustomCapability] = useState('')
  const isEditing = !!agent

  const form = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      description: agent?.description || '',
      type: agent?.type || 'conversational',
      capabilities: agent?.capabilities || [],
      config: {
        model: agent?.config?.model || 'gpt-4',
        temperature: agent?.config?.temperature || 0.7,
        maxTokens: agent?.config?.maxTokens || 4000,
        systemPrompt: agent?.config?.systemPrompt || '',
        tools: agent?.config?.tools || [],
        autoRetry: agent?.config?.autoRetry || false,
        maxRetries: agent?.config?.maxRetries || 3,
      }
    }
  })

  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name || '',
        description: agent.description || '',
        type: agent.type || 'conversational',
        capabilities: agent.capabilities || [],
        config: {
          model: agent.config?.model || 'gpt-4',
          temperature: agent.config?.temperature || 0.7,
          maxTokens: agent.config?.maxTokens || 4000,
          systemPrompt: agent.config?.systemPrompt || '',
          tools: agent.config?.tools || [],
          autoRetry: agent.config?.autoRetry || false,
          maxRetries: agent.config?.maxRetries || 3,
        }
      })
    }
  }, [agent, form])

  const onSubmit = (data) => {
    // 转换为后端期望的格式
    const agentData = {
      name: data.name,
      description: data.description || '',
      systemPrompt: data.config?.systemPrompt || '',
      capabilities: data.capabilities || [],
      tools: data.config?.tools || [],
      config: {
        maxConcurrentTasks: 3,
        stopOnError: false,
        retryAttempts: data.config?.autoRetry ? (data.config?.maxRetries || 3) : 0,
        model: data.config?.model || 'gpt-4o-mini',
        temperature: data.config?.temperature || 0.7,
        maxTokens: data.config?.maxTokens || 4000,
      }
    }
    onSave?.(agentData)
  }

  const addCapability = (capability) => {
    const current = form.getValues('capabilities')
    if (!current.includes(capability)) {
      form.setValue('capabilities', [...current, capability])
    }
  }

  const removeCapability = (capability) => {
    const current = form.getValues('capabilities')
    form.setValue('capabilities', current.filter(c => c !== capability))
  }

  const addCustomCapability = () => {
    if (customCapability.trim()) {
      addCapability(customCapability.trim())
      setCustomCapability('')
    }
  }

  const toggleTool = (tool) => {
    const current = form.getValues('config.tools') || []
    if (current.includes(tool)) {
      form.setValue('config.tools', current.filter(t => t !== tool))
    } else {
      form.setValue('config.tools', [...current, tool])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {isEditing
              ? translate('agents.editor.editTitle', 'Edit Agent')
              : translate('agents.editor.createTitle', 'Create New Agent')
            }
          </DialogTitle>
          <DialogDescription>
            {translate('agents.editor.subtitle', "Configure your AI agent's capabilities and behavior")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[calc(90vh-200px)] pr-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">
                    {translate('agents.editor.tabs.basic', 'Basic Info')}
                  </TabsTrigger>
                  <TabsTrigger value="capabilities">
                    {translate('agents.editor.tabs.capabilities', 'Capabilities')}
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    {translate('agents.editor.tabs.advanced', 'Advanced')}
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.name', 'Name')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={translate('agents.editor.fields.namePlaceholder', 'My AI Agent')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.description', 'Description')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={translate('agents.editor.fields.descriptionPlaceholder', 'Describe what your agent does...')}
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {translate('agents.editor.fields.descriptionHint', "A clear description helps you remember the agent's purpose")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.agentType', 'Agent Type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={translate('agents.editor.fields.agentTypePlaceholder', 'Select agent type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="conversational">
                              {translate('agents.editor.types.conversational', 'Conversational')}
                            </SelectItem>
                            <SelectItem value="task-based">
                              {translate('agents.editor.types.taskBased', 'Task-Based')}
                            </SelectItem>
                            <SelectItem value="analytical">
                              {translate('agents.editor.types.analytical', 'Analytical')}
                            </SelectItem>
                            <SelectItem value="creative">
                              {translate('agents.editor.types.creative', 'Creative')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Capabilities Tab */}
                <TabsContent value="capabilities" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="capabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {translate('agents.editor.fields.selectedCapabilities', 'Selected Capabilities')} *
                        </FormLabel>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                          {field.value.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {translate('agents.editor.fields.noCapabilitiesSelected', 'No capabilities selected')}
                            </span>
                          ) : (
                            field.value.map(cap => (
                              <Badge key={cap} variant="secondary" className="gap-1">
                                {cap}
                                <button
                                  type="button"
                                  onClick={() => removeCapability(cap)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>
                      {translate('agents.editor.fields.availableCapabilities', 'Available Capabilities')}
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                      {CAPABILITY_KEYS.map(capKey => {
                        const capLabel = translate(`agents.editor.capabilities.${capKey}`, capKey)
                        const isSelected = form.watch('capabilities').includes(capLabel)
                        return (
                          <Button
                            key={capKey}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => isSelected ? removeCapability(capLabel) : addCapability(capLabel)}
                            className="gap-1"
                          >
                            {isSelected && <Plus className="size-3 rotate-45" />}
                            {capLabel}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>
                      {translate('agents.editor.fields.customCapability', 'Custom Capability')}
                    </FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder={translate('agents.editor.fields.customCapabilityPlaceholder', 'Enter custom capability...')}
                        value={customCapability}
                        onChange={(e) => setCustomCapability(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomCapability()
                          }
                        }}
                      />
                      <Button type="button" onClick={addCustomCapability} size="icon">
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>{translate('agents.editor.fields.tools', 'Tools')}</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {TOOL_KEYS.map(({ key, value }) => {
                        const isSelected = (form.watch('config.tools') || []).includes(value)
                        return (
                          <Button
                            key={value}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleTool(value)}
                            className="justify-start gap-2"
                          >
                            <div className={cn(
                              "size-4 rounded-full border-2",
                              isSelected ? "bg-primary-foreground" : "bg-transparent"
                            )} />
                            {translate(`agents.editor.tools.${key}`, value.replace(/_/g, ' '))}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="config.model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.model', 'Model')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {translate('agents.editor.fields.temperature', 'Temperature')}: {field.value}
                        </FormLabel>
                        <FormControl>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            className="w-full"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {translate('agents.editor.fields.temperatureHint', 'Controls randomness. Lower is more focused, higher is more creative')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.maxTokens', 'Max Tokens')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {translate('agents.editor.fields.maxTokensHint', 'Maximum number of tokens to generate')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.systemPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('agents.editor.fields.systemPrompt', 'System Prompt')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={translate('agents.editor.fields.systemPromptPlaceholder', 'You are a helpful AI assistant...')}
                            className="resize-none font-mono text-sm"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {translate('agents.editor.fields.systemPromptHint', "Custom instructions for the agent's behavior")}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{translate('agents.editor.fields.autoRetry', 'Auto Retry')}</FormLabel>
                      <FormDescription>
                        {translate('agents.editor.fields.autoRetryHint', 'Automatically retry failed tasks')}
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="config.autoRetry"
                      render={({ field }) => (
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      )}
                    />
                  </div>

                  {form.watch('config.autoRetry') && (
                    <FormField
                      control={form.control}
                      name="config.maxRetries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translate('agents.editor.fields.maxRetries', 'Max Retries')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {translate('agents.editor.buttons.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? translate('agents.editor.buttons.saving', 'Saving...')
                  : isEditing
                    ? translate('agents.editor.buttons.save', 'Save Changes')
                    : translate('agents.editor.buttons.create', 'Create Agent')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
