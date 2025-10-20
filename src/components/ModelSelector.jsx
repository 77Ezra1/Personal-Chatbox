/**
 * 模型选择器组件
 * 可用于全局或局部模型选择
 */

import React from 'react'
import { useModel } from '../contexts/ModelContext'
import './ModelSelector.css'

export default function ModelSelector({
  // 是否显示"使用全局设置"选项
  showGlobalOption = false,
  // 局部选择的模型（可选）
  localModel = null,
  // 模型改变回调
  onChange = null,
  // 大小
  size = 'medium', // 'small' | 'medium' | 'large'
  // 样式类型
  variant = 'default', // 'default' | 'compact' | 'dropdown'
  // 是否显示成本信息
  showCost = true,
  // 是否显示推荐标签
  showRecommendation = false,
  // 推荐上下文
  recommendContext = null
}) {
  const {
    availableModels,
    selectedModel,
    setSelectedModel,
    recommendModel
  } = useModel()

  // 当前有效的模型
  const effectiveModel = localModel || selectedModel

  // 推荐的模型
  const recommended = showRecommendation && recommendContext
    ? recommendModel(recommendContext)
    : null

  // 处理模型变更
  const handleChange = (modelId) => {
    if (onChange) {
      onChange(modelId)
    } else {
      setSelectedModel(modelId)
    }
  }

  // 获取模型显示信息
  const getModelInfo = (modelId) => {
    const model = availableModels.find(m => m.id === modelId)
    if (!model) return { name: modelId, cost: '未知' }

    return {
      name: model.name || modelId,
      cost: model.costPer1kTokens || '未知',
      icon: getModelIcon(modelId),
      description: model.description
    }
  }

  // 获取模型图标
  const getModelIcon = (modelId) => {
    if (modelId.includes('gpt')) return '🤖'
    if (modelId.includes('claude')) return '🧠'
    if (modelId.includes('deepseek')) return '🔍'
    if (modelId.includes('gemini')) return '💎'
    return '⚡'
  }

  // 紧凑版（下拉选择器）
  if (variant === 'compact' || variant === 'dropdown') {
    return (
      <div className={`model-selector model-selector-${size} model-selector-${variant}`}>
        <select
          value={effectiveModel || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="model-select"
        >
          {showGlobalOption && (
            <option value="">使用全局设置</option>
          )}
          {availableModels.map(model => (
            <option key={model.id} value={model.id}>
              {getModelIcon(model.id)} {model.name || model.id}
              {showCost && model.costPer1kTokens && ` (¥${model.costPer1kTokens}/1K)`}
              {recommended === model.id && ' ⭐ 推荐'}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // 默认版（卡片式选择）
  return (
    <div className={`model-selector model-selector-${size}`}>
      <div className="model-selector-label">
        🤖 选择模型
        {showRecommendation && recommended && (
          <span className="recommendation-hint">
            💡 推荐使用 {getModelInfo(recommended).name}
          </span>
        )}
      </div>

      <div className="model-options">
        {showGlobalOption && (
          <button
            className={`model-option ${!localModel ? 'active' : ''}`}
            onClick={() => handleChange(null)}
          >
            <div className="model-icon">🌐</div>
            <div className="model-info">
              <div className="model-name">使用全局设置</div>
              <div className="model-desc">
                当前: {getModelInfo(selectedModel).name}
              </div>
            </div>
          </button>
        )}

        {availableModels.map(model => {
          const info = getModelInfo(model.id)
          const isActive = effectiveModel === model.id
          const isRecommended = recommended === model.id

          return (
            <button
              key={model.id}
              className={`model-option ${isActive ? 'active' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => handleChange(model.id)}
            >
              <div className="model-icon">{info.icon}</div>
              <div className="model-info">
                <div className="model-name">
                  {info.name}
                  {isRecommended && <span className="badge-recommended">⭐ 推荐</span>}
                </div>
                {info.description && (
                  <div className="model-desc">{info.description}</div>
                )}
                {showCost && info.cost !== '未知' && (
                  <div className="model-cost">成本: ¥{info.cost}/1K tokens</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
