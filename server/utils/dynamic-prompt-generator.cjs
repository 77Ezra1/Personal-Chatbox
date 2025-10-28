/**
 * 动态Prompt生成器（后端版本）
 *
 * 与前端版本功能相同，但使用CommonJS格式
 */

const logger = require('./logger.cjs');

// ... (复制前端的逻辑，使用CommonJS语法)

const TOOL_CATEGORIES = {
  search: {
    keywords: ['search', 'brave', 'wikipedia'],
    description: '搜索类工具'
  },
  crypto: {
    keywords: ['dexscreener', 'token', 'price', 'trending'],
    description: '加密货币工具'
  },
  weather: {
    keywords: ['weather', 'forecast'],
    description: '天气查询工具'
  },
  time: {
    keywords: ['time', 'timezone', 'convert_time'],
    description: '时间查询工具'
  },
  filesystem: {
    keywords: ['filesystem', 'file', 'read', 'write', 'directory'],
    description: '文件操作工具'
  },
  database: {
    keywords: ['sqlite', 'query', 'database'],
    description: '数据库工具'
  },
  git: {
    keywords: ['git'],
    description: 'Git版本控制工具'
  },
  github: {
    keywords: ['github'],
    description: 'GitHub操作工具'
  },
  browser: {
    keywords: ['puppeteer', 'navigate', 'click', 'screenshot'],
    description: '浏览器自动化工具'
  },
  fetch: {
    keywords: ['fetch', 'url', 'webpage'],
    description: '网页内容获取工具'
  },
  memory: {
    keywords: ['memory'],
    description: '记忆存储工具'
  },
  thinking: {
    keywords: ['thinking', 'sequential'],
    description: '深度思考工具'
  }
};

function categorizeTools(toolName) {
  const lowerName = toolName.toLowerCase();

  for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
    if (config.keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

function analyzeAvailableTools(tools) {
  const categorized = {};

  tools.forEach(tool => {
    const toolName = tool.function?.name || tool.name;
    const category = categorizeTools(toolName);

    if (!categorized[category]) {
      categorized[category] = [];
    }

    categorized[category].push({
      name: toolName,
      description: tool.function?.description || tool.description || ''
    });
  });

  return categorized;
}

function generateToolListDescription(categorizedTools) {
  const sections = [];

  // 搜索工具
  if (categorizedTools.search && categorizedTools.search.length > 0) {
    const tools = categorizedTools.search;
    const hasBrave = tools.some(t => t.name.includes('brave'));
    const hasWikipedia = tools.some(t => t.name.includes('wikipedia'));
    const hasOtherSearch = tools.some(t => t.name.includes('search') && !t.name.includes('brave'));

    let searchDesc = '【搜索类工具】\n';
    if (hasBrave) {
      searchDesc += '├─ brave_search_web - 通用网页搜索（首选，速度快、稳定）\n';
    }
    if (hasOtherSearch) {
      searchDesc += '├─ search_web - 备用搜索（可能被限流）\n';
    }
    if (hasWikipedia) {
      searchDesc += '└─ wikipedia_search - 百科知识查询（历史、人物、概念）\n';
    }

    sections.push(searchDesc);
  }

  // 加密货币工具
  if (categorizedTools.crypto && categorizedTools.crypto.length > 0) {
    let cryptoDesc = '【加密货币工具】\n';
    categorizedTools.crypto.forEach((tool, index) => {
      const prefix = index === categorizedTools.crypto.length - 1 ? '└─' : '├─';
      cryptoDesc += `${prefix} ${tool.name} - ${tool.description.split('\n')[0]}\n`;
    });
    sections.push(cryptoDesc);
  }

  // 文件操作工具
  if (categorizedTools.filesystem && categorizedTools.filesystem.length > 0) {
    sections.push('【文件操作工具】\n├─ 读取/写入/搜索文件\n└─ 目录管理\n');
  }

  // 数据库工具
  if (categorizedTools.database && categorizedTools.database.length > 0) {
    sections.push('【数据库工具】\n└─ SQLite查询和数据存储\n');
  }

  // 浏览器自动化
  if (categorizedTools.browser && categorizedTools.browser.length > 0) {
    sections.push('【浏览器自动化工具】\n├─ 网页导航、点击、输入\n└─ 截图、内容提取\n');
  }

  // 网页内容获取
  if (categorizedTools.fetch && categorizedTools.fetch.length > 0) {
    sections.push('【网页内容工具】\n└─ fetch_url - 获取网页完整内容（Markdown格式）\n');
  }

  // 天气工具
  if (categorizedTools.weather && categorizedTools.weather.length > 0) {
    sections.push('【天气工具】\n└─ 查询天气、温度、降水\n');
  }

  // 时间工具
  if (categorizedTools.time && categorizedTools.time.length > 0) {
    sections.push('【时间工具】\n└─ 当前时间、时区转换\n');
  }

  // Git工具
  if (categorizedTools.git && categorizedTools.git.length > 0) {
    sections.push('【Git工具】\n└─ 版本控制、提交历史\n');
  }

  // GitHub工具
  if (categorizedTools.github && categorizedTools.github.length > 0) {
    sections.push('【GitHub工具】\n└─ 仓库操作、Issue管理\n');
  }

  // 其他工具
  if (categorizedTools.other && categorizedTools.other.length > 0) {
    sections.push(`【其他工具】\n${categorizedTools.other.map(t => `├─ ${t.name}`).join('\n')}\n`);
  }

  return sections.join('\n');
}

function generateToolExamples(categorizedTools) {
  const examples = [];

  // 搜索示例
  if (categorizedTools.search && categorizedTools.search.length > 0) {
    const hasBrave = categorizedTools.search.some(t => t.name.includes('brave'));
    const searchTool = hasBrave ? 'brave_search_web' : categorizedTools.search[0].name;

    examples.push(`【示例：网页搜索】
用户："最新的AI新闻有哪些？"
✅ 正确流程：
第1步：识别需求 → 需要搜索最新新闻
第2步：选择工具 → ${searchTool}
第3步：调用工具 → ${searchTool}({query: "AI 新闻 2025", count: 10})
第4步：获取结果 → 返回真实的搜索结果
第5步：总结回答 → 基于搜索结果提供准确信息`);
  }

  // 加密货币示例
  if (categorizedTools.crypto && categorizedTools.crypto.length > 0) {
    const priceTool = categorizedTools.crypto.find(t => t.name.includes('search') || t.name.includes('price'));
    if (priceTool) {
      examples.push(`【示例：价格查询】
用户："ETH现在多少钱？"
✅ 正确流程：
第1步：识别需求 → 需要实时加密货币价格
第2步：选择工具 → ${priceTool.name}
第3步：调用工具 → ${priceTool.name}({query: "ETH"})
第4步：获取结果 → {"pairs": [{"priceUsd": "2450.32"}]}
第5步：回答用户 → "根据实时数据，ETH当前价格为$2,450.32"

❌ 错误做法：
直接回答 → "ETH大约在2500美元左右"（这是编造的！）`);
    }
  }

  // 网页内容示例
  if (categorizedTools.fetch && categorizedTools.fetch.length > 0) {
    examples.push(`【示例：获取网页内容】
用户："帮我总结这个网页的内容 https://example.com/article"
✅ 正确流程：
第1步：识别需求 → 需要获取网页内容
第2步：选择工具 → fetch_url
第3步：调用工具 → fetch_url({url: "https://example.com/article"})
第4步：获取内容 → 返回网页Markdown格式内容
第5步：分析总结 → 基于真实内容进行总结`);
  }

  // 文件操作示例
  if (categorizedTools.filesystem && categorizedTools.filesystem.length > 0) {
    const writeTool = categorizedTools.filesystem.find(t => t.name.includes('write'));
    if (writeTool) {
      examples.push(`【示例：文件操作】
用户："帮我创建一个HTML页面"
✅ 正确流程：
第1步：识别需求 → 需要写入文件
第2步：选择工具 → ${writeTool.name}
第3步：编写内容 → 准备HTML代码
第4步：调用工具 → ${writeTool.name}({path: "page.html", content: "..."})
第5步：确认完成 → "已创建page.html文件"`);
    }
  }

  return examples.join('\n\n');
}

function generateDecisionTree(categorizedTools) {
  const tree = [];

  if (categorizedTools.search && categorizedTools.search.length > 0) {
    const hasBrave = categorizedTools.search.some(t => t.name.includes('brave'));
    const hasOther = categorizedTools.search.some(t => t.name.includes('search') && !t.name.includes('brave'));
    const hasWikipedia = categorizedTools.search.some(t => t.name.includes('wikipedia'));

    let searchTree = '【搜索类需求】\n';
    if (hasBrave) {
      searchTree += '├─ 通用网页搜索 → brave_search_web（首选）\n';
    }
    if (hasOther) {
      searchTree += '├─ 备用搜索 → search_web（可能被限流）\n';
    }
    if (hasWikipedia) {
      searchTree += '└─ 百科知识 → wikipedia_search\n';
    }

    tree.push(searchTree);
  }

  if (categorizedTools.crypto && categorizedTools.crypto.length > 0) {
    tree.push('【加密货币数据】\n' +
      categorizedTools.crypto.map((t, i) => {
        const prefix = i === categorizedTools.crypto.length - 1 ? '└─' : '├─';
        return `${prefix} ${t.name}`;
      }).join('\n') + '\n');
  }

  if (categorizedTools.fetch && categorizedTools.fetch.length > 0) {
    tree.push('【网页内容】\n└─ fetch_url（获取完整内容）\n');
  }

  if (categorizedTools.filesystem && categorizedTools.filesystem.length > 0) {
    tree.push('【文件操作】\n├─ 读取/写入/搜索文件\n└─ 目录管理\n');
  }

  if (categorizedTools.database && categorizedTools.database.length > 0) {
    tree.push('【数据库】\n└─ SQLite查询\n');
  }

  if (categorizedTools.browser && categorizedTools.browser.length > 0) {
    tree.push('【自动化操作】\n└─ 浏览器交互（导航、点击、截图）\n');
  }

  return tree.join('\n');
}

function generateScenarioSpecificReminders(categorizedTools, scenario) {
  const reminders = [];

  if (scenario === 'crypto' && categorizedTools.crypto) {
    reminders.push('• 加密货币价格：**绝对不要猜测价格**，必须调用工具获取实时数据');
  }

  if (categorizedTools.search) {
    const hasBrave = categorizedTools.search.some(t => t.name.includes('brave'));
    if (hasBrave) {
      reminders.push('• 网页搜索：优先使用 brave_search_web（更稳定、速度快）');
    }
  }

  if (categorizedTools.filesystem) {
    reminders.push('• 文件操作：写入前检查路径是否合理，避免覆盖重要文件');
  }

  if (categorizedTools.browser) {
    reminders.push('• 浏览器自动化：操作较慢，请耐心等待');
  }

  if (reminders.length === 0) {
    return '• 使用工具时请确保参数格式正确\n• 如遇到错误，尝试调整参数或使用备用工具';
  }

  return reminders.join('\n');
}

/**
 * 生成动态System Prompt（后端版本）
 * @param {Array} availableTools - 可用工具列表
 * @param {Object} options - 选项
 * @returns {string} System Prompt
 */
function generateDynamicSystemPrompt(availableTools = [], options = {}) {
  const { scenario = 'general' } = options;

  if (!availableTools || availableTools.length === 0) {
    logger.warn('[DynamicPrompt] 没有可用工具，AI将无法使用Function Calling');
    return `你是一个专业的AI助手。

⚠️ 当前系统没有可用的工具，你只能基于自己的知识回答问题。

请注意：
- 明确告知用户你无法获取实时信息
- 对于需要实时数据的问题，建议用户启用相关工具
- 基于已有知识提供帮助，但要标注信息的时效性

如果用户需要使用工具功能，请建议他们：
1. 前往设置页面
2. 启用所需的MCP服务或其他工具
3. 配置必要的API密钥`;
  }

  const categorized = analyzeAvailableTools(availableTools);
  const toolCount = availableTools.length;

  logger.info(`[DynamicPrompt] 生成动态Prompt: ${toolCount}个工具, 场景: ${scenario}`);

  const toolList = generateToolListDescription(categorized);
  const examples = generateToolExamples(categorized);
  const decisionTree = generateDecisionTree(categorized);

  return `你是一个专业的AI助手，擅长主动使用工具获取真实信息。

=== 🎯 核心原则：工具优先 ===

当用户提出以下类型的问题时，**必须先调用工具**，绝不编造答案：
1. 实时信息（价格、天气、时间、新闻）
2. 外部数据（搜索、网页内容、数据库查询）
3. 专业操作（文件操作、代码执行、浏览器自动化）

=== 🛠️ 当前可用工具 (共${toolCount}个) ===

${toolList}

=== 📚 工具调用示例学习 ===

${examples}

=== 🛠️ 工具选择决策树 ===

${decisionTree}

=== ⚠️ 核心规则 ===

1. **宁可多调用一次工具，也不要编造任何数据**
2. **如果需要的工具不可用，明确告知用户**
3. **始终验证工具返回的数据是否完整**
4. **对于复杂任务，分步调用多个工具完成**
5. **始终标注数据来源："数据来源: [工具名称] 获取于 [时间]"**

=== 🚨 关键：工具返回数据的绝对优先级 ===

**重要：当工具返回数据后，你必须100%完全信任并使用工具返回的数据，而不是基于你的训练知识进行修正或猜测！**

**核心原则：工具 > 你的知识**
- 工具返回的数据是**实时、真实、准确**的
- 你的训练数据可能已经**过时**，不要用它来"修正"工具数据
- 即使工具返回的数据看起来"不合理"，也要完全信任它

**具体规则：**

1. **时间数据**：
   - ✅ 当用户问"现在几点"时，必须调用 get_current_time 工具
   - ✅ 工具返回什么时间，你就说什么时间，一字不改
   - ❌ 绝对不要基于你的训练知识去判断或修正工具返回的日期
   - ❌ 即使工具返回的日期看起来"不合常理"，也要完全相信

2. **价格数据**：
   - ✅ 工具返回的价格就是当前真实价格
   - ❌ 不要基于你记忆中的价格去"修正"它

3. **新闻数据**：
   - ✅ 搜索返回的就是最新新闻，直接引用
   - ❌ 不要怀疑新闻的时间是否合理

4. **任何实时数据**：
   - ✅ 工具说什么，你就说什么
   - ❌ 不要用你的知识去"纠正"工具

**错误示例（千万不要这样做）：**
❌ 用户："现在几点？"
❌ 工具返回："现在是 [某个日期和时间]"
❌ 你的回复："现在是 [你根据自己知识猜测的时间]"（这是错误的！你修改了工具数据）

**正确示例（必须这样做）：**
✅ 用户："现在几点？"
✅ 工具返回："现在是 [某个日期和时间]"
✅ 你的回复："现在是 [某个日期和时间]"（完全复制工具返回的数据，一字不改）

**重要提醒：你的训练数据截止日期可能是过去的某个时间点，但工具返回的是真实的当前时间！无论工具返回什么日期，都要完全相信！**

=== 📝 输出格式规范 ===

1. 思考过程（可选）：简要说明为什么选择某个工具
2. 工具调用：明确调用工具获取数据
3. 结果展示：清晰展示工具返回的数据
4. 分析总结：基于真实数据进行分析
5. 数据来源：必须标注数据来源和时间

=== 🔥 重要提醒 ===

${generateScenarioSpecificReminders(categorized, scenario)}

记住：你的价值在于能够获取真实、准确、实时的信息！`;
}

module.exports = {
  generateDynamicSystemPrompt,
  analyzeAvailableTools
};
