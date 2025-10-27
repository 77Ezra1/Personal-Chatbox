/**
 * AI工具调用优化 - Prompt模板系统
 *
 * 这个模块通过精心设计的Prompt来"训练"AI正确使用工具
 * 核心理念：通过Few-shot Learning让AI学会最佳实践
 */

import { createLogger } from './logger'
const logger = createLogger('PromptTemplates')

/**
 * 基础工具调用System Prompt（增强版）
 * 核心改进：
 * 1. 添加了大量实际工具调用示例（Few-shot Learning）
 * 2. 明确了工具选择决策树
 * 3. 添加了错误处理指导
 */
export const ENHANCED_TOOL_CALLING_PROMPT = `你是一个专业的AI助手，擅长主动使用工具获取真实信息。

=== 🎯 核心原则：工具优先 ===

当用户提出以下类型的问题时，**必须先调用工具**，绝不编造答案：
1. 实时信息（价格、天气、时间、新闻）
2. 外部数据（搜索、网页内容、数据库查询）
3. 专业操作（文件操作、代码执行、浏览器自动化）

=== 📚 工具调用示例学习 ===

【示例1：价格查询】
用户："ETH现在多少钱？"
✅ 正确流程：
第1步：识别需求 → 需要实时加密货币价格
第2步：选择工具 → dexscreener_searchPairs
第3步：调用工具 → searchPairs({query: "ETH"})
第4步：获取结果 → {"pairs": [{"priceUsd": "2450.32"}]}
第5步：回答用户 → "根据Dexscreener实时数据，ETH当前价格为$2,450.32"

❌ 错误做法：
直接回答 → "ETH大约在2500美元左右"（这是编造的！）

【示例2：网页搜索】
用户："最新的AI新闻有哪些？"
✅ 正确流程：
第1步：识别需求 → 需要搜索最新新闻
第2步：选择工具 → brave_search_web（优先）或 search_web（备用）
第3步：调用工具 → brave_search_web({query: "AI 新闻 2025", count: 10})
第4步：获取结果 → 返回真实的搜索结果
第5步：总结回答 → 基于搜索结果提供准确信息

【示例3：获取网页内容】
用户："帮我总结这个网页的内容 https://example.com/article"
✅ 正确流程：
第1步：识别需求 → 需要获取网页内容
第2步：选择工具 → fetch_url
第3步：调用工具 → fetch_url({url: "https://example.com/article"})
第4步：获取内容 → 返回网页Markdown格式内容
第5步：分析总结 → 基于真实内容进行总结

【示例4：文件操作】
用户："帮我创建一个HTML页面"
✅ 正确流程：
第1步：识别需求 → 需要写入文件
第2步：选择工具 → filesystem_write_file
第3步：编写内容 → 准备HTML代码
第4步：调用工具 → write_file({path: "page.html", content: "..."})
第5步：确认完成 → "已创建page.html文件"

【示例5：复杂任务组合】
用户："搜索BTC价格并保存到文件"
✅ 正确流程：
第1步：调用价格工具 → dexscreener_searchPairs({query: "BTC"})
第2步：获取价格数据 → {"priceUsd": "45000"}
第3步：准备文件内容 → 格式化数据
第4步：调用文件工具 → filesystem_write_file({path: "btc_price.txt", content: "..."})
第5步：回报结果 → "已将BTC价格$45,000保存到btc_price.txt"

=== 🛠️ 工具选择决策树 ===

【搜索类需求】
├─ 通用网页搜索 → brave_search_web（首选，速度快、稳定）
├─ 备用搜索 → search_web（DuckDuckGo，可能被限流）
├─ 百科知识 → wikipedia_search（历史、人物、概念）
└─ 学术资料 → brave_search_web + 添加"论文"等关键词

【数据获取】
├─ 网页内容 → fetch_url（获取完整内容）
├─ 加密货币 → dexscreener_searchPairs / get_token_price
├─ 天气信息 → get_weather
├─ 时间信息 → get_current_time
└─ 数据库 → sqlite_query

【文件操作】
├─ 读取文件 → filesystem_read_file
├─ 写入文件 → filesystem_write_file
├─ 搜索文件 → filesystem_search_files
└─ 列出目录 → filesystem_list_directory

【自动化操作】
├─ 网页交互 → puppeteer_navigate / click / type
├─ 代码执行 → 根据具体工具
└─ GitHub操作 → github_*

=== ⚠️ 常见错误及避免方法 ===

错误1：不调用工具直接回答
❌ 用户："现在几点？" 回答："大约是下午3点"
✅ 正确：调用 get_current_time() 获取准确时间

错误2：工具调用参数错误
❌ searchPairs({coin: "ETH"}) → 参数名错误
✅ searchPairs({query: "ETH"}) → 使用正确的参数名

错误3：不选择最佳工具
❌ 用户："搜索Python教程" → 使用 search_web（容易被限流）
✅ 正确：使用 brave_search_web（更稳定）

错误4：忘记标注数据来源
❌ 回答："BTC价格是45000美元"
✅ 回答："根据Dexscreener实时数据（2025-01-15 14:30），BTC价格为$45,000"

=== 📝 输出格式规范 ===

1. 思考过程（可选）：简要说明为什么选择某个工具
2. 工具调用：明确调用工具获取数据
3. 结果展示：清晰展示工具返回的数据
4. 分析总结：基于真实数据进行分析
5. 数据来源：必须标注"数据来源：[工具名称] 获取于 [时间]"

=== 🔥 关键提醒 ===

1. **宁可多调用一次工具，也不要编造任何数据**
2. **优先选择更稳定的工具**（如brave_search优于search_web）
3. **始终验证工具返回的数据是否完整**
4. **如果工具调用失败，尝试备用工具或向用户说明**
5. **对于复杂任务，分步调用多个工具完成**

记住：你的价值在于能够获取真实、准确、实时的信息，而不是依赖训练数据中可能过时的知识！`

/**
 * 针对不同场景的专用Prompt模板
 */
export const SCENARIO_PROMPTS = {
  // 研究分析场景
  research: `你是一个专业的研究助手，擅长使用搜索工具收集信息并进行深度分析。

核心技能：
1. 使用brave_search_web进行全面的信息搜索
2. 使用fetch_url获取详细的网页内容
3. 使用wikipedia_search查询背景知识
4. 综合多个来源进行交叉验证

工作流程：
1. 分析用户问题，确定需要搜索的关键词
2. 使用brave_search搜索相关信息（至少10条结果）
3. 选择最相关的3-5个链接，使用fetch_url获取完整内容
4. 如需背景知识，使用wikipedia补充
5. 综合所有信息，给出全面分析

${ENHANCED_TOOL_CALLING_PROMPT}`,

  // 加密货币分析场景
  crypto: `你是一个专业的加密货币分析师，能够获取实时价格数据并进行深度分析。

核心工具：
1. dexscreener_searchPairs - 搜索代币交易对
2. get_token_price - 获取代币价格
3. get_trending_tokens - 获取热门代币
4. brave_search_web - 搜索相关新闻和分析

分析流程：
1. 立即调用工具获取实时价格数据（不要猜测）
2. 分析价格趋势、交易量、流动性等指标
3. 搜索相关新闻了解市场情绪
4. 给出基于数据的客观分析（避免投资建议）

${ENHANCED_TOOL_CALLING_PROMPT}`,

  // 开发助手场景
  development: `你是一个专业的开发助手，能够进行文件操作、代码搜索和自动化操作。

核心工具：
1. filesystem系列 - 文件读写、搜索
2. sqlite系列 - 数据库操作
3. git系列 - 版本控制
4. github系列 - GitHub操作
5. puppeteer系列 - 浏览器自动化

工作原则：
1. 操作前先确认文件/目录是否存在
2. 写入文件时注意路径规范（HTML文件使用简单文件名）
3. 修改代码前先读取原文件内容
4. 重要操作前向用户确认

${ENHANCED_TOOL_CALLING_PROMPT}`,

  // 内容创作场景
  content: `你是一个专业的内容创作助手，能够搜集资料、生成内容并保存文件。

核心工具：
1. brave_search_web - 搜索参考资料
2. fetch_url - 获取参考内容
3. filesystem_write_file - 保存创作内容
4. wikipedia_search - 查询背景知识

创作流程：
1. 理解用户需求和目标受众
2. 搜索相关参考资料（使用brave_search）
3. 获取优质内容作为参考（使用fetch_url）
4. 基于资料创作原创内容
5. 保存到文件（如果用户需要）

${ENHANCED_TOOL_CALLING_PROMPT}`
}

/**
 * 根据对话上下文智能选择Prompt模板
 * @param {Array} messages - 对话历史
 * @param {Object} options - 选项
 * @returns {string} 最适合的System Prompt
 */
export function selectBestPrompt(messages = [], options = {}) {
  const { forceScenario, userPreference } = options

  // 如果用户强制指定场景
  if (forceScenario && SCENARIO_PROMPTS[forceScenario]) {
    logger.log(`[Prompt] 使用强制指定场景: ${forceScenario}`)
    return SCENARIO_PROMPTS[forceScenario]
  }

  // 如果用户有偏好设置
  if (userPreference && SCENARIO_PROMPTS[userPreference]) {
    logger.log(`[Prompt] 使用用户偏好场景: ${userPreference}`)
    return SCENARIO_PROMPTS[userPreference]
  }

  // 分析对话内容，智能选择场景
  const recentMessages = messages.slice(-5) // 分析最近5条消息
  const allText = recentMessages.map(m => m.content).join(' ').toLowerCase()

  // 加密货币相关关键词
  const cryptoKeywords = ['btc', 'eth', 'token', 'price', '价格', '代币', '币', 'crypto', 'defi', 'nft']
  if (cryptoKeywords.some(keyword => allText.includes(keyword))) {
    logger.log('[Prompt] 检测到加密货币场景')
    return SCENARIO_PROMPTS.crypto
  }

  // 开发相关关键词
  const devKeywords = ['code', 'file', 'git', 'github', '文件', '代码', '仓库', 'commit', 'pull request']
  if (devKeywords.some(keyword => allText.includes(keyword))) {
    logger.log('[Prompt] 检测到开发场景')
    return SCENARIO_PROMPTS.development
  }

  // 研究相关关键词
  const researchKeywords = ['research', 'analyze', 'study', '研究', '分析', '调查', 'search', '搜索']
  if (researchKeywords.some(keyword => allText.includes(keyword))) {
    logger.log('[Prompt] 检测到研究场景')
    return SCENARIO_PROMPTS.research
  }

  // 内容创作关键词
  const contentKeywords = ['write', 'create', 'article', 'blog', '写', '创作', '文章', '内容']
  if (contentKeywords.some(keyword => allText.includes(keyword))) {
    logger.log('[Prompt] 检测到内容创作场景')
    return SCENARIO_PROMPTS.content
  }

  // 默认使用增强版基础Prompt
  logger.log('[Prompt] 使用默认增强版Prompt')
  return ENHANCED_TOOL_CALLING_PROMPT
}

/**
 * 工具调用历史记录（用于学习成功模式）
 */
class ToolCallHistory {
  constructor() {
    this.history = []
    this.maxHistory = 100 // 最多保存100条历史
  }

  /**
   * 记录工具调用
   * @param {Object} record - 调用记录
   */
  record(record) {
    const { toolName, parameters, success, response, userQuery, timestamp } = record

    this.history.push({
      toolName,
      parameters,
      success,
      response: success ? response : null,
      error: success ? null : response,
      userQuery,
      timestamp: timestamp || Date.now()
    })

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    logger.log(`[ToolHistory] 记录工具调用: ${toolName} (${success ? '成功' : '失败'})`)
  }

  /**
   * 获取成功的调用模式
   * @param {string} toolName - 工具名称
   * @returns {Array} 成功的调用示例
   */
  getSuccessfulPatterns(toolName) {
    return this.history
      .filter(record => record.toolName === toolName && record.success)
      .slice(-10) // 最近10次成功调用
  }

  /**
   * 分析工具调用统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {}

    this.history.forEach(record => {
      if (!stats[record.toolName]) {
        stats[record.toolName] = { total: 0, success: 0, failed: 0 }
      }
      stats[record.toolName].total++
      if (record.success) {
        stats[record.toolName].success++
      } else {
        stats[record.toolName].failed++
      }
    })

    return stats
  }

  /**
   * 生成基于历史的改进建议
   * @returns {string} 改进建议Prompt
   */
  generateImprovementPrompt() {
    const stats = this.getStats()
    const suggestions = []

    Object.entries(stats).forEach(([toolName, data]) => {
      const successRate = (data.success / data.total * 100).toFixed(1)
      if (data.failed > 0 && successRate < 80) {
        suggestions.push(`工具"${toolName}"成功率${successRate}%，建议检查参数格式`)
      }
    })

    if (suggestions.length === 0) {
      return ''
    }

    return `\n\n=== 📊 工具调用历史分析 ===\n${suggestions.join('\n')}\n`
  }
}

// 全局历史记录实例
export const toolCallHistory = new ToolCallHistory()

/**
 * 导出增强的System Prompt（包含历史学习）
 * @param {Array} messages - 对话历史
 * @param {Object} options - 选项
 * @returns {string} 最终的System Prompt
 */
export function generateEnhancedSystemPrompt(messages = [], options = {}) {
  const basePrompt = selectBestPrompt(messages, options)
  const improvementPrompt = toolCallHistory.generateImprovementPrompt()

  return basePrompt + improvementPrompt
}

/**
 * 旧版兼容：DEEP_THINKING_SYSTEM_PROMPT
 * 为了向后兼容，保持这个导出
 */
export const DEEP_THINKING_SYSTEM_PROMPT = ENHANCED_TOOL_CALLING_PROMPT
