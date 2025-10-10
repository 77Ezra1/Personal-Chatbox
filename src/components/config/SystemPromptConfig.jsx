import { useState, useMemo } from 'react'
import { Info, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDERS } from '@/lib/constants'
import './SystemPromptConfig.css'

/**
 * 系统提示词配置组件
 */
export function SystemPromptConfig({
  systemPrompt,
  onModeChange,
  onGlobalPromptChange,
  onModelPromptsChange,
  language,
  translate,
  customModels
}) {
  const [globalPromptText, setGlobalPromptText] = useState('')
  const [perModelPromptText, setPerModelPromptText] = useState('')
  const [selectedModels, setSelectedModels] = useState([])

  // 获取所有可用的模型列表（来自用户配置的模型）
  const allModels = useMemo(() => {
    if (!customModels) return []
    
    const models = []
    Object.entries(customModels).forEach(([providerId, modelList]) => {
      const providerConfig = PROVIDERS[providerId]
      if (!providerConfig || !modelList || modelList.length === 0) return
      
      modelList.forEach(model => {
        models.push({
          key: `${providerId}:${model}`,
          provider: providerId,
          providerLabel: providerConfig.label,
          model: model
        })
      })
    })
    return models
  }, [customModels])

  // 获取已配置的模型列表
  const configuredModels = useMemo(() => {
    return Object.keys(systemPrompt.prompts || {}).map(key => {
      const [provider, model] = key.split(':')
      const providerConfig = PROVIDERS[provider]
      return {
        key,
        provider,
        providerLabel: providerConfig?.label || provider,
        model,
        prompt: systemPrompt.prompts[key]
      }
    })
  }, [systemPrompt.prompts])

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
  const toggleModelSelection = (modelKey) => {
    setSelectedModels(prev => {
      if (prev.includes(modelKey)) {
        return prev.filter(k => k !== modelKey)
      } else {
        return [...prev, modelKey]
      }
    })
  }

  // 删除已配置的模型提示词
  const handleRemoveModelPrompt = (modelKey) => {
    const newPrompts = { ...systemPrompt.prompts }
    delete newPrompts[modelKey]
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
              {/* 模型选择器 */}
              <div className="system-prompt-model-selector">
                <div className="system-prompt-model-selector-header">
                  <span>{translate?.('systemPrompt.selectModels', 'Select models to apply (multiple selection allowed)')}</span>
                </div>
                <div className="system-prompt-model-grid">
                  {allModels.map(({ key, providerLabel, model }) => (
                    <button
                      key={key}
                      type="button"
                      className={`system-prompt-model-option ${selectedModels.includes(key) ? 'selected' : ''}`}
                      onClick={() => toggleModelSelection(key)}
                    >
                      {selectedModels.includes(key) && (
                        <Check className="w-3 h-3 system-prompt-model-check" />
                      )}
                      <span className="system-prompt-model-provider">{providerLabel}</span>
                      <span className="system-prompt-model-name-small">{model}</span>
                    </button>
                  ))}
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
                    {translate?.('systemPrompt.configuredModels', 'Configured Models')}
                  </label>
                  <div className="system-prompt-model-list">
                    {configuredModels.map(({ key, providerLabel, model, prompt }) => (
                      <div key={key} className="system-prompt-model-item">
                        <div className="system-prompt-model-info">
                          <span className="system-prompt-model-name">
                            {providerLabel} / {model}
                          </span>
                          <span className="system-prompt-model-preview">
                            {prompt.substring(0, 50)}{prompt.length > 50 ? '...' : ''}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveModelPrompt(key)}
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

