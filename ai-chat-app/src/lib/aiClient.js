const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const DEFAULT_MAX_TOKENS = 1024

/**
 * 统一的AI请求封装
 * @param {Object} params
 * @param {{role: string, content: string}[]} params.messages - 对话历史
 * @param {Object} params.modelConfig - 模型配置
 * @param {string} params.modelConfig.provider - 提供商
 * @param {string} params.modelConfig.model - 模型名称
 * @param {string} params.modelConfig.apiKey - API Key
 * @param {number} [params.modelConfig.temperature]
 * @param {number} [params.modelConfig.maxTokens]
 * @param {(token: string, fullText: string) => void} [params.onToken] - 流式回调
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
    throw new Error('请先配置对应提供商的 API 密钥')
  }

  const sanitizedMessages = sanitizeMessages(messages)

  switch (provider) {
    case 'openai':
      return callOpenAI({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    case 'anthropic':
      return callAnthropic({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    case 'google':
      return callGoogle({ messages: sanitizedMessages, model, apiKey, temperature, maxTokens, onToken, signal })
    default:
      throw new Error(`不支持的提供商：${provider}`)
  }
}

function sanitizeMessages(messages) {
  return messages
    .filter(msg => msg && typeof msg.role === 'string')
    .map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : String(msg.content ?? '')
    }))
}

async function callOpenAI({ messages, model = 'gpt-4o-mini', apiKey, temperature, maxTokens, onToken, signal }) {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: Boolean(onToken)
    }),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && Boolean(onToken)) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      const delta = event?.choices?.[0]?.delta?.content
      if (delta) {
        fullText += delta
        onToken?.(delta, fullText)
      }
    })
    return { role: 'assistant', content: fullText }
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content ?? ''
  return { role: 'assistant', content }
}

async function callAnthropic({ messages, model = 'claude-3-sonnet-20240229', apiKey, temperature, maxTokens, onToken, signal }) {
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
      stream: Boolean(onToken),
      messages: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    }),
    signal
  })

  await ensureResponseOk(response)

  if (response.body && Boolean(onToken)) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      if (event?.type === 'content_block_delta' && event?.delta?.type === 'text_delta') {
        const delta = event.delta.text ?? ''
        fullText += delta
        onToken?.(delta, fullText)
      }
      if (event?.type === 'message_delta') {
        const text = event?.delta?.text ?? ''
        if (text) {
          fullText += text
          onToken?.(text, fullText)
        }
      }
    })
    return { role: 'assistant', content: fullText }
  }

  const data = await response.json()
  const content = Array.isArray(data?.content)
    ? data.content.map(block => block?.text ?? '').join('')
    : (data?.content ?? '')
  return { role: 'assistant', content }
}

async function callGoogle({ messages, model = 'gemini-pro', apiKey, temperature, maxTokens, onToken, signal }) {
  const targetModel = model || 'gemini-pro'
  const url = onToken
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

  if (response.body && Boolean(onToken)) {
    let fullText = ''
    await processEventStream(response.body, (event) => {
      const parts = event?.candidates?.[0]?.content?.parts ?? []
      const text = parts.map(part => part?.text ?? '').join('')
      if (text) {
        fullText += text
        onToken?.(text, fullText)
      }
    }, { treatNonSSEAsJSON: true })
    return { role: 'assistant', content: fullText }
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const content = parts.map(part => part?.text ?? '').join('')
  return { role: 'assistant', content }
}

function convertMessagesToGoogleFormat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [
      {
        text: msg.content ?? ''
      }
    ]
  }))
}

async function ensureResponseOk(response) {
  if (response.ok) return
  const errorText = await safeReadResponseText(response)
  throw new Error(parseErrorMessage(errorText) || `请求失败：${response.status}`)
}

async function safeReadResponseText(response) {
  try {
    return await response.text()
  } catch (error) {
    console.error('读取响应失败', error)
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
      if (buffer.trim()) {
        if (isSSE) {
          processSSEEvent(buffer)
        } else {
          processJSONLine(buffer.trim())
        }
        buffer = ''
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
      console.error('解析SSE数据失败', error, dataString)
    }
  }

  function processJSONLine(line) {
    if (!line) return
    if (line === '[DONE]' || line === '[END]') return
    try {
      const parsed = JSON.parse(line)
      onEvent(parsed)
    } catch (error) {
      console.error('解析JSON流失败', error, line)
    }
  }
}
