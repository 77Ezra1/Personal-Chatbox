/**
 * 配置管理器
 * 处理用户配置的 API 密钥和其他设置
 */

const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../../data/user-config.json');
    this.defaultConfig = {
      openai: {
        apiKey: '',
        enabled: false,
        model: 'gpt-3.5-turbo'
      },
      deepseek: {
        apiKey: '',
        enabled: false,
        model: 'deepseek-chat'
      },
      settings: {
        theme: 'light',
        language: 'zh',
        autoSave: true
      }
    };
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('[Config Manager] 创建默认配置');
      await this.saveConfig(this.defaultConfig);
      return this.defaultConfig;
    }
  }

  // 为了兼容性，添加 loadUserConfig 方法（目前不区分用户）
  async loadUserConfig(userId = null) {
    return await this.loadConfig();
  }

  async saveConfig(config) {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('[Config Manager] 保存配置失败:', error);
      return false;
    }
  }

  async updateApiKey(provider, apiKey) {
    const config = await this.loadConfig();
    if (config[provider]) {
      config[provider].apiKey = apiKey;
      config[provider].enabled = !!apiKey;
      await this.saveConfig(config);
      return true;
    }
    return false;
  }

  async getApiKey(provider) {
    const config = await this.loadConfig();
    return config[provider]?.apiKey || '';
  }

  async isProviderEnabled(provider) {
    const config = await this.loadConfig();
    return config[provider]?.enabled || false;
  }

  async testApiKey(provider, apiKey) {
    try {
      if (provider === 'openai') {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey });
        const response = await openai.models.list();
        return { success: true, message: 'OpenAI API 连接成功' };
      } else if (provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          return { success: true, message: 'DeepSeek API 连接成功' };
        } else {
          return { success: false, message: 'DeepSeek API 连接失败' };
        }
      }
      return { success: false, message: '不支持的提供商' };
    } catch (error) {
      return { success: false, message: `API 测试失败: ${error.message}` };
    }
  }
}

module.exports = ConfigManager;
