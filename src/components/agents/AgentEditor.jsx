import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { X, Plus, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useModelConfigDB } from '@/hooks/useModelConfigDB'
import { useMcpManager } from '@/hooks/useMcpManager'
import { subscribeMcpServicesUpdated } from '@/lib/mcpEvents'

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
  loading = false,
  templates = [],
  templatesLoading = false,
  onApplyTemplate,
  onCreateTemplate
}) {
  const { translate } = useTranslation()
  const {
    modelConfig: globalModelConfig,
    currentProvider: currentProviderFromSettings,
    getProviderModels,
    loading: modelConfigLoading
  } = useModelConfigDB()
  const { services: mcpServices, loading: mcpServicesLoading, refresh: refreshMcpServices } = useMcpManager()
  const [customCapability, setCustomCapability] = useState('')
  const [showMcpTools, setShowMcpTools] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templatePreview, setTemplatePreview] = useState(null)
  const isEditing = !!agent
  const resolvedProvider = agent?.config?.provider || currentProviderFromSettings || 'openai'
  const defaultSystemPrompt = useMemo(() => (
    agent?.config?.systemPrompt
      || translate('agents.editor.defaults.systemPrompt', 'You are a helpful AI assistant. Please follow user instructions carefully and ask questions when clarification is needed.')
  ), [agent?.config?.systemPrompt, translate])

  const templateOptions = useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates]
  )

  const getTemplateTypeLabel = useCallback(
    (type) => (type === 'system'
      ? translate('agents.editor.templates.system', 'System')
      : translate('agents.editor.templates.custom', 'My Template')),
    [translate]
  )

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

  const submitting = loading || form.formState.isSubmitting

  const buildFormValuesFromTemplate = useCallback((templateConfig) => {
    if (!templateConfig) return null
    const templatePayload = typeof templateConfig === 'object' ? templateConfig : {}
    const normalizedCapabilities = normalizeCapabilityList(
      templatePayload.capabilities
        || templatePayload.config?.capabilities
        || []
    )
    const normalizedTools = normalizeToolList(
      templatePayload.tools
        || templatePayload.config?.tools
        || []
    )

    return {
      name: templatePayload.name || '',
      description: templatePayload.description || '',
      type: templatePayload.type || 'conversational',
      capabilities: normalizedCapabilities,
      config: {
        provider: templatePayload.config?.provider || resolvedProvider,
        model: templatePayload.config?.model || resolvedDefaultModel,
        temperature: templatePayload.config?.temperature ?? 0.7,
        maxTokens: templatePayload.config?.maxTokens ?? 4000,
        systemPrompt: templatePayload.systemPrompt
          || templatePayload.config?.systemPrompt
          || defaultSystemPrompt,
        tools: normalizedTools,
        autoRetry: templatePayload.config?.autoRetry || false,
        maxRetries: templatePayload.config?.maxRetries ?? 3
      }
    }
  }, [defaultSystemPrompt, resolvedDefaultModel, resolvedProvider])

  const buildTemplatePayloadFromForm = useCallback((formValues, overrides = {}) => {
    if (!formValues) return null
    const normalizedCapabilities = normalizeCapabilityList(formValues.capabilities || [])
    const normalizedTools = normalizeToolList(formValues.config?.tools || [])
    const templateName = overrides.name ?? formValues.name ?? translate('agents.editor.templates.defaultName', 'New Template')
    const templateDescription = overrides.description ?? formValues.description ?? ''

    return {
      name: templateName,
      description: templateDescription,
      tags: overrides.tags || [],
      category: overrides.category || null,
      config: {
        name: formValues.name || templateName,
        description: formValues.description || templateDescription,
        systemPrompt: formValues.config?.systemPrompt || defaultSystemPrompt,
        capabilities: normalizedCapabilities,
        tools: normalizedTools,
        config: {
          provider: formValues.config?.provider || resolvedProvider,
          model: formValues.config?.model || resolvedDefaultModel,
          temperature: formValues.config?.temperature ?? 0.7,
          maxTokens: formValues.config?.maxTokens ?? 4000,
          systemPrompt: formValues.config?.systemPrompt || defaultSystemPrompt,
          autoRetry: formValues.config?.autoRetry || false,
          maxRetries: formValues.config?.maxRetries ?? 3
        },
        avatarUrl: overrides.avatarUrl || agent?.avatarUrl || null,
        type: formValues.type || 'conversational'
      }
    }
  }, [agent?.avatarUrl, defaultSystemPrompt, resolvedDefaultModel, resolvedProvider, translate])

  const handleTemplateSelect = useCallback(async (value) => {
    setSelectedTemplateId(value)
    if (!value) {
      setTemplatePreview(null)
      return
    }
    if (typeof onApplyTemplate !== 'function') {
      return
    }
    try {
      setApplyingTemplate(true)
      const result = await onApplyTemplate(value)
      const payload = result?.config || result
      const formValues = buildFormValuesFromTemplate(payload)
      if (formValues) {
        form.reset(formValues)
      }
      setTemplatePreview({
        templateId: result?.templateId || value,
        templateName: result?.templateName || payload?.name || '',
        version: result?.version || 1,
        config: payload
      })
    } catch (error) {
      console.error('[AgentEditor] Failed to apply template:', error)
    } finally {
      setApplyingTemplate(false)
    }
  }, [onApplyTemplate, buildFormValuesFromTemplate, form])

  const handleClearTemplate = useCallback(() => {
    setSelectedTemplateId('')
    setTemplatePreview(null)
  }, [])

  const handleSaveTemplate = useCallback(async () => {
    if (typeof onCreateTemplate !== 'function') return
    if (typeof window === 'undefined') return

    const currentValues = form.getValues()
    const suggestedName = currentValues.name || translate('agents.editor.templates.defaultName', 'New Template')
    const promptLabel = translate('agents.editor.templates.savePrompt', 'Template name')
    const input = window.prompt(promptLabel, suggestedName)
    if (input === null) {
      return
    }
    const trimmed = input.trim()
    if (!trimmed) {
      return
    }

    const payload = buildTemplatePayloadFromForm(currentValues, { name: trimmed })
    if (!payload) return

    try {
      setSavingTemplate(true)
      await onCreateTemplate(payload)
    } catch (error) {
      console.error('[AgentEditor] Failed to create template:', error)
    } finally {
      setSavingTemplate(false)
    }
  }, [onCreateTemplate, form, buildTemplatePayloadFromForm, translate])

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

  useEffect(() => {
    if (!open) {
      setSelectedTemplateId('')
      setTemplatePreview(null)
    }
  }, [open])

  useEffect(() => {
    if (isEditing) {
      setSelectedTemplateId('')
      setTemplatePreview(null)
    }
  }, [isEditing])

  useEffect(() => {
    if (selectedTemplateId && !templateOptions.some(item => item.id === selectedTemplateId)) {
      setSelectedTemplateId('')
      setTemplatePreview(null)
    }
  }, [selectedTemplateId, templateOptions])

  // 监听 MCP 服务更新事件，实时同步配置页面的修改
  useEffect(() => {
    const unsubscribe = subscribeMcpServicesUpdated(() => {
      console.log('[AgentEditor] 收到 MCP 服务更新事件，刷新服务列表')
      // emitEvent: false 防止触发新的事件，避免无限循环
      refreshMcpServices({ refresh: true, emitEvent: false })
    })
    return unsubscribe
  }, [refreshMcpServices])

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col flex-1 min-h-0">
            {!isEditing && (
              <div className="space-y-2 rounded-md border bg-muted/40 p-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {translate('agents.editor.templates.selectLabel', 'Start from template')}
                  </div>
                  {(templatesLoading || applyingTemplate) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Select
                    value={selectedTemplateId || undefined}
                    onValueChange={handleTemplateSelect}
                    disabled={
                      templatesLoading
                      || applyingTemplate
                      || submitting
                      || templateOptions.length === 0
                    }
                  >
                    <SelectTrigger className="md:w-80">
                      <SelectValue placeholder={translate('agents.editor.templates.placeholder', 'Choose a template...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          {translate('agents.editor.templates.empty', 'No templates available yet')}
                        </SelectItem>
                      ) : templateOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} · {getTemplateTypeLabel(item.templateType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplateId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearTemplate}
                      disabled={applyingTemplate}
                    >
                      {translate('agents.editor.templates.clear', 'Clear')}
                    </Button>
                  )}
                </div>
                {templatePreview && (
                  <div className="rounded-md border border-dashed bg-background/60 p-3 text-xs text-muted-foreground">
                    <div className="text-sm font-medium text-foreground">
                      {templatePreview.templateName}
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                        v{templatePreview.version}
                      </span>
                    </div>
                    {templatePreview.config?.description && (
                      <p className="mt-1 leading-relaxed">
                        {templatePreview.config.description}
                      </p>
                    )}
                    {(templatePreview.config?.capabilities || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {templatePreview.config.capabilities.map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {toTitleCase(cap)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Tabs defaultValue="basic" className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
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
              <TabsContent value="basic" className="flex-1 mt-4 overflow-y-auto pr-4 data-[state=active]:block data-[state=inactive]:hidden">
                <div className="space-y-4 pb-4">
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
                </div>
              </TabsContent>

              {/* Capabilities Tab */}
              <TabsContent value="capabilities" className="flex-1 mt-4 overflow-y-auto pr-4 data-[state=active]:block data-[state=inactive]:hidden">
                <div className="space-y-4 pb-4">
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
                        <span>{translate('agents.editor.fields.mcpToggle', 'MCP Services')}</span>
                      </div>
                    </div>

                    {mcpServicesLoading ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        {translate('agents.editor.mcp.loading', 'Loading MCP services...')}
                      </div>
                    ) : showMcpTools && mcpServices && mcpServices.length > 0 ? (
                      <div className="space-y-3">
                        {/* MCP 服务列表 */}
                        <div className="max-h-[250px] overflow-y-auto rounded-md border p-3 bg-muted/20">
                          <div className="grid grid-cols-1 gap-1.5">
                            {mcpServices.map((service) => {
                              const selectedServices = form.watch('config.tools') || []
                              const isSelected = selectedServices.includes(service.id)
                              const isEnabled = service.enabled
                              return (
                                <Button
                                  key={service.id}
                                  type="button"
                                  variant={isSelected ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => toggleTool(service.id)}
                                  disabled={!isEnabled}
                                  className="justify-start gap-2 h-auto py-2 px-3"
                                >
                                  <div className={cn(
                                    "size-3 rounded-full border-2 flex-shrink-0",
                                    isSelected ? "bg-primary-foreground border-primary-foreground" : "bg-transparent border-muted-foreground/50"
                                  )} />
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium text-xs truncate flex items-center gap-2">
                                      {service.name}
                                      {!isEnabled && (
                                        <Badge variant="outline" className="text-xs">
                                          {translate('agents.editor.mcp.disabled', 'Disabled')}
                                        </Badge>
                                      )}
                                      {service.toolCount > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {service.toolCount} {translate('agents.editor.mcp.tools', 'tools')}
                                        </Badge>
                                      )}
                                    </div>
                                    {service.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                                    )}
                                  </div>
                                </Button>
                              )
                            })}
                          </div>
                        </div>

                        {/* 选中的服务统计 */}
                        {(() => {
                          const selectedServices = form.watch('config.tools') || []
                          return selectedServices.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedServices.map(serviceId => {
                                const service = mcpServices.find(s => s.id === serviceId)
                                if (!service) return null
                                return (
                                  <Badge
                                    key={serviceId}
                                    variant="secondary"
                                    className="text-xs gap-1"
                                  >
                                    {service.name}
                                    <X
                                      className="size-3 cursor-pointer hover:text-destructive"
                                      onClick={() => toggleTool(serviceId)}
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
                        <p className="mb-2">
                          {translate('agents.editor.mcp.noServicesTitle', 'No available MCP services')}
                        </p>
                        <p className="text-xs">
                          {translate('agents.editor.mcp.noServicesHint', 'Please enable MCP Services in settings first')}
                        </p>
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
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="flex-1 mt-4 overflow-y-auto pr-4 data-[state=active]:block data-[state=inactive]:hidden">
                <div className="space-y-4 pb-4">
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
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end flex-shrink-0 pt-4 border-t">
              {onCreateTemplate && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveTemplate}
                  disabled={submitting || savingTemplate}
                >
                  {savingTemplate
                    ? translate('agents.editor.buttons.savingTemplate', 'Saving template...')
                    : translate('agents.editor.buttons.saveTemplate', 'Save as Template')}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {translate('agents.editor.buttons.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
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
