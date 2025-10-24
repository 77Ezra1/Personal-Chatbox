import { useState, useEffect, useMemo } from 'react'
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
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useMcpTools } from '@/hooks/useMcpTools'

// Agent schema
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['conversational', 'task-based', 'analytical', 'creative']),
  capabilities: z.array(z.string()).min(1, 'At least one capability required'),
  config: z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(100).max(100000).optional(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
    autoRetry: z.boolean().optional(),
    maxRetries: z.number().min(0).max(5).optional(),
  }).optional(),
})

const CAPABILITY_OPTIONS = [
  { value: 'research', labelKey: 'agents.capabilities.research', fallback: 'Research' },
  { value: 'data_processing', labelKey: 'agents.capabilities.dataProcessing', fallback: 'Data Processing' },
  { value: 'writing', labelKey: 'agents.capabilities.writing', fallback: 'Writing' },
  { value: 'analysis', labelKey: 'agents.capabilities.analysis', fallback: 'Analysis' },
  { value: 'automation', labelKey: 'agents.capabilities.automation', fallback: 'Automation' }
]

const LEGACY_CAPABILITY_ALIASES = {
  research: 'research',
  'text generation': 'writing',
  text_generation: 'writing',
  '文本生成': 'writing',
  writing: 'writing',
  'code analysis': 'analysis',
  code_analysis: 'analysis',
  '代码分析': 'analysis',
  analysis: 'analysis',
  'data processing': 'data_processing',
  data_processing: 'data_processing',
  '数据处理': 'data_processing',
  'web search': 'research',
  web_search: 'research',
  '网页搜索': 'research',
  'task automation': 'automation',
  task_automation: 'automation',
  automation: 'automation',
  '自动化': 'automation',
  'knowledge retrieval': 'research',
  knowledge_retrieval: 'research',
  'image analysis': 'analysis',
  image_analysis: 'analysis',
  'document parsing': 'analysis',
  document_parsing: 'analysis'
}

const TOOL_DEFINITIONS = [
  { value: 'web_search', labelKey: 'agents.editor.tools.webSearch', fallback: 'Web Search' },
  { value: 'read_file', labelKey: 'agents.editor.tools.readFile', fallback: 'Read File' },
  { value: 'write_file', labelKey: 'agents.editor.tools.writeFile', fallback: 'Write File' },
  { value: 'validate_data', labelKey: 'agents.editor.tools.validateData', fallback: 'Validate Data' },
  { value: 'data_transform', labelKey: 'agents.editor.tools.dataTransform', fallback: 'Data Transform' }
]

const LEGACY_TOOL_ALIASES = {
  web_search: 'web_search',
  'web search': 'web_search',
  file_reader: 'read_file',
  'file reader': 'read_file',
  '文件读取': 'read_file',
  file_writer: 'write_file',
  'file writer': 'write_file',
  '文件写入': 'write_file',
  code_executor: 'data_transform',
  'code executor': 'data_transform',
  data_analyzer: 'data_transform',
  'data analyzer': 'data_transform',
  image_processor: 'data_transform',
  api_caller: 'web_search'
}

const toTitleCase = (value = '') =>
  value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const normalizeCapabilityValue = (value) => {
  if (!value) return ''
  const trimmed = value.toString().trim()
  const lower = trimmed.toLowerCase()
  if (LEGACY_CAPABILITY_ALIASES[lower]) return LEGACY_CAPABILITY_ALIASES[lower]
  const underscored = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (LEGACY_CAPABILITY_ALIASES[underscored]) return LEGACY_CAPABILITY_ALIASES[underscored]
  return underscored || trimmed
}

const normalizeToolValue = (value) => {
  if (!value) return ''
  const trimmed = value.toString().trim()
  const lower = trimmed.toLowerCase()
  if (LEGACY_TOOL_ALIASES[lower]) return LEGACY_TOOL_ALIASES[lower]
  const underscored = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (LEGACY_TOOL_ALIASES[underscored]) return LEGACY_TOOL_ALIASES[underscored]
  return underscored || trimmed
}

const normalizeCapabilityList = (capabilities = []) => {
  const normalized = capabilities
    .map(cap => normalizeCapabilityValue(cap))
    .filter(Boolean)
  return Array.from(new Set(normalized))
}

const normalizeToolList = (tools = []) => {
  const normalized = tools
    .map(tool => normalizeToolValue(tool))
    .filter(Boolean)
  return Array.from(new Set(normalized))
}

const getCapabilityLabel = (translateFn, value) => {
  const option = CAPABILITY_OPTIONS.find(item => item.value === value)
  if (option) {
    return translateFn(option.labelKey, option.fallback)
  }
  return toTitleCase(value)
}

const getToolLabel = (translateFn, value) => {
  const option = TOOL_DEFINITIONS.find(item => item.value === value)
  if (option) {
    return translateFn(option.labelKey, option.fallback)
  }
  return toTitleCase(value)
}

export function AgentEditor({
  agent = null,
  open,
  onOpenChange,
  onSave,
  loading = false
}) {
  const { translate } = useTranslation()
  const {
    modelConfig: globalModelConfig,
    currentProvider: currentProviderFromSettings,
    getProviderModels,
    loading: modelConfigLoading
  } = useModelConfigDB()
  const { flatTools, toolsByCategory, toolsByService, loading: mcpToolsLoading } = useMcpTools()
  const [customCapability, setCustomCapability] = useState('')
  const [showMcpTools, setShowMcpTools] = useState(true)
  const isEditing = !!agent
  const resolvedProvider = agent?.config?.provider || currentProviderFromSettings || 'openai'
  const defaultSystemPrompt = useMemo(() => (
    agent?.config?.systemPrompt
      || translate('agents.editor.defaults.systemPrompt', 'You are a helpful AI assistant. Please follow user instructions carefully and ask questions when clarification is needed.')
  ), [agent?.config?.systemPrompt, translate])

  const providerModels = useMemo(() => {
    if (typeof getProviderModels !== 'function') return []
    try {
      const list = getProviderModels(resolvedProvider)
      return Array.isArray(list) ? list.filter(Boolean) : []
    } catch (error) {
      console.error('[AgentEditor] Failed to load provider models:', error)
      return []
    }
  }, [getProviderModels, resolvedProvider])

  const availableModels = useMemo(() => {
    const baseModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'claude-3-opus',
      'claude-3-sonnet',
      'deepseek-chat'
    ]
    const candidates = new Set(providerModels)
    if (agent?.config?.model) {
      candidates.add(agent.config.model)
    }
    if (globalModelConfig?.model) {
      candidates.add(globalModelConfig.model)
    }
    baseModels.forEach(model => candidates.add(model))
    return Array.from(candidates)
  }, [providerModels, agent?.config?.model, globalModelConfig?.model])

  const resolvedDefaultModel = agent?.config?.model
    || globalModelConfig?.model
    || providerModels[0]
    || availableModels[0]
    || 'gpt-4o'

  const form = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      description: agent?.description || '',
      type: agent?.type || 'conversational',
      capabilities: normalizeCapabilityList(agent?.capabilities || []),
      config: {
        provider: resolvedProvider,
        model: resolvedDefaultModel,
        temperature: agent?.config?.temperature || 0.7,
        maxTokens: agent?.config?.maxTokens || 4000,
        systemPrompt: defaultSystemPrompt,
        tools: normalizeToolList(agent?.tools || agent?.config?.tools || []),
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
        capabilities: normalizeCapabilityList(agent.capabilities || []),
        config: {
          provider: agent.config?.provider || resolvedProvider,
          model: agent.config?.model || resolvedDefaultModel,
          temperature: agent.config?.temperature || 0.7,
          maxTokens: agent.config?.maxTokens || 4000,
          systemPrompt: agent.config?.systemPrompt || defaultSystemPrompt,
          tools: normalizeToolList(agent.tools || agent.config?.tools || []),
          autoRetry: agent.config?.autoRetry || false,
          maxRetries: agent.config?.maxRetries || 3,
        }
      })
    } else {
      if (form.getValues('config.provider') !== resolvedProvider) {
        form.setValue('config.provider', resolvedProvider)
      }
      if (form.getValues('config.model') !== resolvedDefaultModel) {
        form.setValue('config.model', resolvedDefaultModel)
      }
      if (!form.getValues('config.systemPrompt')) {
        form.setValue('config.systemPrompt', defaultSystemPrompt)
      }
    }
  }, [agent, form, resolvedDefaultModel, resolvedProvider, defaultSystemPrompt])

  const onSubmit = (data) => {
    // 转换为后端期望的格式
    const normalizedCapabilities = normalizeCapabilityList(data.capabilities || [])
    const normalizedTools = normalizeToolList(data.config?.tools || [])

    const agentData = {
      name: data.name,
      description: data.description || '',
      systemPrompt: data.config?.systemPrompt || '',
      capabilities: normalizedCapabilities,
      tools: normalizedTools,
      config: {
        maxConcurrentTasks: 3,
        stopOnError: false,
        retryAttempts: data.config?.autoRetry ? (data.config?.maxRetries || 3) : 0,
        provider: resolvedProvider,
        model: data.config?.model || resolvedDefaultModel || 'gpt-4o-mini',
        temperature: data.config?.temperature || 0.7,
        maxTokens: data.config?.maxTokens || 4000,
        systemPrompt: data.config?.systemPrompt || defaultSystemPrompt,
        autoRetry: data.config?.autoRetry || false,
        maxRetries: data.config?.maxRetries || 3,
      }
    }
    onSave?.(agentData)
  }

  const addCapability = (capability) => {
    const normalized = normalizeCapabilityValue(capability)
    if (!normalized) return
    const current = form.getValues('capabilities') || []
    if (!current.includes(normalized)) {
      form.setValue('capabilities', [...current, normalized], { shouldValidate: true, shouldDirty: true })
    }
  }

  const removeCapability = (capability) => {
    const current = form.getValues('capabilities')
    form.setValue('capabilities', current.filter(c => c !== capability), { shouldDirty: true, shouldValidate: true })
  }

  const addCustomCapability = () => {
    if (customCapability.trim()) {
      const normalized = normalizeCapabilityValue(customCapability)
      addCapability(normalized)
      setCustomCapability('')
    }
  }

  const toggleTool = (tool) => {
    const normalized = normalizeToolValue(tool)
    if (!normalized) return
    const current = form.getValues('config.tools') || []
    if (current.includes(normalized)) {
      form.setValue(
        'config.tools',
        current.filter(t => t !== normalized),
        { shouldDirty: true, shouldValidate: true }
      )
    } else {
      form.setValue('config.tools', [...current, normalized], { shouldDirty: true, shouldValidate: true })
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
                                {getCapabilityLabel(translate, cap)}
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
                      {CAPABILITY_OPTIONS.map(option => {
                        const selectedCapabilities = form.watch('capabilities') || []
                        const isSelected = selectedCapabilities.includes(option.value)
                        const label = translate(option.labelKey, option.fallback)
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => isSelected ? removeCapability(option.value) : addCapability(option.value)}
                            className="gap-1"
                          >
                            {isSelected && <Plus className="size-3 rotate-45" />}
                            {label}
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel>{translate('agents.editor.fields.tools', 'Tools')}</FormLabel>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          checked={showMcpTools}
                          onCheckedChange={setShowMcpTools}
                          className="scale-75"
                        />
                        <span>MCP Services</span>
                      </div>
                    </div>

                    {mcpToolsLoading ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        加载 MCP 工具中...
                      </div>
                    ) : showMcpTools && flatTools.length > 0 ? (
                      <div className="space-y-3">
                        {/* 按类别分组显示 MCP 工具 */}
                        <ScrollArea className="h-[300px] rounded-md border p-3">
                          {Object.entries(toolsByCategory).map(([category, { name, tools: categoryTools }]) => (
                            <div key={category} className="mb-4 last:mb-0">
                              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                                {name} ({categoryTools.length})
                              </div>
                              <div className="grid grid-cols-1 gap-1.5">
                                {categoryTools.map((tool) => {
                                  const selectedTools = form.watch('config.tools') || []
                                  const isSelected = selectedTools.includes(tool.value)
                                  return (
                                    <Button
                                      key={tool.value}
                                      type="button"
                                      variant={isSelected ? 'default' : 'ghost'}
                                      size="sm"
                                      onClick={() => toggleTool(tool.value)}
                                      className="justify-start gap-2 h-auto py-2 px-3"
                                    >
                                      <div className={cn(
                                        "size-3 rounded-full border-2 flex-shrink-0",
                                        isSelected ? "bg-primary-foreground border-primary-foreground" : "bg-transparent border-muted-foreground/50"
                                      )} />
                                      <div className="flex-1 text-left min-w-0">
                                        <div className="font-medium text-xs truncate">{tool.toolName}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{tool.description}</div>
                                      </div>
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>

                        {/* 选中的工具统计 */}
                        {(() => {
                          const selectedTools = form.watch('config.tools') || []
                          return selectedTools.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedTools.map(toolId => {
                                const tool = flatTools.find(t => t.value === toolId)
                                if (!tool) return null
                                return (
                                  <Badge
                                    key={toolId}
                                    variant="secondary"
                                    className="text-xs gap-1"
                                  >
                                    {tool.toolName}
                                    <X
                                      className="size-3 cursor-pointer hover:text-destructive"
                                      onClick={() => toggleTool(toolId)}
                                    />
                                  </Badge>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    ) : showMcpTools ? (
                      <div className="text-sm text-muted-foreground text-center py-8 border rounded-md bg-muted/30">
                        <p className="mb-2">暂无可用的 MCP 工具</p>
                        <p className="text-xs">请先在设置中启用 MCP Services</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {TOOL_DEFINITIONS.map(({ value }) => {
                          const tools = form.watch('config.tools') || []
                          const isSelected = tools.includes(value)
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
                              {getToolLabel(translate, value)}
                            </Button>
                          )
                        })}
                      </div>
                    )}
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={modelConfigLoading && availableModels.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={translate('agents.editor.fields.modelPlaceholder', 'Select a model')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {translate(
                            'agents.editor.fields.modelHint',
                            'Models reflect your settings (provider: {provider}). Add more under Settings > Models.'
                          ).replace('{provider}', resolvedProvider || 'default')}
                        </FormDescription>
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
