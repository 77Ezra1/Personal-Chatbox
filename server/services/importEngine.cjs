/**
 * 导入引擎
 * 处理各种格式的导入功能
 */

const fs = require('fs').promises;
const path = require('path');

class ImportEngine {
  constructor() {
    this.supportedFormats = ['json', 'markdown', 'txt', 'csv'];
  }

  /**
   * 导入对话数据
   * @param {string} filePath - 文件路径
   * @param {string} format - 文件格式
   * @param {Object} options - 导入选项
   */
  async importConversations(filePath, format = 'auto', options = {}) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');

      if (format === 'auto') {
        format = this.detectFormat(filePath, fileContent);
      }

      switch (format.toLowerCase()) {
        case 'json':
          return this.importFromJSON(fileContent, options);
        case 'markdown':
          return this.importFromMarkdown(fileContent, options);
        case 'txt':
          return this.importFromTxt(fileContent, options);
        case 'csv':
          return this.importFromCSV(fileContent, options);
        default:
          throw new Error(`不支持的导入格式: ${format}`);
      }
    } catch (error) {
      throw new Error(`导入失败: ${error.message}`);
    }
  }

  /**
   * 自动检测文件格式
   */
  detectFormat(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return 'json';
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.txt':
        return 'txt';
      case '.csv':
        return 'csv';
      default:
        // 尝试根据内容判断
        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
          return 'json';
        } else if (content.includes('# ') || content.includes('## ')) {
          return 'markdown';
        } else if (content.includes(',') && content.split('\n').length > 1) {
          return 'csv';
        } else {
          return 'txt';
        }
    }
  }

  /**
   * 从JSON格式导入
   */
  async importFromJSON(content, options = {}) {
    try {
      const data = JSON.parse(content);

      if (data.conversations && Array.isArray(data.conversations)) {
        return {
          conversations: data.conversations,
          metadata: {
            version: data.version,
            exportDate: data.exportDate,
            importDate: new Date().toISOString()
          }
        };
      } else if (Array.isArray(data)) {
        return {
          conversations: data,
          metadata: {
            importDate: new Date().toISOString()
          }
        };
      } else {
        throw new Error('无效的JSON格式');
      }
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`);
    }
  }

  /**
   * 从Markdown格式导入
   */
  async importFromMarkdown(content, options = {}) {
    const conversations = [];
    const lines = content.split('\n');
    let currentConversation = null;
    let currentMessage = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测对话标题
      if (line.startsWith('## ')) {
        if (currentConversation) {
          conversations.push(currentConversation);
        }
        currentConversation = {
          id: `imported_${Date.now()}_${conversations.length}`,
          title: line.substring(3).trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        };
        currentMessage = null;
      }
      // 检测消息角色
      else if (line.startsWith('### ')) {
        if (currentConversation) {
          const roleText = line.substring(4).trim();
          const role = roleText === '用户' ? 'user' : 'assistant';

          if (currentMessage) {
            currentConversation.messages.push(currentMessage);
          }

          currentMessage = {
            id: `msg_${Date.now()}_${currentConversation.messages.length}`,
            role,
            content: '',
            timestamp: new Date().toISOString(),
            status: 'done'
          };
        }
      }
      // 收集消息内容
      else if (currentMessage && line) {
        currentMessage.content += (currentMessage.content ? '\n' : '') + line;
      }
    }

    // 添加最后一个对话和消息
    if (currentMessage) {
      if (currentConversation) {
        currentConversation.messages.push(currentMessage);
      }
    }
    if (currentConversation) {
      conversations.push(currentConversation);
    }

    return {
      conversations,
      metadata: {
        importDate: new Date().toISOString(),
        format: 'markdown'
      }
    };
  }

  /**
   * 从纯文本格式导入
   */
  async importFromTxt(content, options = {}) {
    const conversations = [];
    const lines = content.split('\n');
    let currentConversation = null;
    let currentMessage = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测对话标题（以等号分隔）
      if (line && !line.startsWith('用户:') && !line.startsWith('助手:') && line.length > 0 && !line.includes('=')) {
        if (currentConversation) {
          conversations.push(currentConversation);
        }
        currentConversation = {
          id: `imported_${Date.now()}_${conversations.length}`,
          title: line,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        };
        currentMessage = null;
      }
      // 检测消息角色
      else if (line.startsWith('用户:') || line.startsWith('助手:')) {
        if (currentConversation) {
          const role = line.startsWith('用户:') ? 'user' : 'assistant';
          const content = line.substring(3).trim();

          if (currentMessage) {
            currentConversation.messages.push(currentMessage);
          }

          currentMessage = {
            id: `msg_${Date.now()}_${currentConversation.messages.length}`,
            role,
            content,
            timestamp: new Date().toISOString(),
            status: 'done'
          };
        }
      }
      // 收集消息内容
      else if (currentMessage && line) {
        currentMessage.content += (currentMessage.content ? '\n' : '') + line;
      }
    }

    // 添加最后一个对话和消息
    if (currentMessage) {
      if (currentConversation) {
        currentConversation.messages.push(currentMessage);
      }
    }
    if (currentConversation) {
      conversations.push(currentConversation);
    }

    return {
      conversations,
      metadata: {
        importDate: new Date().toISOString(),
        format: 'txt'
      }
    };
  }

  /**
   * 从CSV格式导入
   */
  async importFromCSV(content, options = {}) {
    const lines = content.split('\n').filter(line => line.trim());
    const conversations = [];

    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
      const columns = this.parseCSVLine(lines[i]);
      if (columns.length >= 4) {
        conversations.push({
          id: columns[0] || `imported_${Date.now()}_${i}`,
          title: columns[1] || `导入的对话 ${i}`,
          created_at: columns[2] || new Date().toISOString(),
          updated_at: columns[3] || new Date().toISOString(),
          messages: []
        });
      }
    }

    return {
      conversations,
      metadata: {
        importDate: new Date().toISOString(),
        format: 'csv'
      }
    };
  }

  /**
   * 解析CSV行
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * 获取支持的导入格式
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }
}

module.exports = ImportEngine;
