import { useState, useMemo } from 'react'
import { Info, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDERS } from '@/lib/constants'
import './SystemPromptConfig.css'

/**
 * 系统提示词配置组件（重构版）
 * 支持按服务商分组显示模型
 */
export function SystemPromptConfigNew({
  systemPrompt,
  onModeChange,
  onGlobalPromptChange,
  onModelPromptsChange,
  language,
  translate,
  allModels = [] // 所有模型列表，格式：[{id, provider, providerLabel, modelName}]
}) {
  const [globalPromptText, setGlobalPromptText] = useState('')
  const [perModelPromptText, setPerModelPromptText] = useState('')
  const [selectedModels, setSelectedModels] = useState([])
  const [expandedProviders, setExpandedProviders] = useState(new Set())

  // 按服务商分组模型
  const modelsByProvider = useMemo(() => {
    const grouped = {}
    
    allModels.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = {
          providerLabel: model.providerLabel,
          models: []
        }
      }
      grouped[model.provider].models.push({
        id: model.id,
        modelName: model.modelName
      })
    })
    
    return grouped
  }, [allModels])

  // 获取服务商列表（按PROVIDERS顺序）
  const providerList = useMemo(() => {
    return Object.keys(PROVIDERS).filter(providerId => modelsByProvider[providerId])
  }, [modelsByProvider])

  // 获取已配置的模型列表
  const configuredModels = useMemo(() => {
    return Object.keys(systemPrompt.prompts || {}).map(modelId => {
      const model = allModels.find(m => m.id === modelId)
      return {
        id: modelId,
        provider: model?.provider || '',
        providerLabel: model?.providerLabel || '',
        modelName: model?.modelName || '',
        prompt: systemPrompt.prompts[modelId]
      }
    }).filter(m => m.modelName) // 过滤掉找不到的模型
  }, [systemPrompt.prompts, allModels])

  // 切换服务商展开/折叠
  const toggleProvider = (providerId) => {
    setExpandedProviders(prev => {
      const next = new Set(prev)
      if (next.has(providerId)) {
        next.delete(providerId)
      } else {
        next.add(providerId)
      }
      return next
    })
  }

  // 全部展开/折叠
  const toggleAllProviders = () => {
    if (expandedProviders.size === providerList.length) {
      setExpandedProviders(new Set())
    } else {
      setExpandedProviders(new Set(providerList))
    }
  }

  // 处理模式切换
  const handleModeChange = (mode) => {
    onModeChange(mode)
  }

  // 处理全局提示词保存
  const handleSaveGlobalPrompt = () => {
    onGlobalPromptChange(globalPromptText)
    setGlobalPromptText('')
  }

  // 处理全局提示词清除
  const handleClearGlobalPrompt = () => {
    onGlobalPromptChange('')
    setGlobalPromptText('')
  }

  // 处理指定模型提示词保存
  const handleSaveModelPrompts = () => {
    if (selectedModels.length === 0 || !perModelPromptText.trim()) {
      return
    }
    onModelPromptsChange(selectedModels, perModelPromptText)
    setPerModelPromptText('')
    setSelectedModels([])
  }

  // 切换模型选择
  const toggleModelSelection = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId)
      } else {
        return [...prev, modelId]
      }
    })
  }

  // 选择服务商下所有模型
  const selectAllInProvider = (providerId) => {
    const providerModels = modelsByProvider[providerId].models.map(m => m.id)
    const allSelected = providerModels.every(id => selectedModels.includes(id))
    
    if (allSelected) {
      // 取消选择该服务商的所有模型
      setSelectedModels(prev => prev.filter(id => !providerModels.includes(id)))
    } else {
      // 选择该服务商的所有模型
      setSelectedModels(prev => {
        const next = new Set(prev)
        providerModels.forEach(id => next.add(id))
        return Array.from(next)
      })
    }
  }

  // 删除已配置的模型提示词
  const handleRemoveModelPrompt = (modelId) => {
    const newPrompts = { ...systemPrompt.prompts }
    delete newPrompts[modelId]
    onModelPromptsChange([], '', newPrompts)
  }

  return (
    <div className="system-prompt-config">
      <div className="system-prompt-header">
        <h3 className="system-prompt-title">
          {translate('sections.systemPrompt', 'System Prompt')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          title={translate?.('systemPrompt.description', 'System prompt defines the role and behavior of the model')}
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* 模式选择 */}
      <div className="system-prompt-mode">
        <label className="system-prompt-label">
          {translate?.('systemPrompt.mode', 'Application Mode')}
        </label>
        <div className="system-prompt-mode-radio-group">
          <label className="system-prompt-mode-radio">
            <input
              type="radio"
              name="system-prompt-mode"
              checked={systemPrompt.mode === 'none'}
              onChange={() => handleModeChange('none')}
            />
            <span>{translate?.('systemPrompt.modeNone', 'Not Used')}</span>
          </label>
          <label className="system-prompt-mode-radio">
            <input
              type="radio"
              name="system-prompt-mode"
              checked={systemPrompt.mode === 'global'}
              onChange={() => handleModeChange('global')}
            />
            <span>{translate?.('systemPrompt.modeGlobal', 'Global')}</span>
          </label>
          <label className="system-prompt-mode-radio">
            <input
              type="radio"
              name="system-prompt-mode"
              checked={systemPrompt.mode === 'per-model'}
              onChange={() => handleModeChange('per-model')}
            />
            <span>{translate?.('systemPrompt.modeSpecific', 'Specific Models')}</span>
          </label>
        </div>
      </div>

      {/* 全局提示词 */}
      {systemPrompt.mode === 'global' && (
        <div className="system-prompt-global">
          <label className="system-prompt-label">
            {translate?.('systemPrompt.globalPrompt', 'Global Prompt (applies to all models)')}
          </label>
          <textarea
            className="system-prompt-textarea"
            placeholder={translate?.('systemPrompt.globalPromptPlaceholder', 'Enter system prompt...')}
            value={globalPromptText || systemPrompt.prompt}
            onChange={(e) => setGlobalPromptText(e.target.value)}
            rows={6}
          />
          <div className="system-prompt-actions">
            <Button
              onClick={handleSaveGlobalPrompt}
              disabled={!globalPromptText.trim()}
              size="sm"
            >
              {translate('buttons.save', 'Save')}
            </Button>
            {systemPrompt.prompt && (
              <Button
                onClick={handleClearGlobalPrompt}
                variant="outline"
                size="sm"
              >
                {translate?.('systemPrompt.clear', 'Clear')}
              </Button>
            )}
          </div>
          {systemPrompt.prompt && (
            <p className="system-prompt-hint">
              {translate?.('systemPrompt.globalPromptSet', 'Global prompt is currently set')}
            </p>
          )}
        </div>
      )}

      {/* 指定模型提示词 */}
      {systemPrompt.mode === 'per-model' && (
        <div className="system-prompt-per-model">
          <label className="system-prompt-label">
            {translate?.('systemPrompt.addModelPrompt', 'Add Model Prompt')}
          </label>

          {allModels.length === 0 ? (
            <p className="system-prompt-hint">
              {translate?.('systemPrompt.addModelFirst', 'Please add models above before configuring model-specific prompts.')}
            </p>
          ) : (
            <>
              {/* 模型选择器 - 按服务商分组 */}
              <div className="system-prompt-model-selector">
                <div className="system-prompt-model-selector-header">
                  <span>{translate?.('systemPrompt.selectModels', 'Select models to apply (multiple selection allowed)')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllProviders}
                    className="text-xs"
                  >
                    {expandedProviders.size === providerList.length 
                      ? translate?.('systemPrompt.collapseAll', 'Collapse All')
                      : translate?.('systemPrompt.expandAll', 'Expand All')}
                  </Button>
                </div>

                <div className="system-prompt-provider-groups">
                  {providerList.map(providerId => {
                    const providerData = modelsByProvider[providerId]
                    const isExpanded = expandedProviders.has(providerId)
                    const providerModelIds = providerData.models.map(m => m.id)
                    const allSelected = providerModelIds.every(id => selectedModels.includes(id))
                    const someSelected = providerModelIds.some(id => selectedModels.includes(id))

                    return (
                      <div key={providerId} className="system-prompt-provider-group">
                        {/* 服务商头部 */}
                        <div className="system-prompt-provider-header">
                          <button
                            type="button"
                            className="system-prompt-provider-toggle"
                            onClick={() => toggleProvider(providerId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="system-prompt-provider-name">
                              {providerData.providerLabel}
                            </span>
                            <span className="system-prompt-provider-count">
                              ({providerData.models.length})
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`system-prompt-select-all ${someSelected ? 'selected' : ''}`}
                            onClick={() => selectAllInProvider(providerId)}
                            title={language === 'zh' ? '全选/取消全选' : 'Select/Deselect All'}
                          >
                            {allSelected ? (
                              <Check className="w-3 h-3" />
                            ) : someSelected ? (
                              <span className="w-3 h-3 flex items-center justify-center">-</span>
                            ) : null}
                          </button>
                        </div>

                        {/* 模型列表 */}
                        {isExpanded && (
                          <div className="system-prompt-model-list-group">
                            {providerData.models.map(model => (
                              <button
                                key={model.id}
                                type="button"
                                className={`system-prompt-model-option ${selectedModels.includes(model.id) ? 'selected' : ''}`}
                                onClick={() => toggleModelSelection(model.id)}
                              >
                                {selectedModels.includes(model.id) && (
                                  <Check className="w-3 h-3 system-prompt-model-check" />
                                )}
                                <span className="system-prompt-model-name-small">{model.modelName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 提示词输入 - 只在选择了模型后显示 */}
              {selectedModels.length > 0 && (
                <div className="system-prompt-input">
                  <label className="system-prompt-label">
                    {language === 'zh' 
                      ? `提示词（将应用于 ${selectedModels.length} 个模型）` 
                      : `Prompt (will apply to ${selectedModels.length} models)`}
                  </label>
                  <textarea
                    className="system-prompt-textarea"
                    placeholder={translate?.('systemPrompt.globalPromptPlaceholder', 'Enter system prompt...')}
                    value={perModelPromptText}
                    onChange={(e) => setPerModelPromptText(e.target.value)}
                    rows={6}
                  />
                  <div className="system-prompt-actions">
                    <Button
                      onClick={handleSaveModelPrompts}
                      disabled={!perModelPromptText.trim()}
                      size="sm"
                    >
                      {translate('buttons.save', 'Save')}
                    </Button>
                    <Button
                      onClick={() => {
                        setPerModelPromptText('')
                        setSelectedModels([])
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {translate('buttons.cancel', 'Cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* 已配置的模型列表 */}
              {configuredModels.length > 0 && (
                <div className="system-prompt-configured">
                  <label className="system-prompt-label">
                    {language === 'zh' ? '已配置的模型' : 'Configured Models'}
                  </label>
                  <div className="system-prompt-model-list">
                    {configuredModels.map(model => (
                      <div key={model.id} className="system-prompt-model-item">
                        <div className="system-prompt-model-info">
                          <span className="system-prompt-model-name">
                            {model.providerLabel} / {model.modelName}
                          </span>
                          <span className="system-prompt-model-preview">
                            {model.prompt.substring(0, 50)}{model.prompt.length > 50 ? '...' : ''}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveModelPrompt(model.id)}
                          title={translate?.('systemPrompt.delete', 'Delete')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 说明文本 */}
      {systemPrompt.mode !== 'none' && (
        <p className="system-prompt-description">
          {systemPrompt.mode === 'global' 
            ? translate?.('systemPrompt.globalPromptHelp', 'Global prompt applies to all model conversations, defining the role and behavior.')
            : translate?.('systemPrompt.specificPromptHelp', 'Specific model prompts apply only to selected models, allowing different roles for different models.')}
        </p>
      )}
    </div>
  )
}

