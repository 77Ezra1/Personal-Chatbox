/**
 * AI-Life-System 后端服务器
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config.cjs');
const logger = require('./utils/logger.cjs');
const { errorHandler } = require('./utils/errors.cjs');
const { router: mcpRouter, initializeRouter } = require('./routes/mcp.cjs');
const { router: chatRouter, initializeRouter: initializeChatRouter } = require('./routes/chat.cjs');
const proxyRouter = require('./routes/proxy.cjs');
const authRouter = require('./routes/auth.cjs');

// 导入 MCP Manager
const MCPManager = require('./services/mcp-manager.cjs');

// 导入配置存储
const configStorage = require('./services/config-storage.cjs');

// 导入代理辅助工具
const { setupGlobalProxy } = require('./lib/proxy-helper.cjs');

// 导入服务
const WeatherService = require('./services/weather.cjs');
const TimeService = require('./services/time.cjs');
const SearchService = require('./services/search.cjs');
const GoogleSearchService = require('./services/google-search.cjs');
const YouTubeService = require('./services/youtube.cjs');
const CoincapService = require('./services/coincap.cjs');
const DexscreenerService = require('./services/dexscreener.cjs');
const FetchService = require('./services/fetch.cjs');
const PlaywrightBrowserService = require('./services/playwright-browser.cjs');

// 创建Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  ...config.server.cors,
  credentials: true // 允许携带Cookie
}));

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 服务实例
const services = {};

// MCP Manager 实例
const mcpManager = new MCPManager();

/**
 * 初始化所有服务
 */
async function initializeServices() {
  // 初始化配置存储
  logger.info('初始化配置存储...');
  await configStorage.initialize();
  
  // 加载并应用代理配置
  logger.info('加载代理配置...');
  try {
    const proxyConfig = await configStorage.getServiceConfig('proxy');
    if (proxyConfig && proxyConfig.enabled) {
      const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      logger.info(`✅ 已应用用户配置的代理: ${proxyUrl}`);
      
      // 设置全局代理（为MCP服务提供代理支持）
      await setupGlobalProxy();
      logger.info('✅ 全局代理已设置');
    } else {
      logger.info('ℹ️  未配置代理或代理已禁用');
    }
  } catch (error) {
    logger.warn('加载代理配置失败:', error.message);
  }
  
  logger.info('初始化MCP服务...');
  
  try {
    // ========== 初始化原有服务 ==========
    services.weather = new WeatherService(config.services.weather);
    services.time = new TimeService(config.services.time);
    services.search = new SearchService(config.services.search); // DuckDuckGo搜索
    services.youtube = new YouTubeService(config.services.youtube);
    services.dexscreener = new DexscreenerService({
      id: 'dexscreener',
      name: 'Dexscreener加密货币',
      description: '获取实时加密货币价格和市场数据',
      enabled: true,
      autoLoad: true
    });
    services.fetch = new FetchService(config.services.fetch);
    services.playwright = new PlaywrightBrowserService(config.services.playwright);
    
    // 初始化自动加载的原有服务
    for (const [id, service] of Object.entries(services)) {
      if (service.enabled && service.initialize) {
        logger.info(`自动加载服务: ${service.name}`);
        try {
          await service.initialize();
        } catch (error) {
          logger.error(`服务${service.name}初始化失败:`, error);
        }
      }
    }
    
    // ========== 初始化新的 MCP 服务 ==========
    logger.info('启动 MCP Manager...');
    
    // 启动第一批 MCP 服务 (不需要 API Key)
    const mcpServices = [
      'memory',
      'filesystem', 
      'git',
      'sequential_thinking',
      'sqlite',
      'wikipedia'
    ];
    
    // 启动第二批 MCP 服务 (需要 API Key,从配置系统读取)
    const mcpServicesWithConfig = [
      'brave_search',
      'github'
    ];
    
    for (const serviceId of mcpServices) {
      const serviceConfig = config.services[serviceId];
      if (serviceConfig && serviceConfig.enabled && serviceConfig.autoLoad) {
        try {
          logger.info(`启动 MCP 服务: ${serviceConfig.name}`);
          await mcpManager.startService(serviceConfig);
        } catch (error) {
          logger.error(`MCP 服务 ${serviceConfig.name} 启动失败:`, error);
          // 继续启动其他服务
        }
      }
    }
    
    // 启动需要 API Key 的服务
    for (const serviceId of mcpServicesWithConfig) {
      const serviceConfig = config.services[serviceId];
      if (serviceConfig && serviceConfig.enabled && serviceConfig.autoLoad) {
        try {
          // 将服务ID映射到配置存储的格式 (brave_search -> braveSearch)
          const configServiceId = serviceId === 'brave_search' ? 'braveSearch' : serviceId;
          
          // 从配置存储中读取 API Key
          const storedConfig = await configStorage.getServiceConfig(configServiceId);
          
          if (storedConfig && (storedConfig.apiKey || storedConfig.token)) {
            // 将 API Key 注入到环境变量中
            const configWithKey = { ...serviceConfig };
            
            // 根据服务类型设置不同的环境变量
            if (serviceId === 'brave_search') {
              configWithKey.env = {
                ...configWithKey.env,
                BRAVE_API_KEY: storedConfig.apiKey
              };
            } else if (serviceId === 'github') {
              configWithKey.env = {
                ...configWithKey.env,
                GITHUB_PERSONAL_ACCESS_TOKEN: storedConfig.token
              };
            }
            
            logger.info(`启动 MCP 服务: ${serviceConfig.name} (使用配置的 API Key)`);
            await mcpManager.startService(configWithKey);
          } else {
            logger.warn(`MCP 服务 ${serviceConfig.name} 需要配置 API Key,跳过启动`);
          }
        } catch (error) {
          logger.error(`MCP 服务 ${serviceConfig.name} 启动失败:`, error);
          // 继续启动其他服务
        }
      }
    }
    
    // 将 MCP Manager 添加到 services 中
    services.mcpManager = mcpManager;
    
    logger.info('服务初始化完成');
    logger.info(`MCP 服务状态:`, mcpManager.getStatus());
    
    // 初始化路由
    initializeRouter(services);
    initializeChatRouter(services);
    
  } catch (error) {
    logger.error('服务初始化失败:', error);
    throw error;
  }
}

// API路由
app.use('/api/auth', authRouter); // 认证路由
app.use('/api/user-data', require('./routes/user-data.cjs')); // 用户数据路由
app.use('/api/mcp', mcpRouter);
app.use('/api/chat', chatRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/config', require('./routes/config.cjs'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Life-System Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mcp: '/api/mcp'
    }
  });
});

// 错误处理
app.use(errorHandler);

/**
 * 启动服务器
 */
async function start() {
  try {
    // 初始化数据库
    logger.info('初始化数据库...');
    const { initDatabase } = require('./db/init.cjs');
    await initDatabase();
    logger.info('✅ 数据库初始化完成');
    
    // 初始化服务
    await initializeServices();
    
    // 启动HTTP服务器
    const port = config.server.port;
    const host = config.server.host;
    
    app.listen(port, host, () => {
      logger.info(`✅ 服务器已启动: http://${host}:${port}`);
      logger.info(`✅ 已加载 ${Object.keys(services).length} 个MCP服务`);
      
      // 打印启用的服务
      const enabledServices = Object.values(services)
        .filter(s => s.enabled)
        .map(s => s.name);
      logger.info(`✅ 已启用服务: ${enabledServices.join(', ')}`);
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号,正在关闭服务器...');
  
  // 停止所有原有服务
  for (const service of Object.values(services)) {
    if (service !== mcpManager && service.enabled && service.disable) {
      service.disable();
    }
  }
  
  // 停止所有 MCP 服务
  if (mcpManager) {
    await mcpManager.stopAll();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号,正在关闭服务器...');
  
  // 停止所有原有服务
  for (const service of Object.values(services)) {
    if (service !== mcpManager && service.enabled && service.disable) {
      service.disable();
    }
  }
  
  // 停止所有 MCP 服务
  if (mcpManager) {
    await mcpManager.stopAll();
  }
  
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  start();
}

module.exports = { app, services };

