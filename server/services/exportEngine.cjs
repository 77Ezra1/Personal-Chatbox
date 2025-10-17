/**
 * 导出引擎
 * 处理各种格式的导出功能
 */

const fs = require('fs').promises;
const path = require('path');

class ExportEngine {
  constructor() {
    this.supportedFormats = ['json', 'markdown', 'txt', 'csv', 'html'];
  }

  /**
   * 导出对话数据
   * @param {Array} conversations - 对话数据
   * @param {string} format - 导出格式
   * @param {Object} options - 导出选项
   */
  async exportConversations(conversations, format = 'json', options = {}) {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return this.exportToJSON(conversations, options);
        case 'markdown':
          return this.exportToMarkdown(conversations, options);
        case 'txt':
          return this.exportToTxt(conversations, options);
        case 'csv':
          return this.exportToCSV(conversations, options);
        case 'html':
          return this.exportToHTML(conversations, options);
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      throw new Error(`导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为JSON格式
   */
  async exportToJSON(conversations, options = {}) {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: conv.messages || []
      }))
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      mimeType: 'application/json',
      filename: `conversations_${new Date().toISOString().split('T')[0]}.json`
    };
  }

  /**
   * 导出为Markdown格式
   */
  async exportToMarkdown(conversations, options = {}) {
    let content = '# 对话导出\n\n';
    content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    conversations.forEach((conv, index) => {
      content += `## ${conv.title || `对话 ${index + 1}`}\n\n`;
      content += `**创建时间:** ${new Date(conv.created_at).toLocaleString('zh-CN')}\n\n`;

      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach(msg => {
          const role = msg.role === 'user' ? '用户' : '助手';
          content += `### ${role}\n\n`;
          content += `${msg.content}\n\n`;
          if (msg.attachments && msg.attachments.length > 0) {
            content += `**附件:** ${msg.attachments.map(att => att.name).join(', ')}\n\n`;
          }
        });
      }
      content += '---\n\n';
    });

    return {
      content,
      mimeType: 'text/markdown',
      filename: `conversations_${new Date().toISOString().split('T')[0]}.md`
    };
  }

  /**
   * 导出为纯文本格式
   */
  async exportToTxt(conversations, options = {}) {
    let content = '对话导出\n';
    content += '='.repeat(50) + '\n\n';
    content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    conversations.forEach((conv, index) => {
      content += `${conv.title || `对话 ${index + 1}`}\n`;
      content += '-'.repeat(30) + '\n\n';

      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach(msg => {
          const role = msg.role === 'user' ? '用户' : '助手';
          content += `${role}: ${msg.content}\n\n`;
        });
      }
      content += '\n';
    });

    return {
      content,
      mimeType: 'text/plain',
      filename: `conversations_${new Date().toISOString().split('T')[0]}.txt`
    };
  }

  /**
   * 导出为CSV格式
   */
  async exportToCSV(conversations, options = {}) {
    let content = '对话ID,标题,创建时间,更新时间,消息数量\n';

    conversations.forEach(conv => {
      const messageCount = conv.messages ? conv.messages.length : 0;
      content += `"${conv.id}","${conv.title || ''}","${conv.created_at}","${conv.updated_at}","${messageCount}"\n`;
    });

    return {
      content,
      mimeType: 'text/csv',
      filename: `conversations_${new Date().toISOString().split('T')[0]}.csv`
    };
  }

  /**
   * 导出为HTML格式
   */
  async exportToHTML(conversations, options = {}) {
    let content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>对话导出</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .conversation { margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 5px; }
        .user { background-color: #e3f2fd; }
        .assistant { background-color: #f5f5f5; }
        .metadata { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>对话导出</h1>
    <p class="metadata">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
`;

    conversations.forEach((conv, index) => {
      content += `    <div class="conversation">
        <h2>${conv.title || `对话 ${index + 1}`}</h2>
        <p class="metadata">创建时间: ${new Date(conv.created_at).toLocaleString('zh-CN')}</p>
`;

      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach(msg => {
          const roleClass = msg.role === 'user' ? 'user' : 'assistant';
          const roleText = msg.role === 'user' ? '用户' : '助手';
          content += `        <div class="message ${roleClass}">
            <strong>${roleText}:</strong><br>
            ${msg.content.replace(/\n/g, '<br>')}
        </div>
`;
        });
      }

      content += `    </div>
`;
    });

    content += `</body>
</html>`;

    return {
      content,
      mimeType: 'text/html',
      filename: `conversations_${new Date().toISOString().split('T')[0]}.html`
    };
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }
}

module.exports = ExportEngine;
