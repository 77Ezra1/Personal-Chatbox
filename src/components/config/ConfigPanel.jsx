import { useEffect, useState } from 'react'
import { X, Info, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDERS } from '@/lib/constants'
import { toast } from 'sonner'
import { TokenInfoDialog } from './TokenInfoDialog'
import { SystemPromptConfig } from './SystemPromptConfig'

/**
 * 配置面板组件
 * 提供模型配置和系统提示词设置
 */
export function ConfigPanel({
  modelConfig,
  currentProvider,
  currentModel,
  providerModels,
  onProviderChange,
  onModelChange,
  onRemoveModel,
  onSaveConfig,
  onClose,
  isOpen = true,
  translate,
  language = 'zh',
  systemPrompt,
  onSystemPromptModeChange,
  onSystemPromptGlobalChange,
  onSystemPromptModelChange
}) {
  const [draftConfig, setDraftConfig] = useState(modelConfig)
  const [modelInput, setModelInput] = useState(currentModel || '')
  const [showTokenInfo, setShowTokenInfo] = useState(false)

  const commitModelValue = (value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      setModelInput(currentModel || '')
      setDraftConfig(prev => ({ ...prev, model: currentModel || '' }))
      return
    }
    setModelInput(trimmedValue)
    setDraftConfig(prev => ({ ...prev, model: trimmedValue }))
    onModelChange(trimmedValue)
  }

  useEffect(() => {
    setDraftConfig(modelConfig)
  }, [modelConfig])

  useEffect(() => {
    setModelInput(currentModel || '')
  }, [currentModel])

  const handleSave = () => {
    onSaveConfig(draftConfig)
    toast.success(translate('toasts.configSaved', 'Configuration saved.'))
  }

  const updateField = (field, value) => {
    setDraftConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <aside className={`config-panel ${isOpen ? 'open' : ''}`}>
      {/* 头部 */}
      <div className="config-header">
        <h2>{translate('headings.modelConfiguration', 'Model configuration')}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 配置表单 */}
      <div className="config-form">
        {/* 提供商选择 */}
        <div className="config-field">
          <label>{translate('labels.provider', 'Provider')}</label>
          <select
            value={currentProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="config-select"
          >
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <option key={key} value={key}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        {/* 模型选择 */}
        <div className="config-field">
          <label>{translate('labels.modelId', 'Model ID')}</label>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            onBlur={() => {
              commitModelValue(modelInput)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitModelValue(modelInput)
              }
            }}
            className="config-input"
            placeholder={translate('placeholders.customModel', 'Enter custom model ID')}
          />
          <p className="config-hint">
            {translate(
              'hints.customModelInput',
              '直接输入模型 ID，或点击下方推荐项快速填入。'
            )}
          </p>
          {providerModels?.length > 0 && (
            <div
              className="config-model-suggestions"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
            >
              {providerModels.map((model) => (
                <div key={model} className="config-model-item">
                  <Button
                    type="button"
                    variant={model === currentModel ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      commitModelValue(model)
                    }}
                  >
                    {model}
                  </Button>
                  {onRemoveModel && (
                    <button
                      type="button"
                      className="config-model-remove"
                      onClick={() => onRemoveModel(model)}
                      title={language === 'zh' ? '删除此模型' : 'Remove this model'}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Key */}
        <div className="config-field">
          <label>{translate('labels.apiKey', 'API key')}</label>
          <input
            type="password"
            value={draftConfig.apiKey || ''}
            onChange={(e) => updateField('apiKey', e.target.value)}
            className="config-input"
            placeholder="sk-..."
          />
        </div>

        {/* Temperature */}
        <div className="config-field">
          <label>
            {translate('labels.temperature', 'Temperature')}: {draftConfig.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={draftConfig.temperature || 0.7}
            onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
            className="config-slider"
          />
        </div>

        {/* Max Tokens */}
        <div className="config-field">
          <label>
            {translate('labels.maxTokens', 'Max tokens')}
            <Button
              variant="ghost"
              size="icon"
              className="config-info-button"
              onClick={() => setShowTokenInfo(true)}
              title={language === 'zh' ? '查看优劣势说明' : 'View pros and cons'}
            >
              <Info className="w-4 h-4" />
            </Button>
          </label>
          <div className="config-input-group">
            <input
              type="number"
              value={draftConfig.maxTokens === -1 ? '' : (draftConfig.maxTokens || 1024)}
              onChange={(e) => {
                const value = e.target.value === '' ? -1 : parseInt(e.target.value)
                updateField('maxTokens', value)
              }}
              className="config-input"
              placeholder={language === 'zh' ? '留空表示无限制' : 'Leave empty for unlimited'}
              min="1"
            />
            <Button
              variant="outline"
              size="sm"
              className="config-max-tokens-button"
              onClick={() => {
                updateField('maxTokens', -1)
                toast.success(
                  language === 'zh' 
                    ? '已设置为无限制，将使用模型支持的最大输出Token数' 
                    : 'Set to unlimited, will use model\'s maximum output tokens'
                )
              }}
              title={language === 'zh' ? '设置为无限制（使用模型最大值）' : 'Set to unlimited (use model maximum)'}
            >
              <Zap className="w-3 h-3" />
              {language === 'zh' ? '无限制' : 'Unlimited'}
            </Button>
          </div>
          <p className="config-hint">
            {draftConfig.maxTokens === -1 
              ? (language === 'zh' 
                  ? '当前：无限制（使用模型支持的最大输出Token数）' 
                  : 'Current: Unlimited (uses model\'s maximum output tokens)')
              : (language === 'zh' 
                  ? `当前：${draftConfig.maxTokens || 1024} tokens` 
                  : `Current: ${draftConfig.maxTokens || 1024} tokens`)}
          </p>
        </div>

        {/* Supports Deep Thinking */}
        <div className="config-field">
          <label className="config-checkbox-label">
            <input
              type="checkbox"
              checked={draftConfig.supportsDeepThinking || false}
              onChange={(e) => updateField('supportsDeepThinking', e.target.checked)}
              className="config-checkbox"
            />
            <span>{translate('labels.supportsDeepThinking', 'Supports Deep Thinking')}</span>
          </label>
          <p className="config-hint">
            {translate('hints.supportsDeepThinking', 'Enable if model supports deep thinking mode (e.g. o1, o3-mini)')}
          </p>
        </div>

        {/* 系统提示词配置 */}
        <SystemPromptConfig
          systemPrompt={systemPrompt}
          onModeChange={onSystemPromptModeChange}
          onGlobalPromptChange={onSystemPromptGlobalChange}
          onModelPromptsChange={onSystemPromptModelChange}
          language={language}
          translate={translate}
        />

        {/* 保存按钮 */}
        <Button onClick={handleSave} className="config-save-button">
          {translate('buttons.save', 'Save')}
        </Button>
      </div>

      {/* Token信息对话框 */}
      <TokenInfoDialog
        isOpen={showTokenInfo}
        onClose={() => setShowTokenInfo(false)}
        language={language}
      />
    </aside>
  )
}

