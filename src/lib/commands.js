/**
 * 快捷指令系统
 * 定义所有内置指令和自定义指令的处理逻辑
 */

import { createLogger } from './logger'

const logger = createLogger('Commands')

// 指令分类
export const COMMAND_CATEGORIES = {
  GENERAL: { id: 'general', name: '常用', icon: '⚡' },
  EDIT: { id: 'edit', name: '编辑', icon: '✏️' },
  EXPORT: { id: 'export', name: '导出', icon: '📥' },
  SEARCH: { id: 'search', name: '搜索', icon: '🔍' },
  AI: { id: 'ai', name: 'AI功能', icon: '🤖' },
  CUSTOM: { id: 'custom', name: '自定义', icon: '⭐' }
}

// 内置指令定义
export const BUILT_IN_COMMANDS = [
  // ===== 常用指令 =====
  {
    id: 'help',
    name: '帮助',
    description: '显示所有可用指令',
    trigger: '/help',
    aliases: ['/h', '/?'],
    category: COMMAND_CATEGORIES.GENERAL,
    icon: '❓',
    shortcut: '',
    handler: async (context) => {
      const { showCommandHelp } = context
      showCommandHelp()
      return { success: true, message: '已显示帮助信息' }
    }
  },

  {
    id: 'clear',
    name: '清空对话',
    description: '清空当前对话的所有消息',
    trigger: '/clear',
    aliases: ['/c', '/clean'],
    category: COMMAND_CATEGORIES.GENERAL,
    icon: '🗑️',
    shortcut: 'Ctrl+Shift+Delete',
    handler: async (context) => {
      const { clearMessages, showConfirm } = context

      return new Promise((resolve) => {
        showConfirm({
          title: '清空对话',
          message: '确定要清空当前对话的所有消息吗？此操作不可撤销。',
          variant: 'danger',
          onConfirm: () => {
            clearMessages()
            resolve({ success: true, message: '对话已清空' })
          },
          onCancel: () => {
            resolve({ success: false, message: '已取消' })
          }
        })
      })
    }
  },

  {
    id: 'new',
    name: '新建对话',
    description: '创建一个新的对话',
    trigger: '/new',
    aliases: ['/n'],
    category: COMMAND_CATEGORIES.GENERAL,
    icon: '➕',
    shortcut: 'Ctrl+N',
    handler: async (context) => {
      const { createNewConversation } = context
      if (createNewConversation) {
        await createNewConversation()
        return {
          success: true,
          message: '已创建新对话'
        }
      } else {
        return {
          success: false,
          message: '创建新对话功能暂未实现'
        }
      }
    }
  },

  // ===== AI功能指令 =====
  {
    id: 'summary',
    name: '总结对话',
    description: '使用AI总结当前对话内容',
    trigger: '/summary',
    aliases: ['/sum', '/summarize'],
    category: COMMAND_CATEGORIES.AI,
    icon: '📝',
    shortcut: '',
    handler: async (context) => {
      const { sendMessage, messages } = context

      if (!messages || messages.length === 0) {
        return { success: false, message: '对话为空，无法总结' }
      }

      const summaryPrompt = '请简洁地总结一下我们到目前为止的对话内容，包括主要讨论的话题和关键要点。'

      await sendMessage(summaryPrompt)
      return { success: true, message: '正在生成对话总结...' }
    }
  },

  {
    id: 'translate',
    name: '翻译',
    description: '翻译最后一条消息到指定语言',
    trigger: '/translate',
    aliases: ['/trans', '/t'],
    category: COMMAND_CATEGORIES.AI,
    icon: '🌍',
    shortcut: '',
    parameters: [
      {
        name: 'language',
        description: '目标语言（如：英语、日语、法语）',
        required: false,
        default: '英语'
      }
    ],
    handler: async (context) => {
      const { sendMessage, messages, parameters } = context

      if (!messages || messages.length === 0) {
        return { success: false, message: '对话为空，没有可翻译的内容' }
      }

      const lastMessage = messages[messages.length - 1]

      if (!lastMessage || lastMessage.role !== 'assistant') {
        return { success: false, message: '没有可翻译的AI回复' }
      }

      const language = parameters?.language || '英语'
      const translatePrompt = `请将下面的内容翻译成${language}：\n\n${lastMessage.content}`

      await sendMessage(translatePrompt)
      return { success: true, message: `正在翻译为${language}...` }
    }
  },

  {
    id: 'code',
    name: '代码模式',
    description: '切换到代码编写和调试模式',
    trigger: '/code',
    aliases: ['/coding', '/dev'],
    category: COMMAND_CATEGORIES.AI,
    icon: '💻',
    shortcut: '',
    parameters: [
      {
        name: 'language',
        description: '编程语言（如：python, javascript, java）',
        required: false
      }
    ],
    handler: async (context) => {
      const { sendMessage, parameters } = context

      const language = parameters?.language || '通用'
      const codePrompt = `接下来我需要编写${language}代码，请以代码专家的身份帮助我。要求：
1. 提供完整可运行的代码
2. 添加详细注释
3. 遵循最佳实践
4. 考虑错误处理

准备好了请回复！`

      await sendMessage(codePrompt)
      return { success: true, message: `已切换到${language}代码模式` }
    }
  },

  {
    id: 'explain',
    name: '解释代码',
    description: '解释上一条代码回复',
    trigger: '/explain',
    aliases: ['/ex'],
    category: COMMAND_CATEGORIES.AI,
    icon: '📖',
    shortcut: '',
    handler: async (context) => {
      const { sendMessage, messages } = context

      if (!messages || messages.length === 0) {
        return { success: false, message: '对话为空，没有可解释的内容' }
      }

      const lastMessage = messages[messages.length - 1]

      if (!lastMessage || lastMessage.role !== 'assistant') {
        return { success: false, message: '没有可解释的AI回复' }
      }

      // 检查是否包含代码块
      if (!lastMessage.content.includes('```')) {
        return { success: false, message: '上一条回复不包含代码' }
      }

      const explainPrompt = '请详细解释上面代码的工作原理，包括：1) 整体逻辑 2) 关键代码段 3) 可能的改进点'

      await sendMessage(explainPrompt)
      return { success: true, message: '正在生成代码解释...' }
    }
  },

  // ===== 搜索指令 =====
  {
    id: 'search',
    name: '网络搜索',
    description: '使用AI搜索网络信息',
    trigger: '/search',
    aliases: ['/s', '/google'],
    category: COMMAND_CATEGORIES.SEARCH,
    icon: '🔍',
    shortcut: '',
    parameters: [
      {
        name: 'query',
        description: '搜索关键词',
        required: true
      }
    ],
    handler: async (context) => {
      const { sendMessage, parameters, mcpTools } = context

      if (!parameters?.query) {
        return { success: false, message: '请提供搜索关键词，例如：/search AI技术' }
      }

      // 检查是否有搜索工具
      const hasSearchTool = mcpTools?.some(tool =>
        tool.name.includes('search') || tool.name.includes('google')
      )

      if (hasSearchTool) {
        const searchPrompt = `请帮我搜索：${parameters.query}`
        await sendMessage(searchPrompt)
      } else {
        const searchPrompt = `请根据你的知识回答：${parameters.query}`
        await sendMessage(searchPrompt)
      }

      return { success: true, message: `正在搜索：${parameters.query}` }
    }
  },

  // ===== 导出指令 =====
  {
    id: 'export',
    name: '导出对话',
    description: '导出当前对话为Markdown文件',
    trigger: '/export',
    aliases: ['/download', '/save'],
    category: COMMAND_CATEGORIES.EXPORT,
    icon: '📥',
    shortcut: 'Ctrl+S',
    parameters: [
      {
        name: 'format',
        description: '导出格式（markdown, json, txt）',
        required: false,
        default: 'markdown'
      }
    ],
    handler: async (context) => {
      const { exportConversation, parameters } = context

      const format = parameters?.format || 'markdown'
      const validFormats = ['markdown', 'json', 'txt']

      if (!validFormats.includes(format)) {
        return {
          success: false,
          message: `不支持的格式：${format}。支持的格式：${validFormats.join(', ')}`
        }
      }

      await exportConversation(format)
      return { success: true, message: `正在导出为 ${format.toUpperCase()}...` }
    }
  },

  {
    id: 'copy',
    name: '复制对话',
    description: '复制当前对话内容到剪贴板',
    trigger: '/copy',
    aliases: ['/cp'],
    category: COMMAND_CATEGORIES.EXPORT,
    icon: '📋',
    shortcut: 'Ctrl+Shift+C',
    handler: async (context) => {
      const { messages } = context

      if (!messages || messages.length === 0) {
        return { success: false, message: '对话为空，无内容可复制' }
      }

      // 生成纯文本格式
      const text = messages
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n\n')

      try {
        await navigator.clipboard.writeText(text)
        return { success: true, message: '对话内容已复制到剪贴板' }
      } catch (error) {
        logger.error('复制失败:', error)
        return { success: false, message: '复制失败，请手动复制' }
      }
    }
  },

  // ===== 编辑指令 =====
  {
    id: 'retry',
    name: '重新生成',
    description: '重新生成最后一条AI回复',
    trigger: '/retry',
    aliases: ['/r', '/regenerate'],
    category: COMMAND_CATEGORIES.EDIT,
    icon: '🔄',
    shortcut: 'Ctrl+R',
    handler: async (context) => {
      const { regenerateLastMessage } = context

      await regenerateLastMessage()
      return { success: true, message: '正在重新生成回复...' }
    }
  },

  {
    id: 'edit',
    name: '编辑消息',
    description: '编辑最后一条用户消息',
    trigger: '/edit',
    aliases: ['/e'],
    category: COMMAND_CATEGORIES.EDIT,
    icon: '✏️',
    shortcut: '',
    handler: async (context) => {
      const { editLastUserMessage } = context

      editLastUserMessage()
      return { success: true, message: '进入编辑模式' }
    }
  },

  {
    id: 'undo',
    name: '撤销',
    description: '撤销最后一组消息（用户+AI）',
    trigger: '/undo',
    aliases: ['/u'],
    category: COMMAND_CATEGORIES.EDIT,
    icon: '↩️',
    shortcut: 'Ctrl+Z',
    handler: async (context) => {
      const { undoLastExchange } = context

      undoLastExchange()
      return { success: true, message: '已撤销最后一组消息' }
    }
  }
]

/**
 * 指令管理器
 */
export class CommandManager {
  constructor() {
    this.builtInCommands = BUILT_IN_COMMANDS
    this.customCommands = this.loadCustomCommands()
  }

  /**
   * 获取所有指令
   */
  getAllCommands() {
    return [...this.builtInCommands, ...this.customCommands]
  }

  /**
   * 根据触发词查找指令
   */
  findCommand(trigger) {
    const allCommands = this.getAllCommands()
    return allCommands.find(cmd =>
      cmd.trigger === trigger || cmd.aliases?.includes(trigger)
    )
  }

  /**
   * 搜索指令
   */
  searchCommands(query) {
    if (!query) return this.getAllCommands()

    const lowerQuery = query.toLowerCase()
    return this.getAllCommands().filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.trigger.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 按分类获取指令
   */
  getCommandsByCategory(categoryId) {
    return this.getAllCommands().filter(cmd =>
      cmd.category.id === categoryId
    )
  }

  /**
   * 执行指令
   */
  async executeCommand(trigger, parameters, context) {
    const command = this.findCommand(trigger)

    if (!command) {
      return {
        success: false,
        message: `未找到指令：${trigger}`
      }
    }

    logger.log(`执行指令：${command.name}`, { trigger, parameters })

    try {
      const result = await command.handler({
        ...context,
        parameters
      })

      logger.log(`指令执行完成：${command.name}`, result)
      return result
    } catch (error) {
      logger.error(`指令执行失败：${command.name}`, error)
      return {
        success: false,
        message: `指令执行失败：${error.message}`
      }
    }
  }

  /**
   * 解析指令输入
   * 例如："/translate 英语" => { trigger: '/translate', parameters: { language: '英语' } }
   */
  parseCommandInput(input) {
    const parts = input.trim().split(/\s+/)
    const trigger = parts[0]
    const args = parts.slice(1)

    const command = this.findCommand(trigger)
    if (!command) {
      return null
    }

    // 解析参数
    const parameters = {}
    if (command.parameters) {
      command.parameters.forEach((param, index) => {
        if (args[index]) {
          parameters[param.name] = args[index]
        } else if (param.required) {
          throw new Error(`缺少必需参数：${param.name}`)
        } else if (param.default) {
          parameters[param.name] = param.default
        }
      })
    } else if (args.length > 0) {
      // 如果没有定义参数但有输入，作为query参数
      parameters.query = args.join(' ')
    }

    return {
      command,
      trigger,
      parameters
    }
  }

  /**
   * 加载自定义指令
   */
  loadCustomCommands() {
    try {
      const saved = localStorage.getItem('customCommands')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      logger.error('加载自定义指令失败:', error)
      return []
    }
  }

  /**
   * 保存自定义指令
   */
  saveCustomCommands() {
    try {
      localStorage.setItem('customCommands', JSON.stringify(this.customCommands))
    } catch (error) {
      logger.error('保存自定义指令失败:', error)
    }
  }

  /**
   * 添加自定义指令
   */
  addCustomCommand(command) {
    // 验证
    if (!command.id || !command.name || !command.trigger) {
      throw new Error('指令缺少必需字段')
    }

    // 检查触发词冲突
    const existing = this.findCommand(command.trigger)
    if (existing) {
      throw new Error(`触发词已存在：${command.trigger}`)
    }

    // 添加到自定义指令
    this.customCommands.push({
      ...command,
      category: COMMAND_CATEGORIES.CUSTOM,
      custom: true
    })

    this.saveCustomCommands()
    logger.log('添加自定义指令:', command.name)
  }

  /**
   * 删除自定义指令
   */
  removeCustomCommand(id) {
    const index = this.customCommands.findIndex(cmd => cmd.id === id)
    if (index === -1) {
      throw new Error('指令不存在')
    }

    this.customCommands.splice(index, 1)
    this.saveCustomCommands()
    logger.log('删除自定义指令:', id)
  }
}

// 创建全局指令管理器实例
export const commandManager = new CommandManager()

