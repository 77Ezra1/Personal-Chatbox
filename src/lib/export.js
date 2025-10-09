/**
 * 对话导出工具函数
 * 支持导出为 Markdown, TXT, JSON 格式
 */

/**
 * 导出对话为 Markdown 格式
 * @param {Object} conversation - 对话对象
 * @returns {string} Markdown 格式的文本
 */
export function exportToMarkdown(conversation) {
  if (!conversation) return ''

  const { title, messages, createdAt } = conversation
  const date = new Date(createdAt).toLocaleString('zh-CN')

  let markdown = `# ${title}\n\n`
  markdown += `**创建时间**: ${date}\n\n`
  markdown += `---\n\n`

  messages.forEach((message) => {
    const role = message.role === 'user' ? '👤 用户' : '🤖 AI'
    markdown += `## ${role}\n\n`
    
    // 添加消息内容
    markdown += `${message.content}\n\n`

    // 如果有思考过程
    if (message.metadata?.reasoning) {
      markdown += `<details>\n`
      markdown += `<summary>💭 思考过程</summary>\n\n`
      markdown += `${message.metadata.reasoning}\n\n`
      markdown += `</details>\n\n`
    }

    // 如果有附件
    if (message.attachments && message.attachments.length > 0) {
      markdown += `**附件**: ${message.attachments.length} 个\n\n`
    }

    // 如果被编辑过
    if (message.edited) {
      markdown += `*（已编辑）*\n\n`
    }

    markdown += `---\n\n`
  })

  return markdown
}

/**
 * 导出对话为纯文本格式
 * @param {Object} conversation - 对话对象
 * @returns {string} 纯文本
 */
export function exportToText(conversation) {
  if (!conversation) return ''

  const { title, messages, createdAt } = conversation
  const date = new Date(createdAt).toLocaleString('zh-CN')

  let text = `${title}\n`
  text += `创建时间: ${date}\n`
  text += `${'='.repeat(50)}\n\n`

  messages.forEach((message) => {
    const role = message.role === 'user' ? '用户' : 'AI'
    text += `[${role}]\n`
    text += `${message.content}\n`

    if (message.metadata?.reasoning) {
      text += `\n[思考过程]\n`
      text += `${message.metadata.reasoning}\n`
    }

    if (message.edited) {
      text += `(已编辑)\n`
    }

    text += `\n${'-'.repeat(50)}\n\n`
  })

  return text
}

/**
 * 导出对话为 JSON 格式
 * @param {Object} conversation - 对话对象
 * @returns {string} JSON 字符串
 */
export function exportToJSON(conversation) {
  if (!conversation) return '{}'

  return JSON.stringify(conversation, null, 2)
}

/**
 * 下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // 降级方案
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
      return false
    }
  }
}

/**
 * 生成安全的文件名
 * @param {string} title - 对话标题
 * @param {string} extension - 文件扩展名
 * @returns {string} 安全的文件名
 */
export function generateFilename(title, extension) {
  // 移除不安全的字符
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
  
  const timestamp = new Date().toISOString().split('T')[0]
  return `${safeTitle}_${timestamp}.${extension}`
}

/**
 * 导出对话 - 统一接口
 * @param {Object} conversation - 对话对象
 * @param {string} format - 导出格式 ('markdown', 'text', 'json')
 */
export function exportConversation(conversation, format = 'markdown') {
  if (!conversation) {
    throw new Error('No conversation to export')
  }

  let content, filename, mimeType

  switch (format) {
    case 'markdown':
      content = exportToMarkdown(conversation)
      filename = generateFilename(conversation.title, 'md')
      mimeType = 'text/markdown'
      break

    case 'text':
      content = exportToText(conversation)
      filename = generateFilename(conversation.title, 'txt')
      mimeType = 'text/plain'
      break

    case 'json':
      content = exportToJSON(conversation)
      filename = generateFilename(conversation.title, 'json')
      mimeType = 'application/json'
      break

    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  downloadFile(content, filename, mimeType)
}

/**
 * 复制对话到剪贴板
 * @param {Object} conversation - 对话对象
 * @param {string} format - 格式 ('markdown', 'text')
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyConversation(conversation, format = 'markdown') {
  if (!conversation) {
    return false
  }

  let content

  switch (format) {
    case 'markdown':
      content = exportToMarkdown(conversation)
      break

    case 'text':
      content = exportToText(conversation)
      break

    default:
      content = exportToText(conversation)
  }

  return await copyToClipboard(content)
}

