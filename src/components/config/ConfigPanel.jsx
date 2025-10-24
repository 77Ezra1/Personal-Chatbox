import { useEffect, useState } from 'react'
import { X, Info, Zap, Eye, EyeOff, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDERS } from '@/lib/constants'
import { toast } from 'sonner'
import { TokenInfoDialog } from './TokenInfoDialog'
import { detectThinkingMode } from '@/lib/modelThinkingDetector'
import ModelCompatibilityInfo from '../settings/ModelCompatibilityInfo'
import RecommendedModelsGuide from '../settings/RecommendedModelsGuide'

/**
 * 配置面板组件
 * 提供模型配置设置
 */
export function ConfigPanel({
  modelConfig,
  currentProvider,
  currentModel,
  providerModels,
  customModels,
  onProviderChange,
  onModelChange,
  onRemoveModel,
  onSaveConfig,
  onClose,
  isOpen = true,
  translate,
  language = 'zh',
  showHeader = true // 新增：控制是否显示头部
}) {
  const [draftConfig, setDraftConfig] = useState(modelConfig)
  const [modelInput, setModelInput] = useState(currentModel || '')
  const [showTokenInfo, setShowTokenInfo] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const commitModelValue = (value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      setModelInput(currentModel || '')
      setDraftConfig(prev => ({ ...prev, model: currentModel || '' }))
      return
    }
    setModelInput(trimmedValue)

    // 自动检测思考模式
    const detectedMode = detectThinkingMode(trimmedValue)

    setDraftConfig(prev => ({
      ...prev,
      model: trimmedValue,
      thinkingMode: detectedMode,  // 自动设置思考模式
      supportsDeepThinking: detectedMode !== 'disabled'  // 自动设置是否支持深度思考
    }))
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
    <div className={showHeader ? `config-panel ${isOpen ? 'open' : ''}` : 'w-full'}>
      {/* 头部 */}
      {showHeader && (
        <div className="config-header">
          <h2>{translate('headings.modelConfiguration', 'Model configuration')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 配置表单 */}
      <div className={showHeader ? "config-form" : "space-y-4"}>
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
              'config.modelInputHint',
              'Enter model ID directly or click recommended items below.'
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
                      title={translate?.('config.deleteModel', 'Delete this model')}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 模型兼容性信息 */}
          {currentModel && (
            <ModelCompatibilityInfo
              provider={currentProvider}
              model={currentModel}
            />
          )}
        </div>

        {/* 推荐模型指南 */}
        <RecommendedModelsGuide />

        {/* API Key */}
        <div className="config-field">
          <label>{translate('labels.apiKey', 'API key')}</label>
          <div className="config-input-group" style={{ position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={draftConfig.apiKey || ''}
              onChange={(e) => updateField('apiKey', e.target.value)}
              className="config-input"
              placeholder="sk-..."
              style={{ paddingRight: '80px' }}
            />
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '4px'
            }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? translate?.('config.hideApiKey', 'Hide API Key') : translate?.('config.showApiKey', 'Show API Key')}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (draftConfig.apiKey) {
                    navigator.clipboard.writeText(draftConfig.apiKey)
                    toast.success(translate?.('config.apiKeyCopied', 'API Key copied to clipboard'))
                  }
                }}
                title={translate?.('config.copyApiKey', 'Copy API Key')}
                disabled={!draftConfig.apiKey}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
              title={translate?.('config.viewComparison', 'View comparison')}
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
              placeholder={translate?.('config.unlimitedHint', 'Leave empty for unlimited')}
              min="1"
            />
            <Button
              variant="outline"
              size="sm"
              className="config-max-tokens-button"
              onClick={() => {
                updateField('maxTokens', -1)
                toast.success(
                  translate?.('config.alreadyUnlimited', 'Already set to unlimited, will use model maximum output tokens')
                )
              }}
              title={translate?.('config.setUnlimited', 'Set to unlimited (use model maximum)')}
            >
              <Zap className="w-3 h-3" />
              {translate?.('config.unlimited', 'Unlimited')}
            </Button>
          </div>
          <p className="config-hint">
            {draftConfig.maxTokens === -1
              ? translate?.('config.currentUnlimited', 'Current: Unlimited (using model maximum output tokens)')
              : `Current: ${draftConfig.maxTokens || 1024} tokens`}
          </p>
        </div>

        {/* Supports Deep Thinking (保留向后兼容) */}
        <div className="config-field">
          <label className="config-checkbox-label">
            <input
              type="checkbox"
              checked={draftConfig.supportsDeepThinking || false}
              onChange={(e) => {
                updateField('supportsDeepThinking', e.target.checked)
                // 自动设置thinkingMode
                if (e.target.checked && !draftConfig.thinkingMode) {
                  updateField('thinkingMode', 'optional')
                } else if (!e.target.checked) {
                  updateField('thinkingMode', 'disabled')
                }
              }}
              className="config-checkbox"
            />
            <span>{translate('labels.supportsDeepThinking', 'Supports Deep Thinking')}</span>
          </label>
          <p className="config-hint">
            {translate('hints.supportsDeepThinking', 'Enable if model supports deep thinking mode (e.g. o1, o3-mini)')}
          </p>
        </div>

        {/* Thinking Mode (新增) */}
        {draftConfig.supportsDeepThinking && (
          <div className="config-field">
            <label className="config-label">
              {translate('labels.thinkingMode', 'Deep Thinking Mode')}
            </label>
            <select
              value={draftConfig.thinkingMode || 'optional'}
              onChange={(e) => updateField('thinkingMode', e.target.value)}
              className="config-select"
            >
              <option value="disabled">{translate('thinkingMode.disabled', 'Not Supported')}</option>
              <option value="optional">{translate('thinkingMode.optional', 'Optional (Can Toggle)')}</option>
              <option value="always-on">{translate('thinkingMode.alwaysOn', 'Always On (Cannot Disable)')}</option>
              <option value="adaptive">{translate('thinkingMode.adaptive', 'Adaptive (Auto Decide)')}</option>
            </select>
            <p className="config-hint">
              {translate('hints.thinkingMode', 'Select how the model handles deep thinking mode')}
            </p>
          </div>
        )}

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
        translate={translate}
      />
    </div>
  )
}

