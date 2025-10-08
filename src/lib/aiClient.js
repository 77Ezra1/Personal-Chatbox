const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const VOLCENGINE_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const OPENAI_COMPATIBLE_PROVIDER_CONFIG = {
  openai: {
    endpoint: OPENAI_URL,
    defaultModel: 'gpt-4o-mini',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  moonshot: {
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'mixtral-8x7b-32768',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  mistral: {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  together: {
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  }
}

const DEFAULT_MAX_TOKENS = 1024
const TEXT_MIME_PREFIXES = [
  'text/',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/graphql',
  'application/sql',
  'application/csv',
  'application/rtf'
]

function normalizeReasoningContent(value) {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (Array.isArray(value)) {
    const joined = value
      .map(normalizeReasoningContent)
      .filter(Boolean)
      .join('\n')
      .trim()
    return joined.length > 0 ? joined : null
  }
  if (typeof value === 'object') {
    if (typeof value.text === 'string') {
      return normalizeReasoningContent(value.text)
    }
    if (Array.isArray(value.content)) {
      return normalizeReasoningContent(value.content)
    }
    const collected = Object.values(value)
      .map(normalizeReasoningContent)
      .filter(Boolean)
      .join('\n')
      .trim()
    return collected.length > 0 ? collected : null
  }
  return null
}

function formatAttachmentSize(bytes = 0) {
  if (!bytes || Number.isNaN(bytes)) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const formatted = size % 1 === 0 ? size : size.toFixed(1)
  return `${formatted}${units[unitIndex]}`
}

function decodeBase64ToUtf8(base64String) {
  try {
    if (typeof atob === 'function') {
      const binary = atob(base64String)
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
      const decoder = new TextDecoder('utf-8', { fatal: false })
      return decoder.decode(bytes)
    }
  } catch {
    // ignore
  }
  const nodeBuffer = typeof globalThis !== 'undefined' && globalThis.Buffer
    ? globalThis.Buffer
    : undefined
  if (nodeBuffer) {
    try {
      return nodeBuffer.from(base64String, 'base64').toString('utf-8')
    } catch {
      return ''
    }
  }
  return ''
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl.trim())
  if (!match) return null
  const [, mimeType, base64Payload] = match
  if (!mimeType || !base64Payload) return null
  return { mimeType, base64Payload }
}

function extractDataSnippet(attachment, maxLength) {
  const parsed = parseDataUrl(attachment?.dataUrl)
  if (!parsed) return null
  const { mimeType, base64Payload } = parsed

  const appliesLengthLimit = typeof maxLength === 'number' && maxLength > 0
  const isTextual = TEXT_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))

  if (isTextual) {
    const decoded = decodeBase64ToUtf8(base64Payload)
    if (!decoded) return null
    const truncated = appliesLengthLimit && decoded.length > maxLength
    const snippet = truncated ? `${decoded.slice(0, maxLength)}...` : decoded
    return {
      label: truncated ? 'Text preview (truncated)' : 'Text preview',
      content: snippet
    }
  }
  return null
}

function buildAttachmentPrompt(attachments = [], options = {}) {
  const { includeDataUrl = false, maxDataUrlLength = 0 } = options
  return attachments
    .map((attachment, index) => {
      const name = attachment?.name || `Attachment ${index + 1}`
      const type = attachment?.type || 'application/octet-stream'
      const size = formatAttachmentSize(Number(attachment?.size) || 0)
      const lines = [`${index + 1}. ${name} (${type}, ${size})`]
      if (includeDataUrl) {
        const snippetInfo = extractDataSnippet(
          attachment,
          typeof maxDataUrlLength === 'number' && maxDataUrlLength > 0 ? maxDataUrlLength : undefined
        )
        if (snippetInfo?.content) {
          lines.push(`${snippetInfo.label}:`)
          lines.push(snippetInfo.content)
        }
      }
      return lines.join('\n')
    })
    .join('\n')
}

function buildAttachmentSummaryText(attachment, options = {}) {
  const { maxTextLength = 2000 } = options
  const name = attachment?.name || 'Attachment'
  const type = attachment?.type || 'application/octet-stream'
  const size = formatAttachmentSize(Number(attachment?.size) || 0)
  const header = `[File Attachment]\n${name} (${type}, ${size})`
  const snippet = extractDataSnippet(attachment, maxTextLength)
  if (snippet?.content) {
    return `${header}\n\n${snippet.label}: ${snippet.content}`
  }
  return `${header}\n\nPreview unavailable in text.`
}

/**
 * Unified AI request helper.
 * @param {Object} params
 * @param {{role: string, content: string, metadata?: any}[]} params.messages Conversation history
 * @param {Object} params.modelConfig Model configuration
 * @param {string} params.modelConfig.provider Provider id
 * @param {string} params.modelConfig.model Model name
 * @param {string} params.modelConfig.apiKey API key
 * @param {number} [params.modelConfig.temperature]
 * @param {number} [params.modelConfig.maxTokens]
 * @param {(token: string, fullText: string) => void} [params.onToken] Streaming callback
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{role: string, content: string}>}
 */
export async function generateAIResponse({ messages = [], modelConfig = {}, onToken, signal }) {
  const {
    provider = 'openai',
    model,
    apiKey,
    temperature = 0.7,
    maxTokens = DEFAULT_MAX_TOKENS
  } = modelConfig

  if (!apiKey) {
    throw new Error('Please configure the API key for the selected provider first.')
  }

  const sanitizedMessages = sanitizeMessages(messages)

  const openAICompatibleConfig = OPENAI_COMPATIBLE_PROVIDER_CONFIG[provider]
  if (openAICompatibleConfig) {
    return callOpenAICompatible({
      messages: sanitizedMessages,
      model: model || openAICompatibleConfig.defaultModel,
      apiKey,
      temperature,
      maxTokens,
      onToken,
      signal,
      endpoint: openAICompatibleConfig.endpoint,
      headersBuilder: openAICompatibleConfig.headers
    })
  }

  switch (provider) {
    case 'anthropic':
      return callAnthropic({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    case 'google':
      return callGoogle({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    case 'volcengine':
      return callVolcengine({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

function sanitizeMessages(messages) {
  return messages
    .filter(msg => msg && typeof msg.role === 'string')
    .map(msg => {
      const baseContent = typeof msg.content === 'string' ? msg.content : String(msg.content ?? '')
      const rawAttachments = Array.isArray(msg.attachments)
        ? msg.attachments
        : Array.isArray(msg?.metadata?.attachments)
          ? msg.metadata.attachments
          : []
      const attachments = rawAttachments
        .map(attachment => {
          if (!attachment || typeof attachment !== 'object') return null
          const type = typeof attachment.type === 'string' ? attachment.type : ''
          const dataUrl = typeof attachment.dataUrl === 'string' ? attachment.dataUrl : ''
          const category = typeof attachment.category === 'string'
            ? attachment.category
            : type.startsWith('image/')
              ? 'image'
              : 'file'
          return {
            id: attachment.id ?? undefined,
            name: attachment.name ?? '',
            type,
            size: Number(attachment.size) || 0,
            dataUrl,
            lastModified: attachment.lastModified ?? undefined,
            category
          }
        })
        .filter(Boolean)
      return {
        role: msg.role,
        content: baseContent,
        attachments
      }
    })
}

async function callOpenAICompatible({
  messages,
  model,
  apiKey,
  temperature,
  maxTokens,
  onToken,
  signal,
  endpoint,
  headersBuilder = (key) => ({ Authorization: `Bearer ${key}` })
}) {
  const shouldStream = !!onToken

  const payloadMessages = messages.map(msg => {
    const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
    const imageAttachments = attachments.filter(att => att?.dataUrl && (att?.category === 'image' || att?.type?.startsWith('image/')))
    const otherAttachments = attachments.filter(att => !imageAttachments.includes(att))

    const parts = []
    if (msg.content?.trim()) {
      parts.push({
        type: 'input_text',
        text: msg.content
      })
    }

    otherAttachments.forEach(attachment => {
      const summary = buildAttachmentSummaryText(attachment, { maxTextLength: 1600 })
      parts.push({
        type: 'input_text',
        text: summary
      })
    })

    imageAttachments.forEach(attachment => {
      parts.push({
        type: 'input_image_url',
        image_url: {
          url: attachment.dataUrl,
          detail: 'auto'
        }
      })
    })

    if (parts.length === 1 && parts[0].type === 'input_text') {
      return {
        role: msg.role,
        content: parts[0].text
      }
    }

    return {
      role: msg.role,
      content: parts
    }
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headersBuilder(apiKey)
    },
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      temperature,
      max_tokens: maxTokens,
      stream: shouldStream
    }),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && shouldStream) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      const deltaText = extractOpenAIText(event?.choices?.[0]?.delta?.content)
      if (deltaText) {
        fullText += deltaText
        onToken?.(deltaText, fullText)
      }
    })
    return { role: 'assistant', content: fullText, raw: null, reasoning: null }
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message ?? {}
  const content = extractOpenAIText(message?.content)
  const reasoning = normalizeReasoningContent(message?.reasoning)
  return { role: 'assistant', content, raw: data, reasoning }
}

function extractOpenAIText(content) {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (!part) return ''
        if (typeof part === 'string') return part
        if (typeof part === 'object') {
          if (typeof part.text === 'string') return part.text
          if (typeof part?.content === 'string') return part.content
        }
        return ''
      })
      .join('')
  }
  if (typeof content === 'object' && typeof content.text === 'string') {
    return content.text
  }
  return ''
}

async function callAnthropic({ messages, model = 'claude-3-sonnet-20240229', apiKey, temperature, maxTokens, onToken, signal }) {
  const shouldStream = !!onToken
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      stream: shouldStream,
      messages: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: buildAnthropicContentParts(msg)
      }))
    }),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && shouldStream) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      if (event?.type === 'content_block_delta' && event?.delta?.type === 'text_delta') {
        const delta = event.delta.text ?? ''
        if (delta) {
          fullText += delta
          onToken?.(delta, fullText)
        }
      }
      if (event?.type === 'message_delta') {
        const text = event?.delta?.text ?? ''
        if (text) {
          fullText += text
          onToken?.(text, fullText)
        }
      }
    })
    return { role: 'assistant', content: fullText, raw: null, reasoning: null }
  }

  const data = await response.json()
  const content = Array.isArray(data?.content)
    ? data.content.map(block => block?.text ?? '').join('')
    : (data?.content ?? '')
  const reasoning = normalizeReasoningContent(data?.reasoning)
  return { role: 'assistant', content, raw: data, reasoning }
}

async function callGoogle({ messages, model = 'gemini-pro', apiKey, temperature, maxTokens, onToken, signal }) {
  const targetModel = model || 'gemini-pro'
  const shouldStream = !!onToken
  const url = shouldStream
    ? `${GOOGLE_BASE_URL}/${encodeURIComponent(targetModel)}:streamGenerateContent?key=${apiKey}`
    : `${GOOGLE_BASE_URL}/${encodeURIComponent(targetModel)}:generateContent?key=${apiKey}`

  const payload = {
    contents: convertMessagesToGoogleFormat(messages),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && shouldStream) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      const parts = event?.candidates?.[0]?.content?.parts ?? []
      const text = parts.map(part => part?.text ?? '').join('')
      if (text) {
        fullText += text
        onToken?.(text, fullText)
      }
    }, { treatNonSSEAsJSON: true })
    return { role: 'assistant', content: fullText, raw: null, reasoning: null }
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const content = parts.map(part => part?.text ?? '').join('')
  const reasoning = normalizeReasoningContent(data?.candidates?.[0]?.content?.thoughts)
  return { role: 'assistant', content, raw: data, reasoning }
}

function convertMessagesToGoogleFormat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  return messages.map(msg => {
    const parts = []
    const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
    const hasAttachments = attachments.length > 0
    const summary = hasAttachments
      ? `[File Attachment]\n${buildAttachmentPrompt(attachments)}`
      : ''

    const baseText = msg.content ?? ''
    const combinedText = summary
      ? baseText?.trim()
        ? `${baseText}\n\n${summary}`
        : summary
      : baseText

    if (combinedText?.trim()) {
      parts.push({ text: combinedText })
    }

    const imageAttachments = attachments.filter(att => att?.dataUrl && (att?.category === 'image' || att?.type?.startsWith('image/')))
    imageAttachments.forEach(attachment => {
      const match = /^data:(.+?);base64,(.+)$/.exec(attachment.dataUrl.trim())
      if (!match) return
      const [, mimeType, base64Data] = match
      if (!mimeType || !base64Data) return
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      })
    })

    if (parts.length === 0) {
      parts.push({ text: '' })
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts
    }
  })
}

async function callVolcengine({ messages, model = 'doubao-pro-32k', apiKey, temperature, maxTokens, onToken, signal }) {
  if (!model) {
    throw new Error('Please provide a Volcano Engine model ID.')
  }

  const payload = {
    model,
    messages: convertMessagesToVolcengineFormat(messages),
    temperature,
    max_tokens: maxTokens,
    stream: !!onToken
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }

  if (onToken) {
    headers.Accept = 'text/event-stream'
  }

  const response = await fetch(VOLCENGINE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && onToken) {
    let fullText = ''
    const reasoningChunks = []
    const seenReasoning = new Set()

    await processEventStream(response.body, (event) => {
      const text = extractVolcengineText(event)
      if (text) {
        fullText += text
        onToken?.(text, fullText)
      }

      const reasoningDelta = extractVolcengineReasoning(event)
      const normalizedReasoning = normalizeReasoningContent(reasoningDelta)
      if (normalizedReasoning && !seenReasoning.has(normalizedReasoning)) {
        seenReasoning.add(normalizedReasoning)
        reasoningChunks.push(normalizedReasoning)
      }
    }, { treatNonSSEAsJSON: true })

    const reasoning = normalizeReasoningContent(reasoningChunks)
    return { role: 'assistant', content: fullText, raw: null, reasoning, streaming: true }
  }

  const data = await response.json()
  const content = extractVolcengineText(data, true)
  if (!content) {
    console.warn('[AI] Volcano Engine response did not include text content', data)
  }
  const reasoning = normalizeReasoningContent(extractVolcengineReasoning(data))
  return { role: 'assistant', content, raw: data, reasoning }
}

function convertMessagesToVolcengineFormat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  return messages.map(msg => {
    const blocks = []

    if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
      blocks.push({
        type: 'text',
        text: msg.content
      })
    }

    const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
    attachments.forEach(attachment => {
      const parsed = parseDataUrl(attachment?.dataUrl)
      const mimeType = parsed?.mimeType || attachment?.type || ''
      const isImage = attachment?.category === 'image' || (mimeType && mimeType.startsWith('image/'))

    if (parsed && isImage) {
      blocks.push({
        type: 'image_url',
        image_url: attachment.dataUrl
      })
      return
    }

      const summaryText = buildAttachmentSummaryText(attachment, { maxTextLength: 2000 })
      blocks.push({
        type: 'text',
        text: summaryText
      })
    })

    if (blocks.length === 0) {
      blocks.push({ type: 'text', text: '' })
    }

    return {
      role: normalizeVolcengineRole(msg.role),
      content: blocks
    }
  })
}

function normalizeVolcengineRole(role) {
  if (role === 'assistant' || role === 'system' || role === 'user') {
    return role
  }
  return role === 'model' ? 'assistant' : 'user'
}

function extractVolcengineText(payload, useMessage = false) {
  if (!payload) return ''
  const buckets = collectVolcengineBuckets(payload, useMessage)
  if (!buckets.length) return ''
  return buckets.join('')
}

function extractVolcengineReasoning(payload) {
  if (!payload) return ''

  const reasoningTexts = []
  const pushReasoning = (value) => {
    const text = collectVolcengineContent(value)
    if (text) {
      reasoningTexts.push(text)
    }
  }

  const candidates = [
    payload?.choices,
    payload?.payload?.choices,
    payload?.result?.choices,
    payload?.data?.choices
  ].filter(Array.isArray)

  candidates.forEach(choiceList => {
    choiceList.forEach(choice => {
      pushReasoning(choice?.message?.reasoning_content)
      pushReasoning(choice?.reasoning_content)
      pushReasoning(choice?.delta?.reasoning_content)
    })
  })

  pushReasoning(payload?.reasoning_content)
  pushReasoning(payload?.message?.reasoning_content)
  pushReasoning(payload?.payload?.reasoning_content)
  pushReasoning(payload?.result?.reasoning_content)

  return reasoningTexts.join('\n')
}

function collectVolcengineBuckets(payload, useMessage = false) {
  const texts = []
  const pushText = (value) => {
    const text = collectVolcengineContent(value)
    if (text) {
      texts.push(text)
    }
  }

  const candidates = [
    payload?.choices,
    payload?.payload?.choices,
    payload?.result?.choices,
    payload?.data?.choices
  ].filter(Array.isArray)

  candidates.forEach(choiceList => {
    choiceList.forEach(choice => {
      if (useMessage) {
        pushText(choice?.message)
      } else {
        pushText(choice?.delta)
        pushText(choice?.message)
      }
      pushText(choice?.output_text)
      pushText(choice?.text)
    })
  })

  pushText(payload?.output_text)
  pushText(payload?.payload?.output_text)
  pushText(payload?.result?.output_text)
  pushText(payload?.message)

  return texts
}

function collectVolcengineContent(content, seen = new WeakSet()) {
  if (!content) return ''

  if (typeof content === 'string') {
    return content
  }

  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content)
  }

  if (Array.isArray(content)) {
    return content.map(item => collectVolcengineContent(item, seen)).join('')
  }

  if (typeof content === 'object') {
    if (seen.has(content)) return ''
    seen.add(content)

    let result = ''
    if (typeof content.text === 'string') {
      result += content.text
    } else {
      result += collectVolcengineContent(content.text, seen)
    }

    if ('output_text' in content) {
      result += collectVolcengineContent(content.output_text, seen)
    }
    if ('content' in content) {
      result += collectVolcengineContent(content.content, seen)
    }
    if ('delta' in content) {
      result += collectVolcengineContent(content.delta, seen)
    }
    if ('message' in content) {
      result += collectVolcengineContent(content.message, seen)
    }
    if ('result' in content) {
      result += collectVolcengineContent(content.result, seen)
    }
    if ('payload' in content) {
      result += collectVolcengineContent(content.payload, seen)
    }
    if ('data' in content) {
      result += collectVolcengineContent(content.data, seen)
    }
    if ('choices' in content && Array.isArray(content.choices)) {
      result += collectVolcengineContent(content.choices, seen)
    }

    return result
  }

  return ''
}

async function ensureResponseOk(response) {
  if (response.ok) return
  const errorText = await safeReadResponseText(response)
  throw new Error(parseErrorMessage(errorText) || `Request failed: ${response.status}`)
}

async function safeReadResponseText(response) {
  try {
    return await response.text()
  } catch (error) {
    console.error('Failed to read response', error)
    return ''
  }
}

function parseErrorMessage(raw) {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    return parsed?.error?.message || parsed?.message || ''
  } catch {
    return raw
  }
}

async function processEventStream(readable, onEvent, options = {}) {
  const { treatNonSSEAsJSON = false } = options
  const reader = readable.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let isSSE = !treatNonSSEAsJSON
  let firstChunk = true

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      const remaining = buffer.trim()
      if (remaining) {
        if (isSSE) {
          processSSEEvent(remaining)
        } else {
          processJSONLine(remaining)
        }
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })

    if (treatNonSSEAsJSON && firstChunk) {
      if (buffer.includes('data:')) {
        isSSE = true
      } else {
        isSSE = false
      }
      firstChunk = false
    }

    flushBuffer()
  }

  function flushBuffer() {
    if (isSSE) {
      let boundary
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const eventStr = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        processSSEEvent(eventStr)
      }
    } else {
      let newline
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        processJSONLine(line)
      }
    }
  }

  function processSSEEvent(eventStr) {
    const dataLines = eventStr
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())

    const dataString = dataLines.join('\n')
    if (!dataString) return
    if (dataString === '[DONE]' || dataString === '[END]') return
    try {
      const parsed = JSON.parse(dataString)
      onEvent(parsed)
    } catch (error) {
      console.error('Failed to parse SSE payload', error, dataString)
    }
  }

  function processJSONLine(line) {
    if (!line) return
    if (line === '[DONE]' || line === '[END]') return
    try {
      const parsed = JSON.parse(line)
      onEvent(parsed)
    } catch (error) {
      console.error('Failed to parse JSON stream payload', error, line)
    }
  }
}
function buildAnthropicContentParts(msg) {
  const parts = []
  const hasContent = typeof msg.content === 'string' && msg.content.trim().length > 0
  if (hasContent) {
    parts.push({ type: 'text', text: msg.content })
  }

  const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
  attachments.forEach(attachment => {
    const parsed = parseDataUrl(attachment?.dataUrl)
    const mimeType = parsed?.mimeType || attachment?.type || ''
    const isImage = attachment?.category === 'image' || (mimeType && mimeType.startsWith('image/'))

    if (parsed && isImage) {
      parts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: parsed.base64Payload
        }
      })
      return
    }

    const summaryText = buildAttachmentSummaryText(attachment, { maxTextLength: 4000 })
    parts.push({ type: 'text', text: summaryText })
  })

  if (parts.length === 0) {
    parts.push({ type: 'text', text: '' })
  }

  return parts
}
