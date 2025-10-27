/**
 * MCP工具国际化翻译表
 *
 * 结构：
 * - key: 工具的英文名称（toolName，不包含服务前缀）
 * - value: { name: 中文名称, description: 中文描述 }
 *
 * 注意：工具的实际value（用于API调用）保持英文不变
 */

export const mcpToolsTranslations = {
  // ========== 搜索相关 ==========
  'search_nodes': {
    name: '搜索节点',
    description: '在知识图谱中根据查询搜索节点'
  },
  'search_files': {
    name: '搜索文件',
    description: '递归搜索匹配模式的文件和目录'
  },
  'findPage': {
    name: '搜索维基页面',
    description: '搜索匹配查询的维基百科页面'
  },
  'search': {
    name: '搜索',
    description: '执行搜索查询'
  },
  'web_search': {
    name: '网页搜索',
    description: '在互联网上搜索信息'
  },
  'brave_web_search': {
    name: 'Brave搜索',
    description: '使用Brave搜索引擎搜索网页'
  },

  // ========== 文件操作 ==========
  'read_graph': {
    name: '读取知识图谱',
    description: '读取整个知识图谱'
  },
  'read_file': {
    name: '读取文件',
    description: '读取指定路径的文件内容'
  },
  'read_multiple_files': {
    name: '读取多个文件',
    description: '一次性读取多个文件'
  },
  'write_file': {
    name: '写入文件',
    description: '将内容写入指定路径的文件'
  },
  'create_file': {
    name: '创建文件',
    description: '创建新文件'
  },
  'edit_file': {
    name: '编辑文件',
    description: '编辑现有文件的内容'
  },
  'list_directory': {
    name: '列出目录',
    description: '列出目录中的文件和子目录'
  },
  'directory_tree': {
    name: '目录树',
    description: '以树形结构显示目录内容'
  },
  'move_file': {
    name: '移动文件',
    description: '移动或重命名文件'
  },
  'get_file_info': {
    name: '获取文件信息',
    description: '获取文件的元数据信息'
  },
  'list_allowed_directories': {
    name: '列出允许目录',
    description: '列出所有允许访问的目录'
  },

  // ========== 数据库操作 ==========
  'query': {
    name: '数据库查询',
    description: '执行SQL查询'
  },
  'list_tables': {
    name: '列出表',
    description: '列出数据库中的所有表'
  },
  'describe_table': {
    name: '描述表结构',
    description: '获取表的结构信息'
  },
  'append_insight': {
    name: '添加见解',
    description: '向数据库添加分析见解'
  },

  // ========== Git操作 ==========
  'create_or_update_file': {
    name: '创建或更新文件',
    description: '在仓库中创建或更新文件'
  },
  'push_files': {
    name: '推送文件',
    description: '推送文件更改到Git仓库'
  },
  'create_repository': {
    name: '创建仓库',
    description: '创建新的Git仓库'
  },
  'get_file_contents': {
    name: '获取文件内容',
    description: '从Git仓库获取文件内容'
  },
  'create_issue': {
    name: '创建Issue',
    description: '在仓库中创建新的Issue'
  },
  'create_pull_request': {
    name: '创建PR',
    description: '创建Pull Request'
  },
  'fork_repository': {
    name: '复刻仓库',
    description: '复刻（Fork）一个仓库'
  },
  'create_branch': {
    name: '创建分支',
    description: '在仓库中创建新分支'
  },
  'list_commits': {
    name: '列出提交',
    description: '列出仓库的提交历史'
  },
  'list_issues': {
    name: '列出Issues',
    description: '列出仓库的所有Issues'
  },
  'update_issue': {
    name: '更新Issue',
    description: '更新现有Issue'
  },
  'add_issue_comment': {
    name: '添加评论',
    description: '为Issue添加评论'
  },
  'search_repositories': {
    name: '搜索仓库',
    description: '搜索GitHub仓库'
  },
  'search_code': {
    name: '搜索代码',
    description: '在GitHub中搜索代码'
  },
  'search_issues': {
    name: '搜索Issues',
    description: '搜索GitHub Issues'
  },
  'search_users': {
    name: '搜索用户',
    description: '搜索GitHub用户'
  },

  // ========== API和网络 ==========
  'fetch': {
    name: '获取网页',
    description: '获取网页内容'
  },
  'get_request': {
    name: 'GET请求',
    description: '发送HTTP GET请求'
  },
  'post_request': {
    name: 'POST请求',
    description: '发送HTTP POST请求'
  },

  // ========== 浏览器自动化 ==========
  'puppeteer_navigate': {
    name: '导航页面',
    description: '在浏览器中导航到指定URL'
  },
  'puppeteer_screenshot': {
    name: '截图',
    description: '捕获页面截图'
  },
  'puppeteer_click': {
    name: '点击元素',
    description: '点击页面元素'
  },
  'puppeteer_fill': {
    name: '填充表单',
    description: '填充输入字段'
  },
  'puppeteer_select': {
    name: '选择下拉',
    description: '在下拉框中选择选项'
  },
  'puppeteer_hover': {
    name: '悬停',
    description: '将鼠标悬停在元素上'
  },
  'puppeteer_evaluate': {
    name: '执行脚本',
    description: '在页面中执行JavaScript'
  },

  // ========== 内存和笔记 ==========
  'create_entities': {
    name: '创建实体',
    description: '在知识图谱中创建新实体'
  },
  'create_relations': {
    name: '创建关系',
    description: '在实体之间创建关系'
  },
  'add_observations': {
    name: '添加观察',
    description: '为实体添加观察记录'
  },
  'delete_entities': {
    name: '删除实体',
    description: '从知识图谱中删除实体'
  },
  'delete_observations': {
    name: '删除观察',
    description: '删除实体的观察记录'
  },
  'delete_relations': {
    name: '删除关系',
    description: '删除实体之间的关系'
  },
  'open_nodes': {
    name: '打开节点',
    description: '打开并查看知识图谱中的节点'
  },

  // ========== Slack操作 ==========
  'post_slack_message': {
    name: '发送消息',
    description: '发送消息到Slack频道'
  },
  'reply_slack_message': {
    name: '回复消息',
    description: '回复Slack消息'
  },
  'get_channel_history': {
    name: '获取频道历史',
    description: '获取Slack频道的消息历史'
  },
  'get_thread_history': {
    name: '获取会话历史',
    description: '获取Slack会话的消息历史'
  },

  // ========== 时间和天气 ==========
  'get_current_time': {
    name: '获取当前时间',
    description: '获取指定时区的当前时间'
  },
  'get_weather': {
    name: '获取天气',
    description: '获取指定位置的天气信息'
  },

  // ========== Google相关 ==========
  'google_maps_search': {
    name: '谷歌地图搜索',
    description: '在谷歌地图中搜索位置'
  },
  'google_maps_details': {
    name: '地点详情',
    description: '获取谷歌地图地点的详细信息'
  },

  // ========== Notion操作 ==========
  'create_page': {
    name: '创建页面',
    description: '在Notion中创建新页面'
  },
  'append_blocks': {
    name: '添加内容块',
    description: '向Notion页面添加内容块'
  },
  'update_page': {
    name: '更新页面',
    description: '更新Notion页面属性'
  },
  'search_pages': {
    name: '搜索页面',
    description: '在Notion中搜索页面'
  },
  'get_page': {
    name: '获取页面',
    description: '获取Notion页面内容'
  },
  'get_database': {
    name: '获取数据库',
    description: '获取Notion数据库'
  },
  'query_database': {
    name: '查询数据库',
    description: '查询Notion数据库'
  },

  // ========== Postgres数据库 ==========
  'postgres_query': {
    name: 'PostgreSQL查询',
    description: '执行PostgreSQL查询'
  },
  'postgres_list_tables': {
    name: '列出表',
    description: '列出PostgreSQL数据库中的表'
  },
  'postgres_describe_table': {
    name: '描述表',
    description: '获取PostgreSQL表的结构'
  },

  // ========== Sentry错误追踪 ==========
  'list_issues': {
    name: '列出错误',
    description: '列出Sentry中的错误问题'
  },
  'get_issue': {
    name: '获取错误详情',
    description: '获取Sentry错误的详细信息'
  },

  // ========== YouTube相关 ==========
  'get_video_info': {
    name: '获取视频信息',
    description: '获取YouTube视频的详细信息'
  },
  'get_transcript': {
    name: '获取字幕',
    description: '获取YouTube视频字幕'
  },
  'search_videos': {
    name: '搜索视频',
    description: '搜索YouTube视频'
  }
}

/**
 * 获取工具的翻译名称
 * @param {string} toolName - 工具的英文名称（不含服务前缀）
 * @returns {string} 翻译后的名称，如果没有翻译则返回原名称
 */
export function getToolTranslatedName(toolName) {
  const translation = mcpToolsTranslations[toolName]
  return translation?.name || formatToolName(toolName)
}

/**
 * 获取工具的翻译描述
 * @param {string} toolName - 工具的英文名称（不含服务前缀）
 * @param {string} originalDescription - 原始英文描述
 * @returns {string} 翻译后的描述，如果没有翻译则返回原描述
 */
export function getToolTranslatedDescription(toolName, originalDescription) {
  const translation = mcpToolsTranslations[toolName]
  return translation?.description || originalDescription
}

/**
 * 格式化工具名称（将下划线转为空格并首字母大写）
 * @param {string} toolName - 工具名称
 * @returns {string} 格式化后的名称
 */
function formatToolName(toolName) {
  return toolName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
