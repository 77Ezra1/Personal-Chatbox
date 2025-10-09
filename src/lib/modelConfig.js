import { 
  CUSTOM_MODELS_KEY, 
  MODEL_CONFIG_KEY, 
  FALLBACK_PROVIDER,
  DEFAULT_MODEL_SETTINGS,
  getDefaultModel
} from './constants'
import { toNumber, cloneState } from './utils'

/**
 * 清理模型设置
 */
export const sanitizeModelSettings = (settings = {}) => ({
  apiKey: typeof settings.apiKey === 'string' ? settings.apiKey : DEFAULT_MODEL_SETTINGS.apiKey,
  temperature: toNumber(settings.temperature, DEFAULT_MODEL_SETTINGS.temperature),
  maxTokens: toNumber(settings.maxTokens, DEFAULT_MODEL_SETTINGS.maxTokens),
  supportsDeepThinking: typeof settings.supportsDeepThinking === 'boolean' 
    ? settings.supportsDeepThinking 
    : DEFAULT_MODEL_SETTINGS.supportsDeepThinking
})

/**
 * 确保提供商条目存在
 */
export const ensureProviderEntry = (state, provider, customModels = {}) => {
  let entry = state[provider]
  if (!entry || typeof entry !== 'object') {
    entry = { activeModel: '', models: {} }
  }
  if (!entry.models || typeof entry.models !== 'object') {
    entry.models = {}
  }
  if (typeof entry.activeModel !== 'string' || !entry.activeModel) {
    entry.activeModel = getDefaultModel(provider, customModels)
  }
  state[provider] = entry
  return entry
}

/**
 * 确保模型条目存在
 */
export const ensureModelEntry = (state, provider, modelName, customModels = {}) => {
  const entry = ensureProviderEntry(state, provider, customModels)
  const targetModel = modelName || entry.activeModel || getDefaultModel(provider, customModels)
  if (!entry.models[targetModel]) {
    entry.models[targetModel] = sanitizeModelSettings()
  } else {
    entry.models[targetModel] = sanitizeModelSettings(entry.models[targetModel])
  }
  entry.activeModel = targetModel
  state[provider] = entry
  return { entry, model: targetModel }
}

/**
 * 从状态构建模型配置
 */
export const buildModelConfigFromState = (state, provider, modelName, customModels = {}) => {
  const { entry, model } = ensureModelEntry(state, provider, modelName, customModels)
  const settings = sanitizeModelSettings(entry.models[model])
  entry.models[model] = settings
  entry.activeModel = model
  state[provider] = entry
  return { provider, model, ...settings }
}

/**
 * 应用模型设置
 */
export const applyModelSettings = (state, provider, modelName, customModels = {}, updates = {}) => {
  const { entry, model } = ensureModelEntry(state, provider, modelName, customModels)
  const existing = entry.models[model]
  const next = typeof updates === 'function' ? updates(existing) : { ...existing, ...updates }
  const sanitized = sanitizeModelSettings(next)
  entry.models[model] = sanitized
  entry.activeModel = model
  state[provider] = entry
  return sanitized
}

/**
 * 加载存储的自定义模型
 */
export const loadStoredCustomModels = () => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = window.localStorage.getItem(CUSTOM_MODELS_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 加载存储的模型状态
 */
export const loadStoredModelState = (customModels) => {
  const fallbackModel = getDefaultModel(FALLBACK_PROVIDER, customModels)
  const baseProviders = {
    [FALLBACK_PROVIDER]: {
      activeModel: fallbackModel,
      models: {
        [fallbackModel]: sanitizeModelSettings()
      }
    }
  }

  if (typeof window === 'undefined') {
    return {
      initialProvider: FALLBACK_PROVIDER,
      initialModel: fallbackModel,
      savedProviders: cloneState(baseProviders)
    }
  }

  try {
    const stored = window.localStorage.getItem(MODEL_CONFIG_KEY)
    if (!stored) {
      return {
        initialProvider: FALLBACK_PROVIDER,
        initialModel: fallbackModel,
        savedProviders: cloneState(baseProviders)
      }
    }

    const parsed = JSON.parse(stored)
    const providersInput =
      parsed && typeof parsed === 'object' && parsed.providers && typeof parsed.providers === 'object'
        ? parsed.providers
        : parsed && typeof parsed === 'object' && parsed.configs && typeof parsed.configs === 'object'
          ? parsed.configs
          : {}

    const normalizedProviders = {}

    Object.entries(providersInput).forEach(([provider, value]) => {
      if (!provider) return
      const activeModelRaw = typeof value?.activeModel === 'string' ? value.activeModel : ''
      const modelsRaw = value?.models && typeof value.models === 'object' ? value.models : {}
      const models = {}
      Object.entries(modelsRaw).forEach(([model, settings]) => {
        if (!model) return
        models[model] = sanitizeModelSettings(settings)
      })
      let activeModel = activeModelRaw
      if (!activeModel || !models[activeModel]) {
        activeModel = getDefaultModel(provider, customModels)
      }
      if (!models[activeModel]) {
        models[activeModel] = sanitizeModelSettings()
      }
      normalizedProviders[provider] = { activeModel, models }
    })

    if (!normalizedProviders[FALLBACK_PROVIDER]) {
      normalizedProviders[FALLBACK_PROVIDER] = cloneState(baseProviders[FALLBACK_PROVIDER])
    }

    let initialProvider = FALLBACK_PROVIDER
    if (
      typeof parsed?.lastProvider === 'string' &&
      normalizedProviders[parsed.lastProvider]
    ) {
      initialProvider = parsed.lastProvider
    } else {
      const providerKeys = Object.keys(normalizedProviders)
      if (providerKeys.length > 0) {
        initialProvider = providerKeys[0]
      }
    }

    return {
      initialProvider,
      initialModel:
        normalizedProviders[initialProvider]?.activeModel ??
        getDefaultModel(initialProvider, customModels),
      savedProviders: normalizedProviders
    }
  } catch {
    return {
      initialProvider: FALLBACK_PROVIDER,
      initialModel: fallbackModel,
      savedProviders: cloneState(baseProviders)
    }
  }
}

