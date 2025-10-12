/**
 * 配置存储服务
 * 负责安全地存储和读取用户配置(包括 API Keys)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ConfigStorage {
  constructor() {
    this.configDir = path.join(process.cwd(), 'data');
    this.configFile = path.join(this.configDir, 'config.json');
    this.config = null;
    
    // 加密密钥(实际应用中应该从环境变量或更安全的地方获取)
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * 获取或创建加密密钥
   */
  getOrCreateEncryptionKey() {
    const keyFile = path.join(this.configDir, '.key');
    
    try {
      // 尝试读取现有密钥
      if (require('fs').existsSync(keyFile)) {
        return require('fs').readFileSync(keyFile, 'utf8');
      }
    } catch (error) {
      // 忽略错误,创建新密钥
    }
    
    // 创建新密钥
    const key = crypto.randomBytes(32).toString('hex');
    
    try {
      require('fs').mkdirSync(this.configDir, { recursive: true });
      require('fs').writeFileSync(keyFile, key, 'utf8');
    } catch (error) {
      console.error('创建加密密钥失败:', error);
    }
    
    return key;
  }

  /**
   * 加密数据
   */
  encrypt(text) {
    if (!text) return '';
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.substring(0, 32)),
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密数据
   */
  decrypt(text) {
    if (!text) return '';
    
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey.substring(0, 32)),
        iv
      );
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      return '';
    }
  }

  /**
   * 初始化配置存储
   */
  async initialize() {
    try {
      // 确保配置目录存在
      await fs.mkdir(this.configDir, { recursive: true });
      
      // 尝试加载现有配置
      await this.load();
      
      console.log('[ConfigStorage] 配置存储初始化完成');
    } catch (error) {
      console.error('[ConfigStorage] 初始化失败:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      services: {
        proxy: {
          enabled: false,
          protocol: 'http',
          host: '127.0.0.1',
          port: 7890
        },
        braveSearch: {
          enabled: false,
          apiKey: ''
        },
        github: {
          enabled: false,
          token: ''
        },
        notion: {
          enabled: false,
          token: ''
        },
        gmail: {
          enabled: false,
          clientId: '',
          clientSecret: '',
          refreshToken: ''
        },
        googleCalendar: {
          enabled: false,
          clientId: '',
          clientSecret: '',
          refreshToken: ''
        },
        deepseek: {
          enabled: true,
          apiKey: '',
          model: 'deepseek-chat'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 加载配置
   */
  async load() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      let loadedConfig = JSON.parse(data);
      loadedConfig = this.decryptConfig(loadedConfig);

      // 关键修复: 将加载的配置与默认配置深度合并
      const defaultConfig = this.getDefaultConfig();
      
      // 深度合并服务配置，确保每个服务都有完整的默认值
      const mergedServices = {};
      Object.keys(defaultConfig.services).forEach(serviceKey => {
        mergedServices[serviceKey] = {
          ...defaultConfig.services[serviceKey],
          ...(loadedConfig.services?.[serviceKey] || {})
        };
      });
      
      // 同时保留加载配置中可能存在的新服务
      if (loadedConfig.services) {
        Object.keys(loadedConfig.services).forEach(serviceKey => {
          if (!mergedServices[serviceKey]) {
            mergedServices[serviceKey] = loadedConfig.services[serviceKey];
          }
        });
      }
      
      this.config = { 
        ...defaultConfig, 
        ...loadedConfig, 
        services: mergedServices 
      };

      console.log('[ConfigStorage] 配置加载并合并成功');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在,使用默认配置
        this.config = this.getDefaultConfig();
        await this.save();
      } else {
        // 如果解析失败或文件损坏,也使用默认配置
        console.error('[ConfigStorage] 加载或解析配置文件失败,将使用默认配置:', error);
        this.config = this.getDefaultConfig();
      }
    }
  }

  /**
   * 保存配置
   */
  async save() {
    try {
      // 加密敏感字段
      const encrypted = this.encryptConfig(this.config);
      
      // 写入文件
      await fs.writeFile(
        this.configFile,
        JSON.stringify(encrypted, null, 2),
        'utf8'
      );
      
      console.log('[ConfigStorage] 配置保存成功');
    } catch (error) {
      console.error('[ConfigStorage] 保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 加密配置中的敏感字段
   */
  encryptConfig(config) {
    const encrypted = JSON.parse(JSON.stringify(config));
    
    // 加密各个服务的敏感字段
    if (encrypted.services.braveSearch?.apiKey) {
      encrypted.services.braveSearch.apiKey = this.encrypt(encrypted.services.braveSearch.apiKey);
    }
    
    if (encrypted.services.github?.token) {
      encrypted.services.github.token = this.encrypt(encrypted.services.github.token);
    }
    
    if (encrypted.services.notion?.token) {
      encrypted.services.notion.token = this.encrypt(encrypted.services.notion.token);
    }
    
    if (encrypted.services.gmail) {
      if (encrypted.services.gmail.clientId) {
        encrypted.services.gmail.clientId = this.encrypt(encrypted.services.gmail.clientId);
      }
      if (encrypted.services.gmail.clientSecret) {
        encrypted.services.gmail.clientSecret = this.encrypt(encrypted.services.gmail.clientSecret);
      }
      if (encrypted.services.gmail.refreshToken) {
        encrypted.services.gmail.refreshToken = this.encrypt(encrypted.services.gmail.refreshToken);
      }
    }
    
    if (encrypted.services.googleCalendar) {
      if (encrypted.services.googleCalendar.clientId) {
        encrypted.services.googleCalendar.clientId = this.encrypt(encrypted.services.googleCalendar.clientId);
      }
      if (encrypted.services.googleCalendar.clientSecret) {
        encrypted.services.googleCalendar.clientSecret = this.encrypt(encrypted.services.googleCalendar.clientSecret);
      }
      if (encrypted.services.googleCalendar.refreshToken) {
        encrypted.services.googleCalendar.refreshToken = this.encrypt(encrypted.services.googleCalendar.refreshToken);
      }
    }
    
    if (encrypted.services.deepseek?.apiKey) {
      encrypted.services.deepseek.apiKey = this.encrypt(encrypted.services.deepseek.apiKey);
    }
    
    return encrypted;
  }

  /**
   * 解密配置中的敏感字段
   */
  decryptConfig(encrypted) {
    const config = JSON.parse(JSON.stringify(encrypted));
    
    // 解密各个服务的敏感字段
    if (config.services.braveSearch?.apiKey) {
      config.services.braveSearch.apiKey = this.decrypt(config.services.braveSearch.apiKey);
    }
    
    if (config.services.github?.token) {
      config.services.github.token = this.decrypt(config.services.github.token);
    }
    
    if (config.services.notion?.token) {
      config.services.notion.token = this.decrypt(config.services.notion.token);
    }
    
    if (config.services.gmail) {
      if (config.services.gmail.clientId) {
        config.services.gmail.clientId = this.decrypt(config.services.gmail.clientId);
      }
      if (config.services.gmail.clientSecret) {
        config.services.gmail.clientSecret = this.decrypt(config.services.gmail.clientSecret);
      }
      if (config.services.gmail.refreshToken) {
        config.services.gmail.refreshToken = this.decrypt(config.services.gmail.refreshToken);
      }
    }
    
    if (config.services.googleCalendar) {
      if (config.services.googleCalendar.clientId) {
        config.services.googleCalendar.clientId = this.decrypt(config.services.googleCalendar.clientId);
      }
      if (config.services.googleCalendar.clientSecret) {
        config.services.googleCalendar.clientSecret = this.decrypt(config.services.googleCalendar.clientSecret);
      }
      if (config.services.googleCalendar.refreshToken) {
        config.services.googleCalendar.refreshToken = this.decrypt(config.services.googleCalendar.refreshToken);
      }
    }
    
    if (config.services.deepseek?.apiKey) {
      config.services.deepseek.apiKey = this.decrypt(config.services.deepseek.apiKey);
    }
    
    return config;
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 获取公开配置(不包含敏感信息)
   */
  getPublicConfig() {
    const config = JSON.parse(JSON.stringify(this.config));
    
    // 移除敏感字段,只保留状态信息
    Object.keys(config.services).forEach(serviceKey => {
      const service = config.services[serviceKey];
      
      // 保留 enabled 状态
      const enabled = service.enabled;
      
      // 检查是否已配置(有 API Key)
      let configured = false;
      if (serviceKey === 'braveSearch') {
        configured = !!service.apiKey;
      } else if (serviceKey === 'github') {
        configured = !!service.token;
      } else if (serviceKey === 'notion') {
        configured = !!service.token;
      } else if (serviceKey === 'gmail') {
        configured = !!(service.clientId && service.clientSecret);
      } else if (serviceKey === 'googleCalendar') {
        configured = !!(service.clientId && service.clientSecret);
      } else if (serviceKey === 'deepseek') {
        configured = !!service.apiKey;
      }
      
      // 替换为公开信息
      config.services[serviceKey] = {
        enabled,
        configured
      };
    });
    
    return config;
  }

  /**
   * 更新服务配置
   */
  async updateService(serviceKey, serviceConfig) {
    // 如果服务不存在,从默认配置中获取或创建新的
    if (!this.config.services[serviceKey]) {
      const defaultConfig = this.getDefaultConfig();
      if (defaultConfig.services[serviceKey]) {
        // 从默认配置中复制
        this.config.services[serviceKey] = { ...defaultConfig.services[serviceKey] };
        console.log(`[ConfigStorage] 自动添加缺失的服务配置: ${serviceKey}`);
      } else {
        // 创建空配置
        this.config.services[serviceKey] = {};
        console.log(`[ConfigStorage] 创建新的服务配置: ${serviceKey}`);
      }
    }
    
    // 更新配置
    this.config.services[serviceKey] = {
      ...this.config.services[serviceKey],
      ...serviceConfig
    };
    
    this.config.updatedAt = new Date().toISOString();
    
    // 保存到文件
    await this.save();
    
    return this.config.services[serviceKey];
  }

  /**
   * 获取服务配置
   */
  getServiceConfig(serviceKey) {
    // 如果配置不存在，返回默认配置
    if (!this.config.services[serviceKey]) {
      const defaultConfig = this.getDefaultConfig();
      return defaultConfig.services[serviceKey] || null;
    }
    return this.config.services[serviceKey];
  }

  /**
   * 更新服务配置(别名方法)
   */
  async updateServiceConfig(serviceKey, serviceConfig) {
    return await this.updateService(serviceKey, serviceConfig);
  }
}

// 导出单例
const configStorage = new ConfigStorage();

// 导出单例实例和获取函数
module.exports = configStorage;
module.exports.getConfigStorage = () => configStorage;

