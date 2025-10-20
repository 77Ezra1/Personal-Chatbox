/**
 * 全局模型选择上下文
 * 管理用户的模型选择和偏好
 */

import React, { createContext, useState, useContext, useEffect } from 'react'

const ModelContext = createContext()

export function useModel() {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModel must be used within ModelProvider')
  }
  return context
}

export function ModelProvider({ children }) {
  // 可用模型列表（从用户配置读取）
  const [availableModels, setAvailableModels] = useState([])

  // 当前选择的模型
  const [selectedModel, setSelectedModel] = useState(null)

  // 各功能的模型偏好（可选）
  const [modelPreferences, setModelPreferences] = useState({})

  // 初始化：从 localStorage 读取偏好
  useEffect(() => {
    const savedModel = localStorage.getItem('preferred_model')
    const savedPreferences = localStorage.getItem('model_preferences')

    if (savedModel) setSelectedModel(savedModel)
    if (savedPreferences) {
      setModelPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  // 保存偏好到 localStorage
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('preferred_model', selectedModel)
    }
  }, [selectedModel])

  useEffect(() => {
    localStorage.setItem('model_preferences', JSON.stringify(modelPreferences))
  }, [modelPreferences])

  // 加载用户配置的模型列表
  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetch('/api/user/models', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setAvailableModels(data.models || [])

          // 如果没有选择模型，自动选择第一个
          if (!selectedModel && data.models.length > 0) {
            setSelectedModel(data.models[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error)
      }
    }

    loadModels()
  }, [])

  /**
   * 获取特定功能应该使用的模型
   * @param {string} feature - 功能名称（如 'chat', 'notes-rewrite'）
   * @returns {string} 模型ID
   */
  const getModelForFeature = (feature) => {
    // 如果有为这个功能设置的偏好，使用它
    if (modelPreferences[feature]) {
      return modelPreferences[feature]
    }

    // 否则使用全局选择的模型
    return selectedModel
  }

  /**
   * 为特定功能设置模型偏好
   * @param {string} feature - 功能名称
   * @param {string} modelId - 模型ID，null表示使用全局设置
   */
  const setModelForFeature = (feature, modelId) => {
    setModelPreferences(prev => ({
      ...prev,
      [feature]: modelId
    }))
  }

  /**
   * 推荐模型（基于任务类型）
   * @param {object} context - 任务上下文
   * @returns {string} 推荐的模型ID
   */
  const recommendModel = (context = {}) => {
    const { task, textLength, budget } = context

    // 代码相关任务
    if (task === 'code' || task === 'code-completion') {
      const coderModel = availableModels.find(m => m.id.includes('coder'))
      if (coderModel) return coderModel.id
    }

    // 长文本任务（>10000字符）
    if (textLength > 10000) {
      const claudeModel = availableModels.find(m => m.id.includes('claude'))
      if (claudeModel) return claudeModel.id
    }

    // 低成本预算
    if (budget === 'low') {
      const cheapModel = availableModels.find(m =>
        m.id.includes('deepseek') || m.id.includes('3.5')
      )
      if (cheapModel) return cheapModel.id
    }

    // 默认返回用户选择的模型
    return selectedModel
  }

  const value = {
    // 模型列表
    availableModels,

    // 当前全局模型
    selectedModel,
    setSelectedModel,

    // 功能级别偏好
    modelPreferences,
    getModelForFeature,
    setModelForFeature,

    // 智能推荐
    recommendModel
  }

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  )
}
