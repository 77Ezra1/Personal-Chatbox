/**
 * 工具调用优化器（后端版本）
 *
 * 功能：
 * 1. 记录所有工具调用的成功/失败情况
 * 2. 分析工具调用模式
 * 3. 生成改进建议
 * 4. 为AI提供Few-shot示例
 */

const logger = require('../utils/logger.cjs');

/**
 * 工具调用历史记录器
 */
class ToolCallOptimizer {
  constructor() {
    this.history = []; // 工具调用历史
    this.maxHistory = 500; // 最多保存500条历史
    this.successPatterns = new Map(); // 成功模式缓存
  }

  /**
   * 记录工具调用
   * @param {Object} record - 调用记录
   */
  record(record) {
    const {
      toolName,
      parameters,
      success,
      response,
      error,
      userQuery,
      executionTime,
      userId
    } = record;

    const historyEntry = {
      toolName,
      parameters: JSON.parse(JSON.stringify(parameters)), // 深拷贝
      success,
      response: success ? this.sanitizeResponse(response) : null,
      error: success ? null : (error?.message || error),
      userQuery,
      executionTime,
      userId,
      timestamp: Date.now()
    };

    this.history.push(historyEntry);

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 如果成功，更新成功模式缓存
    if (success) {
      this.updateSuccessPattern(toolName, parameters);
    }

    logger.info(`[ToolOptimizer] 记录工具调用: ${toolName} (${success ? '✅成功' : '❌失败'}) 耗时: ${executionTime}ms`);
  }

  /**
   * 清理响应数据（避免保存过大的数据）
   * @param {any} response - 原始响应
   * @returns {any} 清理后的响应
   */
  sanitizeResponse(response) {
    const responseStr = JSON.stringify(response);
    if (responseStr.length > 5000) {
      // 如果响应太大，只保留摘要
      return {
        __truncated: true,
        __length: responseStr.length,
        __preview: responseStr.substring(0, 500) + '...'
      };
    }
    return response;
  }

  /**
   * 更新成功模式缓存
   * @param {string} toolName - 工具名称
   * @param {Object} parameters - 参数
   */
  updateSuccessPattern(toolName, parameters) {
    if (!this.successPatterns.has(toolName)) {
      this.successPatterns.set(toolName, []);
    }

    const patterns = this.successPatterns.get(toolName);
    patterns.push({
      parameters: JSON.parse(JSON.stringify(parameters)),
      timestamp: Date.now()
    });

    // 只保留最近20次成功调用
    if (patterns.length > 20) {
      patterns.shift();
    }
  }

  /**
   * 获取工具的成功模式
   * @param {string} toolName - 工具名称
   * @returns {Array} 成功的参数模式
   */
  getSuccessPatterns(toolName) {
    return this.successPatterns.get(toolName) || [];
  }

  /**
   * 获取工具调用统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {};
    const timeWindow = 24 * 60 * 60 * 1000; // 24小时
    const now = Date.now();

    this.history.forEach(record => {
      // 只统计最近24小时的数据
      if (now - record.timestamp > timeWindow) {
        return;
      }

      if (!stats[record.toolName]) {
        stats[record.toolName] = {
          total: 0,
          success: 0,
          failed: 0,
          avgExecutionTime: 0,
          totalExecutionTime: 0,
          lastUsed: 0
        };
      }

      const toolStats = stats[record.toolName];
      toolStats.total++;
      if (record.success) {
        toolStats.success++;
      } else {
        toolStats.failed++;
      }
      toolStats.totalExecutionTime += (record.executionTime || 0);
      toolStats.lastUsed = Math.max(toolStats.lastUsed, record.timestamp);
    });

    // 计算平均执行时间和成功率
    Object.keys(stats).forEach(toolName => {
      const toolStats = stats[toolName];
      toolStats.avgExecutionTime = Math.round(toolStats.totalExecutionTime / toolStats.total);
      toolStats.successRate = ((toolStats.success / toolStats.total) * 100).toFixed(1);
      delete toolStats.totalExecutionTime; // 删除中间变量
    });

    return stats;
  }

  /**
   * 获取最常用的工具
   * @param {number} limit - 返回数量
   * @returns {Array} 工具使用排行
   */
  getMostUsedTools(limit = 10) {
    const stats = this.getStats();
    return Object.entries(stats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([toolName, data]) => ({
        toolName,
        ...data
      }));
  }

  /**
   * 生成工具调用改进建议
   * @returns {Array} 建议列表
   */
  generateSuggestions() {
    const stats = this.getStats();
    const suggestions = [];

    Object.entries(stats).forEach(([toolName, data]) => {
      const successRate = parseFloat(data.successRate);

      // 低成功率警告
      if (data.total >= 5 && successRate < 70) {
        suggestions.push({
          type: 'low_success_rate',
          toolName,
          severity: 'high',
          message: `工具"${toolName}"成功率仅${successRate}%（${data.success}/${data.total}），建议检查参数格式或工具配置`,
          stats: data
        });
      }

      // 高延迟警告
      if (data.avgExecutionTime > 5000) {
        suggestions.push({
          type: 'high_latency',
          toolName,
          severity: 'medium',
          message: `工具"${toolName}"平均执行时间${data.avgExecutionTime}ms，考虑优化或使用替代工具`,
          stats: data
        });
      }

      // 频繁失败警告
      if (data.failed >= 3 && data.total < 10) {
        suggestions.push({
          type: 'frequent_failure',
          toolName,
          severity: 'high',
          message: `工具"${toolName}"最近频繁失败（${data.failed}次），建议检查服务状态`,
          stats: data
        });
      }
    });

    return suggestions;
  }

  /**
   * 生成Few-shot示例Prompt（基于历史成功调用）
   * @param {string} toolName - 工具名称
   * @returns {string} Few-shot示例
   */
  generateFewShotExamples(toolName) {
    const patterns = this.getSuccessPatterns(toolName);
    if (patterns.length === 0) {
      return '';
    }

    // 取最近3次成功调用作为示例
    const examples = patterns.slice(-3).map((pattern, index) => {
      return `示例${index + 1}: ${JSON.stringify(pattern.parameters, null, 2)}`;
    });

    return `
=== ${toolName} 成功调用示例 ===
${examples.join('\n\n')}
`;
  }

  /**
   * 为所有工具生成增强的描述（包含成功示例）
   * @param {Array} tools - 工具列表
   * @returns {Array} 增强后的工具列表
   */
  enhanceToolDescriptions(tools) {
    return tools.map(tool => {
      const toolName = tool.function.name;
      const patterns = this.getSuccessPatterns(toolName);
      const stats = this.getStats()[toolName];

      let enhancedDescription = tool.function.description || '';

      // 添加统计信息
      if (stats && stats.total >= 5) {
        enhancedDescription += `\n[使用统计] 成功率: ${stats.successRate}%, 平均耗时: ${stats.avgExecutionTime}ms`;
      }

      // 添加成功示例
      if (patterns.length > 0) {
        const latestExample = patterns[patterns.length - 1];
        enhancedDescription += `\n[成功示例] ${JSON.stringify(latestExample.parameters)}`;
      }

      return {
        ...tool,
        function: {
          ...tool.function,
          description: enhancedDescription
        }
      };
    });
  }

  /**
   * 获取优化报告
   * @returns {Object} 优化报告
   */
  getOptimizationReport() {
    const stats = this.getStats();
    const suggestions = this.generateSuggestions();
    const mostUsed = this.getMostUsedTools(5);

    return {
      summary: {
        totalCalls: this.history.length,
        totalTools: Object.keys(stats).length,
        avgSuccessRate: this.calculateAvgSuccessRate(stats),
        timeRange: '最近24小时'
      },
      mostUsedTools: mostUsed,
      suggestions: suggestions,
      detailedStats: stats
    };
  }

  /**
   * 计算平均成功率
   * @param {Object} stats - 统计信息
   * @returns {string} 平均成功率
   */
  calculateAvgSuccessRate(stats) {
    const tools = Object.values(stats);
    if (tools.length === 0) return '0.0';

    const totalSuccess = tools.reduce((sum, tool) => sum + tool.success, 0);
    const totalCalls = tools.reduce((sum, tool) => sum + tool.total, 0);

    return ((totalSuccess / totalCalls) * 100).toFixed(1);
  }

  /**
   * 清空历史记录
   */
  clear() {
    this.history = [];
    this.successPatterns.clear();
    logger.info('[ToolOptimizer] 历史记录已清空');
  }

  /**
   * 导出历史数据
   * @returns {Object} 导出的数据
   */
  export() {
    return {
      history: this.history,
      stats: this.getStats(),
      suggestions: this.generateSuggestions(),
      exportTime: Date.now()
    };
  }

  /**
   * 导入历史数据
   * @param {Object} data - 导入的数据
   */
  import(data) {
    if (data.history && Array.isArray(data.history)) {
      this.history = data.history;
      // 重建成功模式缓存
      this.successPatterns.clear();
      data.history.forEach(record => {
        if (record.success) {
          this.updateSuccessPattern(record.toolName, record.parameters);
        }
      });
      logger.info(`[ToolOptimizer] 导入了${data.history.length}条历史记录`);
    }
  }
}

// 全局单例
const toolCallOptimizer = new ToolCallOptimizer();

module.exports = {
  ToolCallOptimizer,
  toolCallOptimizer
};
