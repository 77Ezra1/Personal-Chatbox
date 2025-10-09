import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDERS } from '@/lib/constants'
import { toast } from 'sonner'

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
  onSaveConfig,
  onClose,
  isOpen = true,
  translate
}) {
  const [draftConfig, setDraftConfig] = useState(modelConfig)

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
          <label>{translate('labels.model', 'Model')}</label>
          <select
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="config-select"
          >
            {providerModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
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
          <label>{translate('labels.maxTokens', 'Max tokens')}</label>
          <input
            type="number"
            value={draftConfig.maxTokens || 1024}
            onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
            className="config-input"
            min="1"
            max="128000"
          />
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

        {/* 保存按钮 */}
        <Button onClick={handleSave} className="config-save-button">
          {translate('buttons.save', 'Save')}
        </Button>
      </div>
    </aside>
  )
}

