/**
 * 格式转换器
 * 处理不同格式之间的数据转换
 */

class FormatConverters {
  constructor() {
    // 暂时禁用外部依赖，使用内置功能
    // this.csv = require('csv-parser');
    // this.csvWriter = require('csv-writer');
    // this.markdownIt = require('markdown-it');
  }

  /**
   * 转换为 JSON 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToJSON(data, options = {}) {
    const {
      includeMetadata = true,
      includeFiles = false,
      prettyPrint = true
    } = options;

    const result = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      conversations: []
    };

    for (const conversation of data) {
      const conv = {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        messages: conversation.messages || []
      };

      if (includeMetadata && conversation.metadata) {
        conv.metadata = conversation.metadata;
      }

      if (includeFiles && conversation.files) {
        conv.files = conversation.files;
      }

      result.conversations.push(conv);
    }

    return prettyPrint ? JSON.stringify(result, null, 2) : JSON.stringify(result);
  }

  /**
   * 转换为 CSV 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToCSV(data, options = {}) {
    const {
      includeHeaders = true,
      separator = ',',
      encoding = 'utf8',
      dateFormat = 'YYYY-MM-DD HH:mm:ss'
    } = options;

    const rows = [];

    if (includeHeaders) {
      rows.push([
        'Conversation ID',
        'Conversation Title',
        'Message ID',
        'Role',
        'Content',
        'Created At',
        'Updated At'
      ]);
    }

    for (const conversation of data) {
      if (conversation.messages && conversation.messages.length > 0) {
        for (const message of conversation.messages) {
          rows.push([
            conversation.id,
            conversation.title,
            message.id,
            message.role,
            this.escapeCSV(message.content),
            this.formatDate(message.created_at, dateFormat),
            this.formatDate(message.updated_at, dateFormat)
          ]);
        }
      } else {
        // 没有消息的对话
        rows.push([
          conversation.id,
          conversation.title,
          '',
          '',
          '',
          this.formatDate(conversation.created_at, dateFormat),
          this.formatDate(conversation.updated_at, dateFormat)
        ]);
      }
    }

    return rows.map(row => row.join(separator)).join('\n');
  }

  /**
   * 转换为 Markdown 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToMarkdown(data, options = {}) {
    const {
      includeMetadata = true,
      includeTimestamps = true,
      includeRoles = true,
      toc = true
    } = options;

    let markdown = '# 对话导出\n\n';
    markdown += `导出时间: ${new Date().toLocaleString()}\n\n`;

    if (toc) {
      markdown += '## 目录\n\n';
      for (const conversation of data) {
        markdown += `- [${conversation.title}](#${this.slugify(conversation.title)})\n`;
      }
      markdown += '\n';
    }

    for (const conversation of data) {
      markdown += `## ${conversation.title}\n\n`;

      if (includeMetadata && conversation.metadata) {
        markdown += '### 元数据\n\n';
        markdown += `- 创建时间: ${conversation.created_at}\n`;
        markdown += `- 更新时间: ${conversation.updated_at}\n`;
        if (conversation.metadata.messageCount) {
          markdown += `- 消息数量: ${conversation.metadata.messageCount}\n`;
        }
        markdown += '\n';
      }

      if (conversation.messages && conversation.messages.length > 0) {
        markdown += '### 对话内容\n\n';

        for (const message of conversation.messages) {
          if (includeRoles) {
            markdown += `**${message.role}**:\n\n`;
          }

          markdown += `${message.content}\n\n`;

          if (includeTimestamps) {
            markdown += `*${this.formatDate(message.created_at)}*\n\n`;
          }
        }
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * 转换为 TXT 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToTXT(data, options = {}) {
    const {
      encoding = 'utf8',
      lineEnding = '\n',
      includeTimestamps = true,
      includeRoles = true
    } = options;

    let text = `对话导出\n`;
    text += `导出时间: ${new Date().toLocaleString()}\n`;
    text += `${'='.repeat(50)}\n\n`;

    for (const conversation of data) {
      text += `对话: ${conversation.title}\n`;
      text += `${'-'.repeat(30)}\n\n`;

      if (conversation.messages && conversation.messages.length > 0) {
        for (const message of conversation.messages) {
          if (includeRoles) {
            text += `${message.role.toUpperCase()}: `;
          }

          text += `${message.content}\n`;

          if (includeTimestamps) {
            text += `[${this.formatDate(message.created_at)}]\n`;
          }

          text += '\n';
        }
      }

      text += '\n';
    }

    return text;
  }

  /**
   * 转换为 HTML 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToHTML(data, options = {}) {
    const {
      includeCSS = true,
      includeJS = false,
      responsive = true,
      theme = 'light'
    } = options;

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>对话导出</title>`;

    if (includeCSS) {
      html += `
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .conversation { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .conversation-title { font-size: 1.5em; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 4px; }
        .message.user { background: #eff6ff; border-left: 4px solid #3b82f6; }
        .message.assistant { background: #f0fdf4; border-left: 4px solid #10b981; }
        .message.system { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .message-role { font-weight: bold; margin-bottom: 5px; }
        .message-content { line-height: 1.6; }
        .message-time { font-size: 0.8em; color: #6b7280; margin-top: 5px; }
        .metadata { background: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .metadata h3 { margin: 0 0 10px 0; font-size: 1.1em; }
        .metadata p { margin: 5px 0; color: #6b7280; }
    </style>`;
    }

    html += `
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>对话导出</h1>
            <p>导出时间: ${new Date().toLocaleString()}</p>
        </div>`;

    for (const conversation of data) {
      html += `
        <div class="conversation">
            <div class="conversation-title">${conversation.title}</div>`;

      if (conversation.metadata) {
        html += `
            <div class="metadata">
                <h3>元数据</h3>
                <p>创建时间: ${conversation.created_at}</p>
                <p>更新时间: ${conversation.updated_at}</p>
                ${conversation.metadata.messageCount ? `<p>消息数量: ${conversation.metadata.messageCount}</p>` : ''}
            </div>`;
      }

      if (conversation.messages && conversation.messages.length > 0) {
        for (const message of conversation.messages) {
          html += `
            <div class="message ${message.role}">
                <div class="message-role">${message.role.toUpperCase()}</div>
                <div class="message-content">${this.escapeHTML(message.content)}</div>
                <div class="message-time">${this.formatDate(message.created_at)}</div>
            </div>`;
        }
      }

      html += `
        </div>`;
    }

    html += `
    </div>`;

    if (includeJS) {
      html += `
    <script>
        // 添加交互功能
        document.addEventListener('DOMContentLoaded', function() {
            // 可以添加搜索、过滤等功能
        });
    </script>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * 转换为 PDF 格式
   * @param {Object} data - 数据
   * @param {Object} options - 选项
   */
  async convertToPDF(data, options = {}) {
    const {
      pageSize = 'A4',
      margins = { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize = 12,
      lineHeight = 1.5
    } = options;

    // 这里需要使用 puppeteer 或其他 PDF 生成库
    // 暂时返回 HTML 格式，实际实现中会转换为 PDF
    const html = await this.convertToHTML(data, {
      includeCSS: true,
      includeJS: false,
      responsive: false,
      theme: 'light'
    });

    // 实际实现中会使用 puppeteer 生成 PDF
    return html;
  }

  /**
   * 从 JSON 格式解析
   * @param {string} content - 内容
   * @param {string} format - 格式
   */
  async parseFromFormat(content, format) {
    switch (format) {
      case 'json':
        return JSON.parse(content);
      case 'csv':
        return await this.parseFromCSV(content);
      case 'markdown':
        return await this.parseFromMarkdown(content);
      case 'txt':
        return await this.parseFromTXT(content);
      default:
        throw new Error(`不支持的导入格式: ${format}`);
    }
  }

  /**
   * 从 CSV 格式解析
   * @param {string} content - 内容
   */
  async parseFromCSV(content) {
    return new Promise((resolve, reject) => {
      const results = [];
      const conversations = new Map();

      const parser = this.csv({
        headers: ['conversationId', 'conversationTitle', 'messageId', 'role', 'content', 'createdAt', 'updatedAt']
      });

      parser.on('data', (data) => {
        const conversationId = data.conversationId;

        if (!conversations.has(conversationId)) {
          conversations.set(conversationId, {
            id: conversationId,
            title: data.conversationTitle,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
            messages: []
          });
        }

        if (data.messageId && data.role && data.content) {
          conversations.get(conversationId).messages.push({
            id: data.messageId,
            role: data.role,
            content: data.content,
            created_at: data.createdAt,
            updated_at: data.updatedAt
          });
        }
      });

      parser.on('end', () => {
        resolve(Array.from(conversations.values()));
      });

      parser.on('error', reject);

      parser.write(content);
      parser.end();
    });
  }

  /**
   * 从 Markdown 格式解析
   * @param {string} content - 内容
   */
  async parseFromMarkdown(content) {
    const conversations = [];
    const lines = content.split('\n');
    let currentConversation = null;
    let currentMessage = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测对话标题
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        if (currentConversation) {
          conversations.push(currentConversation);
        }

        currentConversation = {
          id: require('uuid').v4(),
          title: line.substring(3).trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        };
        currentMessage = null;
      }
      // 检测消息角色
      else if (line.startsWith('**') && line.endsWith(':**')) {
        if (currentConversation) {
          currentMessage = {
            id: require('uuid').v4(),
            role: line.substring(2, line.length - 3).toLowerCase(),
            content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          currentConversation.messages.push(currentMessage);
        }
      }
      // 检测时间戳
      else if (line.startsWith('*') && line.endsWith('*')) {
        // 跳过时间戳行
        continue;
      }
      // 检测分隔符
      else if (line.startsWith('---')) {
        // 跳过分隔符
        continue;
      }
      // 普通内容
      else if (currentMessage && line.trim()) {
        currentMessage.content += line + '\n';
      }
    }

    if (currentConversation) {
      conversations.push(currentConversation);
    }

    return conversations;
  }

  /**
   * 从 TXT 格式解析
   * @param {string} content - 内容
   */
  async parseFromTXT(content) {
    const conversations = [];
    const lines = content.split('\n');
    let currentConversation = null;
    let currentMessage = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测对话标题
      if (line.startsWith('对话: ')) {
        if (currentConversation) {
          conversations.push(currentConversation);
        }

        currentConversation = {
          id: require('uuid').v4(),
          title: line.substring(4).trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        };
        currentMessage = null;
      }
      // 检测消息角色
      else if (line.match(/^[A-Z]+: /)) {
        if (currentConversation) {
          const roleMatch = line.match(/^([A-Z]+): (.*)/);
          if (roleMatch) {
            currentMessage = {
              id: require('uuid').v4(),
              role: roleMatch[1].toLowerCase(),
              content: roleMatch[2],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            currentConversation.messages.push(currentMessage);
          }
        }
      }
      // 检测时间戳
      else if (line.startsWith('[') && line.endsWith(']')) {
        // 跳过时间戳行
        continue;
      }
      // 普通内容
      else if (currentMessage && line.trim()) {
        currentMessage.content += line + '\n';
      }
    }

    if (currentConversation) {
      conversations.push(currentConversation);
    }

    return conversations;
  }

  /**
   * 转义 CSV 字段
   * @param {string} text - 文本
   */
  escapeCSV(text) {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  /**
   * 转义 HTML
   * @param {string} text - 文本
   */
  escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @param {string} format - 格式
   */
  formatDate(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 生成 URL 友好的 slug
   * @param {string} text - 文本
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = FormatConverters;
